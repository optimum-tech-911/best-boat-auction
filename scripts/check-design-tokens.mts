/**
 * DESIGN_SYSTEM.md rule 5: fail on raw colour literals (hex, rgb, hsl) and arbitrary
 * Tailwind values anywhere outside packages/ui/src/tokens. It also rejects colour
 * classes that are not tokens and Tailwind defaults that the preset removed, which
 * would otherwise render nothing.
 *
 *   node --experimental-strip-types scripts/check-design-tokens.mts
 *   node --experimental-strip-types scripts/check-design-tokens.mts --self-test
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const scanned = ["apps", "packages"];
const tokensDirectory = join("packages", "ui", "src", "tokens");
const extensions = /\.(?:ts|tsx|js|jsx|mjs|css)$/;
const skippedDirectories = new Set(["node_modules", ".next", ".open-next", ".wrangler", ".turbo", "dist", "tests", "test-results", "playwright-report", "output", "public", "scripts"]);

/** Colour names and shades that exist in the token palette. */
const palette: Record<string, readonly string[]> = {
  navy: ["950", "900", "700", "500"],
  ivory: ["100"],
  stone: ["100", "200", "300", "600"],
  mist: ["300"],
  teal: ["50", "700", "800"],
  orange: ["600", "800"],
  success: ["50", "700"],
  danger: ["50", "700"],
};
const removedPalette = "slate|gray|zinc|neutral|red|amber|yellow|lime|green|emerald|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black";
const colourUtilities = "bg|text|border(?:-[trblxy])?|ring|ring-offset|fill|stroke|outline|decoration|divide|placeholder|accent|caret|from|via|to";

interface Rule {
  name: string;
  pattern: RegExp;
  /** Class-name rules only apply to component sources, not to CSS. */
  markupOnly?: boolean;
  accept?: (match: RegExpExecArray) => boolean;
}

const corner = "(?:-(?:t|r|b|l|tl|tr|br|bl))?";

const rules: Rule[] = [
  { name: "raw hex colour", pattern: /(?<![\w&/-])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/gi },
  { name: "raw rgb/hsl colour", pattern: /\b(?:rgba?|hsla?)\(/gi },
  { name: "arbitrary Tailwind value", markupOnly: true, pattern: /(?<![\w$])[a-z][a-z0-9-]*-\[[^\]\s"'`]+\]/g },
  { name: "arbitrary Tailwind variant or property", markupOnly: true, pattern: /(?<=["'`\s])\[(?:&|@|[a-z-]+:)[^\]\s]*\]/g },
  { name: "colour outside the token palette", markupOnly: true, pattern: new RegExp(`(?<![\\w-])(?:${colourUtilities})-(?:${removedPalette})(?:-\\d{2,3})?(?![\\w-])`, "g") },
  {
    name: "shade outside the token palette",
    markupOnly: true,
    pattern: new RegExp(`(?<![\\w-])(?:${colourUtilities})-(navy|ivory|stone|mist|teal|orange|success|danger)-(\\d{2,3})(?![\\w-])`, "g"),
    accept: (match) => palette[match[1] ?? ""]?.includes(match[2] ?? "") ?? false,
  },
  { name: "type size outside the type tokens", markupOnly: true, pattern: /(?<![\w-])text-(?:xs|sm|base|lg|[2-9]?xl)(?![\w-])/g },
  { name: "font weight outside the type tokens", markupOnly: true, pattern: /(?<![\w-])font-(?:thin|extralight|light|bold|extrabold|black)(?![\w-])/g },
  { name: "radius outside the shape tokens", markupOnly: true, pattern: new RegExp(`(?<![\\w-])rounded${corner}(?:-(?:xl|2xl|3xl))?(?=["'\`\\s])`, "g"), accept: (match) => /-(?:none|xs|sm|md|lg|full)$/.test(match[0]) },
  { name: "shadow outside the two shadow tokens", markupOnly: true, pattern: /(?<![\w-])shadow(?:-(?:sm|md|lg|xl|2xl|inner))?(?=["'`\s])/g },
];

const isComment = (line: string) => /^\s*(?:\/\/|\/?\*)/.test(line);

export interface Violation {
  file: string;
  line: number;
  rule: string;
  text: string;
}

export function checkSource(source: string, file: string): Violation[] {
  const violations: Violation[] = [];
  const markup = !file.endsWith(".css");
  source.split("\n").forEach((line, index) => {
    if (isComment(line)) return;
    for (const rule of rules) {
      if (rule.markupOnly && !markup) continue;
      rule.pattern.lastIndex = 0;
      for (let match = rule.pattern.exec(line); match; match = rule.pattern.exec(line)) {
        if (rule.accept?.(match)) continue;
        violations.push({ file, line: index + 1, rule: rule.name, text: match[0] });
      }
    }
  });
  return violations;
}

function* sourceFiles(directory: string): Generator<string> {
  for (const entry of readdirSync(directory)) {
    if (skippedDirectories.has(entry)) continue;
    const path = join(directory, entry);
    if (relative(root, path) === tokensDirectory) continue;
    if (statSync(path).isDirectory()) yield* sourceFiles(path);
    else if (extensions.test(entry)) yield path;
  }
}

function selfTest(): void {
  const failing = [
    `<div className="bg-[#ff0000]" />`,
    `const style = { color: "#0B1F33" };`,
    `.card { background: rgba(6, 20, 32, .5); }`,
    `<p className="text-slate-500 text-sm font-bold" />`,
    `<p className="bg-stone-400 rounded-xl shadow-lg" />`,
    `<div className="w-[13px]" />`,
  ];
  const passing = [
    `<div className="bg-navy-900 text-ivory-100 type-body-m rounded-md shadow-dialog" />`,
    `<a href="#main-content" className="text-teal-700 border-stone-300 bg-chart-3" />`,
    `const index = items[count - 1];`,
    `.js [data-reveal][data-motion="waiting"] { opacity: 0; }`,
  ];
  const failures = failing.filter((sample) => checkSource(sample, "sample.tsx").length === 0);
  const falseAlarms = passing.flatMap((sample) => checkSource(sample, "sample.tsx"));
  if (failures.length || falseAlarms.length) {
    console.error("Self-test failed.", { undetected: failures, falseAlarms });
    process.exit(1);
  }
  console.log(`Self-test passed: ${failing.length} violations detected, ${passing.length} valid samples accepted.`);
}

function main(): void {
  if (process.argv.includes("--self-test")) return selfTest();
  const violations = scanned.flatMap((directory) => [...sourceFiles(join(root, directory))])
    .flatMap((path) => checkSource(readFileSync(path, "utf8"), relative(root, path)));
  if (violations.length) {
    for (const violation of violations) console.error(`${violation.file}:${violation.line}  ${violation.rule}: ${violation.text}`);
    console.error(`\n${violations.length} design token violation(s). Use the tokens of packages/ui/src/tokens.`);
    process.exit(1);
  }
  console.log("Design tokens: no violations.");
}

main();

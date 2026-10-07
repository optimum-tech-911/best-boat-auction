import { useId, type CSSProperties, type ReactNode } from "react";
import { cx } from "../components/primitives";

/*
 * SC-01 to SC-07 (DESIGN_V1_1.md section 4): hand-built SVG diagrams that scale through their
 * viewBox, use only tokens, take their text and values from props, and carry a title, a
 * description and a visually hidden text version. Wrap them in <Reveal kind="diagram"> for M16.
 */

interface FigureProps {
  title: string;
  /** The full content as text, for screen readers. */
  summary: string;
  tone?: "default" | "inverse";
  caption?: ReactNode;
  className?: string;
  children: ReactNode;
}

function Figure({ title, summary, tone = "default", caption, className, children }: FigureProps) {
  return (
    <figure className={cx(tone === "inverse" ? "text-ivory-100" : "text-navy-900", className)}>
      <span className="sr-only">{title}. {summary}</span>
      <div aria-hidden="true">{children}</div>
      {caption && <figcaption className={cx("mt-4 type-body-s", tone === "inverse" ? "text-mist-300" : "text-stone-600")}>{caption}</figcaption>}
    </figure>
  );
}

function Svg({ viewBox, title, className, children }: { viewBox: string; title: string; className?: string; children: ReactNode }) {
  const id = useId();
  return (
    <svg viewBox={viewBox} role="img" aria-labelledby={id} className={cx("block h-auto w-full overflow-visible font-sans", className)}>
      <title id={id}>{title}</title>
      {children}
    </svg>
  );
}

const nodeDelay = (index: number) => ({ "--node-index": index }) as CSSProperties;

/** Draws a diagram twice: 360 units wide below 768 px, so its labels stay legible on a phone, and 600 above. */
function Responsive({ draw }: { draw: (width: number, className: string) => ReactNode }) {
  return (
    <>
      {draw(360, "md:hidden")}
      {draw(600, "hidden md:block")}
    </>
  );
}

/* ------------------------------------------------------------------ SC-01 */

export interface JourneyStep {
  label: string;
  detail: string;
}

/** SC-01 sale journey: nodes on a line, horizontal on desktop and vertical on mobile. The mini version has three nodes. */
export function SaleJourneyDiagram({ title, steps, mini = false }: { title: string; steps: readonly JourneyStep[]; mini?: boolean }) {
  const summary = steps.map((step) => `${step.label} : ${step.detail}`).join(". ");
  return (
    <Figure title={title} summary={summary}>
      <ol className={cx("relative grid gap-6", mini ? "grid-cols-3 gap-3" : "md:grid-cols-6 md:gap-4")} style={{ "--steps": steps.length } as CSSProperties}>
        <span className={cx("diagram-line absolute bg-stone-300", mini ? "left-1 right-1 top-1 h-hairline" : "bottom-2 left-1 top-2 w-hairline md:bottom-auto md:left-1 md:right-1 md:top-1 md:h-hairline md:w-auto")} />
        {steps.map((step, index) => (
          <li key={step.label} className={cx("diagram-node relative flex flex-col gap-1", mini ? "pt-6" : "pl-6 md:pl-0 md:pt-6")} style={nodeDelay(index)}>
            <span className={cx("absolute size-dot rounded-full bg-navy-900", mini ? "left-0 top-0" : "left-0 top-2 md:top-0")} />
            <span className={cx("text-navy-900", mini ? "type-label" : "type-title-m")}>{step.label}</span>
            <span className="type-body-s text-stone-600">{step.detail}</span>
          </li>
        ))}
      </ol>
    </Figure>
  );
}

/* ------------------------------------------------------------------ SC-02 */

interface SoftCloseProps {
  title: string;
  /** Formatted times: the scheduled close, the late bid and the new close. */
  times: { start: string; scheduled: string; bid: string; newEnd: string; end: string };
  labels: { scheduled: string; bid: string; newEnd: string; window: string };
  caption: string;
}

/** SC-02 soft close: a time axis with the shaded closing window, a late bid and the new end. */
export function SoftCloseDiagram({ title, times, labels, caption }: SoftCloseProps) {
  const summary = `${times.scheduled} : ${labels.scheduled}. ${times.bid} : ${labels.bid}. ${times.newEnd} : ${labels.newEnd}. ${caption}`;
  return (
    <Figure title={title} summary={summary} caption={caption}>
      <Responsive draw={(width, className) => {
        // 19:55 → 20:03: eight minutes across the axis.
        const x = (minutes: number) => 36 + minutes * ((width - 72) / 8);
        return (
          <Svg viewBox={`0 0 ${width} 210`} title={title} className={className}>
            <rect x={x(0)} y={96} width={x(5) - x(0)} height={44} fill="var(--color-stone-200)" />
            <text x={x(2.5)} y={124} textAnchor="middle" className="fill-stone-600 type-caption">{labels.window}</text>
            <path className="diagram-line" pathLength={1} d={`M${x(0)} 140 H${x(8)}`} fill="none" stroke="var(--color-navy-900)" strokeWidth={1.5} />
            <g className="diagram-node" style={nodeDelay(0)}>
              <path d={`M${x(5)} 86 V150`} stroke="var(--color-stone-600)" strokeDasharray="3 4" />
              <text x={x(5)} y={62} textAnchor="middle" className="fill-current type-num-s">{times.scheduled}</text>
              <text x={x(5)} y={78} textAnchor="middle" className="fill-stone-600 type-caption">{labels.scheduled}</text>
            </g>
            <path className="diagram-line" pathLength={1} d={`M${x(2.5)} 118 V36 H${x(7.5)} V118`} fill="none" stroke="var(--color-navy-900)" strokeWidth={2} />
            <g className="diagram-node" style={nodeDelay(1)}>
              <circle cx={x(2.5)} cy={140} r={6} fill="var(--color-orange-600)" />
              <text x={x(2.5)} y={172} textAnchor="middle" className="fill-current type-num-s">{times.bid}</text>
              <text x={x(2.5)} y={190} textAnchor="middle" className="fill-stone-600 type-caption">{labels.bid}</text>
            </g>
            <g className="diagram-node" style={nodeDelay(2)}>
              <circle cx={x(7.5)} cy={140} r={6} fill="var(--color-navy-900)" />
              <text x={x(7.5)} y={172} textAnchor="middle" className="fill-current type-num-s">{times.newEnd}</text>
              <text x={x(7.5)} y={190} textAnchor="middle" className="fill-stone-600 type-caption">{labels.newEnd}</text>
            </g>
            <text x={x(0)} y={162} textAnchor="start" className="fill-stone-600 type-caption">{times.start}</text>
            <text x={x(8)} y={132} textAnchor="end" className="fill-stone-600 type-caption">{times.end}</text>
          </Svg>
        );
      }} />
    </Figure>
  );
}

/* ------------------------------------------------------------------ SC-03 */

interface EscrowProps {
  title: string;
  labels: { buyer: string; account: string; institution: string; seller: string; steps: readonly string[] };
  /** Tracker mode on after-sale pages: steps before it are done, it is current. */
  currentStep?: number;
  caption?: string;
}

/** SC-03 escrow flow: buyer → escrow account at a licensed institution → seller, with four numbered steps. */
export function EscrowDiagram({ title, labels, currentStep, caption }: EscrowProps) {
  const markerId = useId().replace(/:/g, "");
  const nodes = [labels.buyer, labels.account, labels.seller];
  const summary = `${labels.buyer} → ${labels.account} (${labels.institution}) → ${labels.seller}. ${labels.steps.map((step, index) => `${index + 1} ${step}`).join(" · ")}.`;
  return (
    <Figure title={title} summary={summary} caption={caption}>
      <Responsive draw={(width, className) => {
        const vertical = width < 600;
        // Horizontal from 768 px; stacked below, so the labels keep their size on a phone.
        const box = vertical ? { width: 260, height: 64 } : { width: 156, height: 64 };
        const position = (index: number) => (vertical ? { x: (width - box.width) / 2, y: 8 + index * 104 } : { x: index * 210 + 12, y: 20 });
        const arrows = vertical
          ? [`M${width / 2} 72 V108`, `M${width / 2} 176 V212`]
          : ["M168 52 H220", "M378 52 H430"];
        return (
          <Svg viewBox={vertical ? `0 0 ${width} 288` : "0 0 600 112"} title={title} className={className}>
            <defs>
              <marker id={`${markerId}-arrow-${width}`} viewBox="0 0 8 8" refX={7} refY={4} markerWidth={8} markerHeight={8} orient="auto">
                <path d="M0 0 L8 4 L0 8" fill="none" stroke="var(--color-navy-900)" strokeWidth={1.5} />
              </marker>
            </defs>
            {arrows.map((d) => (
              <path key={d} className="diagram-line" pathLength={1} d={d} fill="none" stroke="var(--color-navy-900)" strokeWidth={1.5} markerEnd={`url(#${markerId}-arrow-${width})`} />
            ))}
            {nodes.map((label, index) => {
              const { x, y } = position(index);
              const centre = x + box.width / 2;
              return (
                <g key={label} className="diagram-node" style={nodeDelay(index)}>
                  <rect x={x} y={y} width={box.width} height={box.height} rx={4} fill="var(--color-white)" stroke="var(--color-navy-900)" />
                  <text x={centre} y={y + (index === 1 ? 28 : 37)} textAnchor="middle" className="fill-current type-label">{label}</text>
                  {index === 1 && <text x={centre} y={y + 48} textAnchor="middle" className="fill-stone-600 type-caption">{labels.institution}</text>}
                </g>
              );
            })}
          </Svg>
        );
      }} />
      <ol className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {labels.steps.map((step, index) => {
          const number = index + 1;
          const done = currentStep !== undefined && number < currentStep;
          const current = currentStep === number;
          return (
            <li key={step} className="diagram-node flex items-center gap-3 type-body-s" style={nodeDelay(index + 3)}>
              <span className={cx("grid size-icon-l shrink-0 place-items-center rounded-sm border type-num-s",
                done ? "border-navy-900 bg-navy-900 text-ivory-100" : current ? "border-orange-600 text-orange-800" : currentStep !== undefined ? "border-stone-300 text-stone-600" : "border-stone-300 text-navy-900")}>
                {number}
              </span>
              <span className={cx(currentStep !== undefined && !done && !current ? "text-stone-600" : "text-navy-900")}>{step}</span>
              {current && <span aria-hidden="true" className="size-dot rounded-full bg-orange-600" />}
            </li>
          );
        })}
      </ol>
    </Figure>
  );
}

/* ------------------------------------------------------------------ SC-04 */

interface MaxBidProps {
  title: string;
  labels: { yours: string; rival: string; price: string };
  values: { yours: string; rival: string; price: string };
  /** Positions on the price scale, from 0 to 1. */
  positions: { yours: number; rival: number; price: number };
  leader: string;
  caption: string;
}

/** SC-04 maximum bid: a price scale with both maximums and the resulting price. */
export function MaximumBidDiagram({ title, labels, values, positions, leader, caption }: MaxBidProps) {
  const summary = `${labels.yours} : ${values.yours}. ${labels.rival} : ${values.rival}. ${labels.price} : ${values.price}. ${leader}.`;
  return (
    <Figure title={title} summary={summary} caption={caption}>
      <Responsive draw={(width, className) => {
        const x = (position: number) => 24 + Math.min(1, Math.max(0, position)) * (width - 48);
        const labelX = (position: number) => Math.min(width - 80, Math.max(80, x(position)));
        return (
          <Svg viewBox={`0 0 ${width} 150`} title={title} className={className}>
            <path className="diagram-line" pathLength={1} d={`M24 92 H${width - 24}`} stroke="var(--color-stone-300)" strokeWidth={2} />
            {([["yours", "var(--chart-1)", 26], ["rival", "var(--chart-4)", 130]] as const).map(([key, colour, labelY], index) => (
              <g key={key} className="diagram-node" style={nodeDelay(index)}>
                <path d={`M${x(positions[key])} 44 V110`} stroke={colour} strokeWidth={2} />
                <text x={labelX(positions[key])} y={labelY} textAnchor="middle" className="fill-current type-caption">{labels[key]} · {values[key]}</text>
              </g>
            ))}
            <g className="diagram-node" style={nodeDelay(2)}>
              <circle cx={x(positions.price)} cy={92} r={7} fill="var(--color-teal-700)" />
              <text x={labelX(positions.price)} y={74} textAnchor="middle" className="fill-current type-num-s">{values.price}</text>
            </g>
          </Svg>
        );
      }} />
      <p className="mt-2 type-title-m">{labels.price} : {values.price} · {leader}</p>
    </Figure>
  );
}

/* ------------------------------------------------------------- SC-05, SC-07 */

export interface BarSegment {
  label: string;
  /** Any positive quantity; shares are computed from the total. */
  value: number;
  /** Formatted value shown in the legend. */
  display: string;
}

const chart = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)", "var(--chart-7)"];

interface CostAnatomyProps {
  title: string;
  segments: readonly BarSegment[];
  formatShare: (share: number) => string;
  tone?: "default" | "inverse";
  /** Two legend columns from 640 px, or one for narrow panels. */
  legendColumns?: 1 | 2;
}

/** SC-05 cost anatomy: one 16 px stacked bar, largest first, with its legend. */
export function CostAnatomyDiagram({ title, segments, formatShare, tone = "default", legendColumns = 2 }: CostAnatomyProps) {
  const sorted = [...segments].filter((segment) => segment.value > 0).sort((a, b) => b.value - a.value);
  const total = sorted.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const summary = sorted.map((segment) => `${segment.label} : ${segment.display}, ${formatShare(segment.value / total)}`).join(". ");
  return (
    <Figure title={title} summary={summary} tone={tone}>
      <div className="flex h-icon-s w-full overflow-hidden rounded-sm">
        {sorted.map((segment, index) => (
          <span key={segment.label} className="diagram-node h-full" style={{ ...nodeDelay(index), width: `${(segment.value / total) * 100}%`, background: chart[index % chart.length] }} />
        ))}
      </div>
      <ul className={cx("mt-6 grid gap-x-6 gap-y-3", legendColumns === 2 && "sm:grid-cols-2")}>
        {sorted.map((segment, index) => (
          <li key={segment.label} className="flex items-baseline gap-3 type-body-s">
            <span className="size-swatch shrink-0" style={{ background: chart[index % chart.length] }} />
            <span className="min-w-0 flex-1">{segment.label}</span>
            <span className="type-num-s">{segment.display}</span>
            <span className={cx("w-12 text-right type-num-s", tone === "inverse" ? "text-mist-300" : "text-stone-600")}>{formatShare(segment.value / total)}</span>
          </li>
        ))}
      </ul>
    </Figure>
  );
}

/** SC-07 price breakdown: bid (chart-1), buyer's premium (chart-3) and VAT on it (chart-5), with the total. */
export function PriceBreakdownDiagram({ title, segments, total }: { title: string; segments: readonly [BarSegment, BarSegment, BarSegment]; total: { label: string; display: string } }) {
  const sum = segments.reduce((value, segment) => value + segment.value, 0) || 1;
  const colours = ["var(--chart-1)", "var(--chart-3)", "var(--chart-5)"];
  const summary = `${segments.map((segment) => `${segment.label} : ${segment.display}`).join(". ")}. ${total.label} : ${total.display}.`;
  return (
    <Figure title={title} summary={summary}>
      <div className="flex items-center gap-4">
        <div className="flex h-icon-s flex-1 overflow-hidden rounded-sm">
          {segments.map((segment, index) => <span key={segment.label} className="diagram-node h-full" style={{ ...nodeDelay(index), width: `${(segment.value / sum) * 100}%`, background: colours[index] }} />)}
        </div>
        <span className="type-title-m numerals">{total.display}</span>
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        {segments.map((segment, index) => (
          <li key={segment.label} className="flex items-center gap-2 type-body-s">
            <span className="size-swatch shrink-0" style={{ background: colours[index] }} />
            {segment.label}
            <span className="type-num-s">{segment.display}</span>
          </li>
        ))}
      </ul>
    </Figure>
  );
}

/* ------------------------------------------------------------------ SC-06 */

interface WaitingCostProps {
  title: string;
  /** The cumulative cost at 3, 6 and 12 months, formatted, and the yearly cost for the scale. */
  points: readonly { months: number; display: string; label: string }[];
  selectedMonths: number;
  tone?: "default" | "inverse";
}

/**
 * SC-06 cost of waiting: a 12-month axis with the cumulative cost as a line over an area; the
 * selected period is emphasised.
 */
export function WaitingCostDiagram({ title, points, selectedMonths, tone = "inverse" }: WaitingCostProps) {
  const summary = points.map((point) => `${point.label} : ${point.display}`).join(". ");
  const chart = { title, points, selectedMonths, tone };
  return (
    <Figure title={title} summary={summary} tone={tone}>
      <Responsive draw={(width, className) => <WaitingCostChart {...chart} width={width} className={className} />} />
    </Figure>
  );
}

function WaitingCostChart({ title, points, selectedMonths, tone, width, className }: Required<Omit<WaitingCostProps, "tone">> & Pick<WaitingCostProps, "tone"> & { width: number; className: string }) {
  const x = (months: number) => 40 + (months / 12) * (width - 80);
  const y = (months: number) => 160 - (months / 12) * 112;
  const labelX = (months: number) => Math.min(width - 52, x(months));
  const ink = tone === "inverse" ? "var(--color-ivory-100)" : "var(--color-navy-900)";
  return (
    <Svg viewBox={`0 0 ${width} 200`} title={title} className={className}>
      <path d={`M${x(0)} 160 L${x(12)} ${y(12)} L${x(12)} 160 Z`} fill={tone === "inverse" ? "var(--color-navy-700)" : "var(--color-stone-100)"} />
      <path className="diagram-line" pathLength={1} d={`M${x(0)} 160 L${x(12)} ${y(12)}`} fill="none" stroke={ink} strokeWidth={2} />
      <path d={`M${x(0)} 160 H${x(12)}`} stroke={ink} strokeOpacity={0.3} />
      {points.map((point, index) => {
        const selected = point.months === selectedMonths;
        return (
          <g key={point.months} className="diagram-node" style={nodeDelay(index)}>
            <path d={`M${x(point.months)} ${y(point.months)} V172`} stroke={ink} strokeOpacity={0.3} strokeDasharray="3 4" />
            <circle cx={x(point.months)} cy={y(point.months)} r={selected ? 7 : 4} fill={selected ? "var(--color-orange-600)" : ink} />
            <text x={labelX(point.months)} y={y(point.months) - 16} textAnchor="middle" className={cx("fill-current", selected ? "type-title-m" : "type-num-s")}>{point.display}</text>
            <text x={labelX(point.months)} y={190} textAnchor="middle" className="fill-current type-caption" opacity={0.8}>{point.label}</text>
          </g>
        );
      })}
    </Svg>
  );
}

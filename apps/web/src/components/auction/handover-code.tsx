/** The illustrative handover code of the demonstration. */
export const demoHandoverCode = "483729";

/** A deterministic, illustrative QR pattern: three finder squares and modules from the code. Not scannable. */
function IllustrativeQr({ code, label }: { code: string; label: string }) {
  const size = 25;
  const finder = (x: number, y: number) => x >= 0 && x < 7 && y >= 0 && y < 7;
  const inFinder = (x: number, y: number) => finder(x, y) || finder(x - (size - 7), y) || finder(x, y - (size - 7));
  let seed = [...code].reduce((value, digit) => value * 31 + digit.charCodeAt(0), 7);
  const modules: [number, number][] = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;
      if (!inFinder(x, y) && seed % 100 < 46) modules.push([x, y]);
    }
  }
  const finderSquare = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} fill="var(--color-navy-900)" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="var(--color-white)" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="var(--color-navy-900)" />
    </g>
  );
  return (
    <svg viewBox={`-2 -2 ${size + 4} ${size + 4}`} role="img" aria-label={label} className="size-qr-sm shrink-0 bg-white" shapeRendering="crispEdges">
      {modules.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="var(--color-navy-900)" />)}
      {finderSquare(0, 0)}
      {finderSquare(size - 7, 0)}
      {finderSquare(0, size - 7)}
    </svg>
  );
}

/** The handover code: six digits in num-l boxes, a QR code and its caption (AFT, H3 step 04). */
export function HandoverCode({ code, caption, demoLabel }: { code: string; caption: string; demoLabel: string }) {
  return (
    <div className="rounded-md border border-stone-300 bg-white p-6">
      <div className="flex flex-wrap items-center gap-6">
        <p className="flex gap-2">
          {/* Read digit by digit, as it is spoken at the handover. */}
          <span className="sr-only">{code.split("").join(" ")}</span>
          {code.split("").map((digit, index) => (
            <span key={index} aria-hidden="true" className="grid h-input-bid w-10 place-items-center rounded-sm border border-stone-300 bg-ivory-100 type-num-l text-navy-900">{digit}</span>
          ))}
        </p>
        <IllustrativeQr code={code} label={demoLabel} />
      </div>
      <p className="mt-4 type-body-m text-navy-900">{caption}</p>
      <p className="mt-1 type-caption text-stone-600">{demoLabel}</p>
    </div>
  );
}

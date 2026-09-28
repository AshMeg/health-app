import type { ReactNode } from "react";

import { seeded, type FlowerVariety } from "../model";
import type { FlowerRender, HiveRender, TreeRender } from "../styles";

/**
 * Illustrated garden objects. Every drawing is deterministic (seeded from the
 * record id) so a flower keeps its exact shape between visits, and every
 * style draws a complete object — a completed goal always has petals.
 */

const foliage = (share = 55) => `color-mix(in oklab, var(--g-foliage) ${share}%, var(--season-foliage))`;
const foliageLight = `color-mix(in oklab, var(--g-foliage-light) 60%, var(--season-foliage))`;
const foliageDark = `color-mix(in oklab, var(--g-foliage-dark) 70%, var(--season-foliage))`;

const petalCount: Record<FlowerVariety, number> = { daisy: 12, rose: 8, tulip: 6, bell: 5 };

/** Flower head drawn around (32, 22). `open` 0.6–1 scales the bloom. */
export function FlowerArt({
  render,
  variety,
  accent,
  open,
  height,
  seed,
}: {
  render: FlowerRender;
  variety: FlowerVariety;
  accent: string;
  open: number;
  height: number;
  seed: string;
}) {
  const petal = `var(--g-petal-${accent}, var(--${accent}))`;
  const shade = `color-mix(in oklab, ${petal} 78%, var(--g-foliage-dark))`;
  const light = `color-mix(in oklab, ${petal} 70%, white)`;
  const n = petalCount[variety] ?? 8;
  const r = 13 * open;
  const bend = (seeded(seed, 11) - 0.5) * 10;
  const H = height + 14;

  const stem = (
    <g>
      <path d={`M32 ${H} Q${32 + bend} ${H * 0.55} 32 ${22 + r * 0.4}`} stroke={foliageDark} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <path d={`M${32 + bend * 0.5} ${H * 0.7} q-12 -4 -15 -13 q10 1 15 13z`} fill={foliage(60)} />
      <path d={`M${32 + bend * 0.4} ${H * 0.55} q11 -3 14 -12 q-10 1 -14 12z`} fill={foliageLight} opacity={0.9} />
    </g>
  );

  let head: ReactNode;
  if (render === "painterly") {
    head = (
      <g filter="url(#garden-soft)">
        {Array.from({ length: 26 }, (_, i) => {
          const a = (i / 26) * Math.PI * 2 + seeded(seed, i) * 0.4;
          const d = r * (0.45 + seeded(seed, i + 40) * 0.6);
          return <ellipse key={i} cx={32 + Math.cos(a) * d} cy={22 + Math.sin(a) * d} rx={3.2 * open + 1} ry={2.4 * open + 1} fill={i % 3 ? petal : light} opacity={0.55 + seeded(seed, i + 7) * 0.4} transform={`rotate(${(a * 180) / Math.PI} ${32 + Math.cos(a) * d} ${22 + Math.sin(a) * d})`} />;
        })}
        <circle cx={32} cy={22} r={3.2 * open + 1} fill="var(--g-centre)" opacity={0.9} />
      </g>
    );
  } else if (render === "deco") {
    head = (
      <g>
        {Array.from({ length: 7 }, (_, i) => {
          const a = -90 + (i - 3) * 26;
          return (
            <path key={i} d={`M32 24 L${30} ${24 - r * 1.25} Q32 ${24 - r * 1.45} ${34} ${24 - r * 1.25} Z`} fill={i % 2 ? petal : shade} stroke="var(--g-accent-line)" strokeWidth={0.7} transform={`rotate(${a + 90} 32 24)`} />
          );
        })}
        <path d={`M${32 - r * 0.7} 24 A ${r * 0.7} ${r * 0.7} 0 0 1 ${32 + r * 0.7} 24 Z`} fill="var(--g-centre)" stroke="var(--g-accent-line)" strokeWidth={0.8} />
        <path d={`M${32 - r * 0.4} 24 A ${r * 0.4} ${r * 0.4} 0 0 1 ${32 + r * 0.4} 24`} fill="none" stroke="var(--g-accent-line)" strokeWidth={0.7} />
      </g>
    );
  } else if (render === "modern") {
    head = (
      <g>
        {Array.from({ length: Math.min(n, 6) }, (_, i) => (
          <ellipse key={i} cx={32} cy={22 - r * 0.6} rx={r * 0.38} ry={r * 0.62} fill={petal} stroke="var(--g-accent-line)" strokeWidth={0.6} transform={`rotate(${(360 / Math.min(n, 6)) * i} 32 22)`} />
        ))}
        <circle cx={32} cy={22} r={r * 0.28} fill="var(--g-centre)" />
      </g>
    );
  } else if (render === "sunlit") {
    head = (
      <g>
        {Array.from({ length: 4 }, (_, i) => (
          <path key={`b${i}`} d={`M32 22 C ${32 - r} ${22 - r * 0.2}, ${32 - r * 0.9} ${22 - r * 1.3}, 32 ${22 - r * 1.1} C ${32 + r * 0.9} ${22 - r * 1.3}, ${32 + r} ${22 - r * 0.2}, 32 22 Z`} fill={shade} transform={`rotate(${i * 90 + 45} 32 22)`} />
        ))}
        {Array.from({ length: 4 }, (_, i) => (
          <path key={`f${i}`} d={`M32 22 C ${32 - r * 0.8} ${22 - r * 0.2}, ${32 - r * 0.7} ${22 - r * 1.1}, 32 ${22 - r * 0.95} C ${32 + r * 0.7} ${22 - r * 1.1}, ${32 + r * 0.8} ${22 - r * 0.2}, 32 22 Z`} fill={petal} transform={`rotate(${i * 90} 32 22)`} />
        ))}
        <circle cx={32} cy={22} r={r * 0.3} fill="var(--g-foliage-dark)" />
        {Array.from({ length: 8 }, (_, i) => (
          <circle key={`s${i}`} cx={32 + Math.cos(i) * r * 0.42} cy={22 + Math.sin(i) * r * 0.42} r={0.9} fill="var(--g-centre)" />
        ))}
      </g>
    );
  } else {
    // Cottage: two layers of rounded petals with a stamen-dotted centre.
    const petalPath = (len: number, w: number) => `M32 22 C ${32 - w} ${22 - len * 0.4}, ${32 - w * 0.7} ${22 - len}, 32 ${22 - len} C ${32 + w * 0.7} ${22 - len}, ${32 + w} ${22 - len * 0.4}, 32 22 Z`;
    head = (
      <g>
        {Array.from({ length: n }, (_, i) => (
          <path key={`b${i}`} d={petalPath(r * 1.1, r * 0.42)} fill={shade} transform={`rotate(${(360 / n) * i + 180 / n} 32 22)`} />
        ))}
        {Array.from({ length: n }, (_, i) => (
          <path key={`f${i}`} d={petalPath(r * 0.95, r * 0.36)} fill={petal} transform={`rotate(${(360 / n) * i} 32 22)`} />
        ))}
        {Array.from({ length: n }, (_, i) => (
          <path key={`h${i}`} d={petalPath(r * 0.55, r * 0.12)} fill={light} opacity={0.6} transform={`rotate(${(360 / n) * i} 32 22)`} />
        ))}
        <circle cx={32} cy={22} r={r * 0.3 + 1} fill="var(--g-centre)" />
        {Array.from({ length: 7 }, (_, i) => (
          <circle key={`s${i}`} cx={32 + Math.cos(i * 0.9) * r * 0.2} cy={22 + Math.sin(i * 0.9) * r * 0.2} r={0.7} fill="var(--g-trunk)" opacity={0.7} />
        ))}
      </g>
    );
  }

  return (
    <>
      <ellipse cx={32} cy={H - 1} rx={10} ry={2.2} fill="var(--g-foliage-dark)" opacity={0.22} />
      {stem}
      {head}
    </>
  );
}

/** A tree for one year, drawn in a 150×200 box with its base at the bottom. */
export function TreeArt({ render, seed, blossoms }: { render: TreeRender; seed: string; blossoms: number }) {
  const s = (i: number, k = 0) => seeded(`${seed}-${i}`, k);
  const blossomDots = Array.from({ length: blossoms }, (_, i) => (
    <circle key={`bl${i}`} cx={35 + s(i, 1) * 80} cy={35 + s(i, 2) * 70} r={2.6} fill="var(--season-accent)" opacity={0.9} />
  ));
  const shadow = <ellipse cx={75} cy={197} rx={48} ry={5} fill="var(--g-foliage-dark)" opacity={0.25} />;

  if (render === "fan") {
    return (
      <>
        {shadow}
        <path d="M75 200 L75 95" stroke="var(--g-trunk)" strokeWidth={5} strokeLinecap="round" />
        <path d="M75 95 A 60 60 0 0 1 135 95 L75 95 A 60 60 0 0 1 15 95 Z" fill={foliage(70)} />
        <path d="M15 95 A 60 60 0 0 1 135 95 Z" fill={foliage(70)} />
        {Array.from({ length: 11 }, (_, i) => {
          const a = Math.PI + (i / 10) * Math.PI;
          return <path key={i} d={`M75 95 L${75 + Math.cos(a) * 60} ${95 + Math.sin(a) * 60}`} stroke="var(--g-accent-line)" strokeWidth={0.9} opacity={0.85} />;
        })}
        <path d="M15 95 A 60 60 0 0 1 135 95" fill="none" stroke="var(--g-accent-line)" strokeWidth={1.4} />
        <path d="M35 95 A 40 40 0 0 1 115 95" fill="none" stroke={foliageLight} strokeWidth={6} opacity={0.35} />
        {blossomDots}
      </>
    );
  }

  if (render === "birch") {
    return (
      <>
        {shadow}
        {[62, 84].map((x, t) => (
          <g key={x}>
            <path d={`M${x} 200 Q${x + (t ? 4 : -3)} 130 ${x + (t ? 8 : -6)} 55`} stroke="var(--g-trunk)" strokeWidth={t ? 5 : 6} fill="none" strokeLinecap="round" />
            {Array.from({ length: 6 }, (_, i) => (
              <path key={i} d={`M${x - 2} ${185 - i * 22} l4 -1`} stroke="var(--g-accent-line)" strokeWidth={1.3} opacity={0.7} />
            ))}
          </g>
        ))}
        {Array.from({ length: 34 }, (_, i) => (
          <ellipse key={i} cx={30 + s(i) * 90} cy={25 + s(i, 1) * 85} rx={6 + s(i, 2) * 6} ry={4 + s(i, 3) * 4} fill={i % 3 === 0 ? foliageLight : foliage(50)} opacity={0.75} />
        ))}
        {blossomDots}
      </>
    );
  }

  if (render === "olive") {
    return (
      <>
        {shadow}
        <path d="M70 200 C 60 170, 85 150, 72 120 C 66 105, 50 100, 40 92 M74 130 C 90 115, 100 110, 112 100" stroke="var(--g-trunk)" strokeWidth={8} fill="none" strokeLinecap="round" />
        {Array.from({ length: 30 }, (_, i) => {
          const cx = 20 + s(i) * 110;
          const cy = 55 + s(i, 1) * 50 - Math.abs(cx - 75) * 0.15;
          return <ellipse key={i} cx={cx} cy={cy} rx={11 + s(i, 2) * 10} ry={7 + s(i, 3) * 5} fill={i % 4 === 0 ? foliageLight : i % 3 === 0 ? foliageDark : foliage(45)} opacity={0.8} />;
        })}
        {blossomDots}
      </>
    );
  }

  // Oak (cottage) and dabbed (impressionist): clustered canopy with light from the upper left.
  const dabbed = render === "dabbed";
  const count = dabbed ? 70 : 24;
  const clumps = Array.from({ length: count }, (_, i) => {
    const a = s(i) * Math.PI * 2;
    const d = Math.sqrt(s(i, 1));
    return { x: 75 + Math.cos(a) * d * 52, y: 78 + Math.sin(a) * d * 46, r: dabbed ? 5 + s(i, 2) * 5 : 13 + s(i, 2) * 10, i };
  }).sort((a, b) => a.y - b.y);
  return (
    <>
      {shadow}
      <path d="M70 200 C 68 170, 72 150, 70 125 M71 140 C 60 125, 50 118, 42 108 M72 132 C 86 118, 98 112, 108 104" stroke="var(--g-trunk)" strokeWidth={dabbed ? 6 : 9} fill="none" strokeLinecap="round" />
      {dabbed ? (
        <g filter="url(#garden-soft)">
          {clumps.map((c) => (
            <ellipse key={c.i} cx={c.x} cy={c.y} rx={c.r} ry={c.r * 0.7} fill={c.y < 60 ? foliageLight : c.y > 100 ? foliageDark : foliage(55)} opacity={0.75} transform={`rotate(${s(c.i, 5) * 60 - 30} ${c.x} ${c.y})`} />
          ))}
        </g>
      ) : (
        <>
          {clumps.map((c) => <circle key={`d${c.i}`} cx={c.x + 2} cy={c.y + 5} r={c.r} fill={foliageDark} />)}
          {clumps.map((c) => <circle key={`m${c.i}`} cx={c.x} cy={c.y} r={c.r * 0.92} fill={foliage(55)} />)}
          {clumps.map((c) => <circle key={`l${c.i}`} cx={c.x - c.r * 0.3} cy={c.y - c.r * 0.35} r={c.r * 0.45} fill={foliageLight} opacity={0.55} />)}
        </>
      )}
      {blossomDots}
    </>
  );
}

/** The hive, 90×110. */
export function HiveArt({ render, layers }: { render: HiveRender; layers: number }) {
  const base = <ellipse cx={45} cy={107} rx={34} ry={3.5} fill="var(--g-foliage-dark)" opacity={0.25} />;
  if (render === "box") {
    return (
      <>
        {base}
        <path d="M20 104 L20 100 L70 100 L70 104" stroke="var(--g-hive-line)" strokeWidth={2} fill="none" />
        {Array.from({ length: layers }, (_, i) => (
          <rect key={i} x={24} y={98 - (i + 1) * 16} width={42} height={15} rx={1.5} fill="var(--g-hive)" stroke="var(--g-hive-line)" strokeWidth={1} />
        ))}
        <path d={`M20 ${98 - layers * 16} L45 ${86 - layers * 16} L70 ${98 - layers * 16} Z`} fill="var(--g-hive-line)" opacity={0.8} />
        <rect x={38} y={94} width={14} height={2.5} rx={1} fill="var(--g-accent-line)" />
      </>
    );
  }
  if (render === "stepped") {
    return (
      <>
        {base}
        {Array.from({ length: layers + 1 }, (_, i) => {
          const w = 64 - i * (48 / (layers + 1));
          return <rect key={i} x={45 - w / 2} y={100 - (i + 1) * 15} width={w} height={15} fill="var(--g-hive)" stroke="var(--g-hive-line)" strokeWidth={1.2} />;
        })}
        <path d="M45 8 L45 20" stroke="var(--g-hive-line)" strokeWidth={1.5} />
        <path d="M37 100 A 8 8 0 0 1 53 100 Z" fill="var(--g-foliage-dark)" opacity={0.7} />
      </>
    );
  }
  // Skep (straw dome) — cottage, impressionist and terracotta variants share the shape.
  return (
    <>
      {base}
      <path d="M18 104 L72 104 L66 92 L24 92 Z" fill="var(--g-trunk)" opacity={0.55} />
      {Array.from({ length: layers + 2 }, (_, i, arr) => {
        const t = (i + 0.5) / arr.length;
        const w = 22 + Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.5 + 0.2) * 40;
        const h = 76 / arr.length;
        return <rect key={i} x={45 - w / 2} y={16 + i * h} width={w} height={h + 1.5} rx={h / 2} fill="var(--g-hive)" stroke="var(--g-hive-line)" strokeWidth={1.1} />;
      })}
      <ellipse cx={45} cy={84} rx={6} ry={4.5} fill="var(--g-foliage-dark)" opacity={0.75} />
      {render === "terracotta" ? <path d="M30 60 Q45 56 60 60" stroke="var(--g-hive-line)" strokeWidth={1} fill="none" opacity={0.7} /> : null}
    </>
  );
}

export function Bee({ resting }: { resting?: boolean }) {
  return (
    <svg width={14} height={11} viewBox="0 0 14 11" aria-hidden className={resting ? "opacity-60 saturate-50" : undefined}>
      <ellipse cx={5} cy={3} rx={3} ry={2.2} fill="var(--garden-cloud)" opacity={0.85} />
      <ellipse cx={8.5} cy={2.6} rx={2.6} ry={2} fill="var(--garden-cloud)" opacity={0.75} />
      <ellipse cx={7} cy={7} rx={5} ry={3.4} fill="var(--caution)" />
      <path d="M5.5 4 L5.5 10 M8.5 4 L8.5 10" stroke="var(--g-accent-line, var(--stone))" strokeWidth={1.3} />
      <circle cx={11.6} cy={6.4} r={1.4} fill="var(--g-accent-line, var(--stone))" />
    </svg>
  );
}

export function ButterflyArt({ accent }: { accent: string }) {
  const c = `var(--g-petal-${accent}, var(--${accent}))`;
  const edge = `color-mix(in oklab, ${c} 70%, var(--g-foliage-dark))`;
  return (
    <svg width={28} height={22} viewBox="0 0 30 24" aria-hidden className="transition-transform group-hover:scale-125">
      <g style={{ transformOrigin: "15px 12px", animation: "garden-wing 0.7s ease-in-out infinite" }}>
        <path d="M15 12 C 4 -2, -2 10, 13 13 C 2 16, 6 24, 14 14 Z" fill={c} stroke={edge} strokeWidth={0.8} />
        <path d="M15 12 C 26 -2, 32 10, 17 13 C 28 16, 24 24, 16 14 Z" fill={c} stroke={edge} strokeWidth={0.8} />
        <circle cx={8} cy={7} r={1.6} fill="var(--garden-cloud)" opacity={0.85} />
        <circle cx={22} cy={7} r={1.6} fill="var(--garden-cloud)" opacity={0.85} />
      </g>
      <rect x={14.3} y={7} width={1.4} height={11} rx={0.7} fill="var(--g-accent-line, var(--stone))" />
    </svg>
  );
}

/** Shared SVG filters, rendered once per scene. */
export function GardenDefs() {
  return (
    <svg width={0} height={0} className="absolute" aria-hidden>
      <defs>
        <filter id="garden-soft">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>
    </svg>
  );
}

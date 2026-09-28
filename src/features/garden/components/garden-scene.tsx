import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import {
  monthNames,
  seeded,
  type GardenButterfly,
  type GardenFlower,
  type GardenMonth,
  type GardenYear,
  type GrowthStage,
  type HabitState,
  type Season,
} from "../model";

export const SCENE_HEIGHT = 640;
const GROUND_Y = 270;

const stageHeight: Record<GrowthStage, number> = { seedling: 34, bud: 54, bloom: 74, mature: 92 };
const stageBloom: Record<GrowthStage, number> = { seedling: 0, bud: 0.45, bloom: 0.8, mature: 1 };

export function sceneWidth(flowers: number, butterflies: number, years: number) {
  return Math.max(1100, 420 + years * 170 + Math.ceil(flowers / 3) * 110 + butterflies * 20);
}

/**
 * The illustrated meadow. Pure presentation — every element is positioned
 * deterministically from its id so the garden keeps its shape between visits
 * and simply spreads wider as it grows.
 */
export function GardenScene({
  season,
  width,
  flowers,
  butterflies,
  habits,
  years,
  months,
  onOpenYear,
  onOpenMonth,
  onOpenHive,
  onOpenMemory,
}: {
  season: Season;
  width: number;
  flowers: GardenFlower[];
  butterflies: GardenButterfly[];
  habits: HabitState[];
  years: GardenYear[];
  months: GardenMonth[];
  onOpenYear: (year: number) => void;
  onOpenMonth: (key: string) => void;
  onOpenHive: () => void;
  onOpenMemory: (id: string) => void;
}) {
  const treesEnd = 60 + years.length * 170;
  const hiveX = treesEnd + 30;
  const meadowStart = hiveX + 150;
  const meadowWidth = Math.max(300, width - meadowStart - 60);

  return (
    <div
      className={cn("garden-scene relative overflow-hidden", `season-${season}`)}
      style={{
        width,
        height: SCENE_HEIGHT,
        background:
          "linear-gradient(to bottom, var(--season-sky-top), var(--season-sky-bottom) 42%, var(--season-ground) 42%, var(--season-ground-deep))",
      }}
    >
      {/* Sun / cottage glow */}
      <div
        className="absolute rounded-full blur-2xl"
        style={{ left: width - 260, top: 30, width: 180, height: 180, background: "var(--season-sun)" }}
      />
      {/* Soft rolling hills */}
      <svg className="absolute inset-x-0" style={{ top: GROUND_Y - 70 }} width={width} height={120} aria-hidden>
        <path
          d={hills(width)}
          fill="var(--season-ground)"
          opacity={0.9}
        />
      </svg>

      <SeasonParticles season={season} width={width} />

      {/* Garden path along the bottom */}
      <svg className="absolute left-0" style={{ top: SCENE_HEIGHT - 90 }} width={width} height={90} aria-hidden>
        <path
          d={`M0 55 C ${width * 0.25} 25, ${width * 0.5} 80, ${width * 0.75} 45 S ${width} 60 ${width} 50 L ${width} 90 L 0 90 Z`}
          fill="var(--stone-soft)"
          opacity={0.75}
        />
      </svg>

      {/* Trees — one per year, each with its yearbook at its roots */}
      {years.map((y, i) => (
        <YearTree key={y.year} year={y} x={60 + i * 170} onOpen={() => onOpenYear(y.year)} />
      ))}

      <Hive x={hiveX} habits={habits} onOpen={onOpenHive} />

      {/* Wild grass tufts for texture */}
      {Array.from({ length: Math.floor(width / 60) }, (_, i) => (
        <svg
          key={`g-${i}`}
          aria-hidden
          className="absolute"
          style={{ left: i * 60 + seeded(`g${i}`) * 40, top: GROUND_Y + 40 + seeded(`g${i}`, 2) * 240 }}
          width={18}
          height={16}
        >
          <path d="M2 16 Q4 6 6 16 M8 16 Q9 2 11 16 M13 16 Q15 7 16 16" stroke="var(--season-foliage)" strokeWidth={1.5} fill="none" opacity={0.55} />
        </svg>
      ))}

      {/* Flowers — completed goals */}
      {flowers.map((f, i) => {
        const x = meadowStart + seeded(f.id) * meadowWidth;
        const y = GROUND_Y + 60 + seeded(f.id, 7) * 200 + (i % 3) * 6;
        return <Flower key={f.id} flower={f} x={x} y={y} />;
      })}

      {/* Butterflies — life memories */}
      {butterflies.map((b) => {
        const x = meadowStart + seeded(b.id, 3) * meadowWidth;
        const y = 120 + seeded(b.id, 5) * 220;
        return (
          <Butterfly key={b.id} x={x} y={y} seed={seeded(b.id, 9)} title={b.title} onOpen={() => onOpenMemory(b.id)} />
        );
      })}

      {/* Monthly books resting along the path */}
      {months.map((m, i) => (
        <button
          key={m.key}
          type="button"
          onClick={() => onOpenMonth(m.key)}
          title={`${monthNames[m.month]} ${m.year}`}
          aria-label={`Open ${monthNames[m.month]} ${m.year}`}
          className="group absolute flex flex-col items-center gap-1 transition-transform hover:-translate-y-1"
          style={{ left: 40 + i * 78, top: SCENE_HEIGHT - 70 }}
        >
          <svg width={34} height={30} aria-hidden>
            <path d="M3 5 Q17 1 17 6 Q17 1 31 5 L31 27 Q17 23 17 28 Q17 23 3 27 Z" fill="var(--card)" stroke="var(--stone)" strokeWidth={1} />
            <path d="M17 6 L17 28" stroke="var(--stone)" strokeWidth={0.8} />
            <rect x={6} y={10} width={8} height={1.5} rx={0.75} fill={`var(--${accentForMonth(m.month)})`} />
            <rect x={20} y={10} width={8} height={1.5} rx={0.75} fill={`var(--${accentForMonth(m.month)})`} />
          </svg>
          <span className="rounded-full bg-card/80 px-2 text-[10px] text-muted-foreground">
            {monthNames[m.month].slice(0, 3)} {String(m.year).slice(2)}
          </span>
        </button>
      ))}
    </div>
  );
}

function accentForMonth(month: number) {
  return (["sky", "lavender", "sage", "blush", "sage", "sky"] as const)[month % 6];
}

function hills(width: number) {
  let d = `M0 70`;
  for (let x = 0; x <= width; x += 240) d += ` Q ${x + 120} ${20 + (x % 480 ? 25 : 0)} ${x + 240} 70`;
  return `${d} L ${width} 120 L 0 120 Z`;
}

function SeasonParticles({ season, width }: { season: Season; width: number }) {
  const count = Math.floor(width / 110);
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const s = seeded(`p${i}`);
        const size = season === "winter" ? 5 : season === "autumn" ? 9 : 6;
        return (
          <span
            key={i}
            aria-hidden
            className="absolute"
            style={{
              left: s * width,
              top: -10,
              width: size,
              height: season === "autumn" ? size * 0.6 : size,
              borderRadius: season === "autumn" ? "70% 0" : "9999px",
              background: "var(--season-particle)",
              opacity: 0.8,
              animation: `garden-fall ${14 + seeded(`p${i}`, 2) * 12}s linear ${seeded(`p${i}`, 4) * 14}s infinite`,
            }}
          />
        );
      })}
    </>
  );
}

function YearTree({ year, x, onOpen }: { year: GardenYear; x: number; onOpen: () => void }) {
  const isCurrent = year.year === new Date().getFullYear();
  // A tree grows with the year: its canopy fills out as the months pass and memories gather.
  const monthsIn = isCurrent ? new Date().getMonth() + 1 : 12;
  const scale = 0.7 + Math.min(0.5, monthsIn / 40 + year.size / 30);
  const h = 190 * scale;
  return (
    <div className="absolute" style={{ left: x, top: GROUND_Y + 60 - h }}>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${year.year} Yearbook`}
        title={`${year.year} — open the Yearbook`}
        className="group block origin-bottom transition-transform hover:scale-[1.03]"
        style={{ animation: "garden-sway 9s ease-in-out infinite" }}
      >
        <svg width={140 * scale} height={h} viewBox="0 0 140 190" aria-hidden>
          <path d="M66 190 L68 110 Q60 95 48 90 M68 120 Q80 100 94 96 M70 190 L72 110" stroke="var(--stone)" strokeWidth={8} strokeLinecap="round" fill="none" />
          <circle cx={70} cy={70} r={52} fill="var(--season-foliage)" opacity={0.85} />
          <circle cx={38} cy={90} r={32} fill="var(--season-foliage)" opacity={0.7} />
          <circle cx={104} cy={88} r={34} fill="var(--season-foliage)" opacity={0.75} />
          <circle cx={72} cy={36} r={30} fill="var(--season-foliage)" opacity={0.6} />
          {Array.from({ length: Math.min(14, year.size + 3) }, (_, i) => (
            <circle key={i} cx={30 + seeded(`${year.year}${i}`) * 80} cy={30 + seeded(`${year.year}${i}`, 1) * 80} r={3.5} fill="var(--season-accent)" />
          ))}
        </svg>
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="mx-auto mt-1 flex items-center gap-1.5 rounded-full bg-card/85 px-3 py-1 text-xs shadow-soft transition hover:bg-card"
        style={{ marginLeft: (140 * scale) / 2 - 42 }}
      >
        <span aria-hidden>📚</span>
        {year.year}
      </button>
    </div>
  );
}

function Hive({ x, habits, onOpen }: { x: number; habits: HabitState[]; onOpen: () => void }) {
  const active = habits.filter((h) => h.active);
  const dormant = habits.length - active.length;
  const layers = Math.min(5, 2 + Math.floor(habits.reduce((n, h) => n + h.activityCount, 0) / 8));
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open your hive of habits"
      title="Your beehive of consistency"
      className="absolute flex flex-col items-center transition-transform hover:scale-105"
      style={{ left: x, top: GROUND_Y - 10 }}
    >
      <div className="relative" style={{ width: 90, height: 110 }}>
        <svg width={90} height={110} viewBox="0 0 90 110" aria-hidden>
          <path d="M44 0 L44 14" stroke="var(--stone)" strokeWidth={2} />
          {Array.from({ length: layers }, (_, i) => {
            const w = 30 + Math.sin(((i + 0.5) / layers) * Math.PI) * 30;
            return <rect key={i} x={45 - w / 2} y={14 + i * (70 / layers)} width={w} height={70 / layers + 2} rx={10} fill="var(--caution-soft)" stroke="var(--caution)" strokeWidth={1.2} />;
          })}
          <ellipse cx={45} cy={70} rx={5} ry={4} fill="var(--stone)" opacity={0.6} />
          <path d="M20 108 L70 108 L64 90 L26 90 Z" fill="var(--stone)" opacity={0.35} />
        </svg>
        {active.slice(0, 6).map((h, i) => (
          <span
            key={h.goalId}
            aria-hidden
            className="absolute text-sm"
            style={{ left: 38, top: 40, animation: `garden-buzz ${4 + i}s linear ${i * -0.7}s infinite` }}
          >
            🐝
          </span>
        ))}
        {Array.from({ length: Math.min(4, dormant) }, (_, i) => (
          <span key={i} aria-hidden className="absolute text-[11px] opacity-60 grayscale" style={{ left: 18 + i * 14, top: 92 }}>
            🐝
          </span>
        ))}
      </div>
      <span className="mt-1 rounded-full bg-card/85 px-3 py-1 text-xs shadow-soft">
        {habits.length ? `${active.length} buzzing${dormant ? ` · ${dormant} resting` : ""}` : "Your hive"}
      </span>
    </button>
  );
}

function Flower({ flower, x, y }: { flower: GardenFlower; x: number; y: number }) {
  const h = stageHeight[flower.stage];
  const bloom = stageBloom[flower.stage];
  const petals = flower.variety === "daisy" ? 8 : flower.variety === "rose" ? 6 : 5;
  const color = `var(--${flower.accent})`;
  return (
    <Link
      to="/goals/$goalId"
      params={{ goalId: flower.goalId }}
      title={flower.title}
      aria-label={`${flower.title} — completed goal`}
      className="group absolute flex flex-col items-center"
      style={{ left: x - 30, top: y - h, zIndex: Math.round(y) }}
    >
      <svg
        width={60}
        height={h + 12}
        viewBox={`0 0 60 ${h + 12}`}
        className="origin-bottom transition-transform duration-300 group-hover:scale-110"
        style={{ animation: `garden-sway ${6 + (x % 4)}s ease-in-out infinite` }}
        aria-hidden
      >
        <path d={`M30 ${h + 12} Q${26 + (x % 8)} ${h / 2} 30 20`} stroke="var(--season-foliage)" strokeWidth={2.5} fill="none" />
        <ellipse cx={22} cy={h * 0.7} rx={7} ry={3} fill="var(--season-foliage)" transform={`rotate(-30 22 ${h * 0.7})`} />
        {bloom === 0 ? (
          <ellipse cx={30} cy={20} rx={5} ry={7} fill="var(--season-foliage)" />
        ) : flower.variety === "tulip" ? (
          <path d={`M${30 - 11 * bloom} 22 Q30 ${22 - 22 * bloom} ${30 + 11 * bloom} 22 Q30 ${30} ${30 - 11 * bloom} 22`} fill={color} />
        ) : flower.variety === "bell" ? (
          <path d={`M${30 - 10 * bloom} 14 Q30 ${2} ${30 + 10 * bloom} 14 L${30 + 13 * bloom} 28 Q30 24 ${30 - 13 * bloom} 28 Z`} fill={color} />
        ) : (
          <g>
            {Array.from({ length: petals }, (_, i) => (
              <ellipse
                key={i}
                cx={30}
                cy={20 - 8 * bloom}
                rx={4 + 2 * bloom}
                ry={8 * bloom + 2}
                fill={color}
                opacity={0.9}
                transform={`rotate(${(360 / petals) * i} 30 20)`}
              />
            ))}
            <circle cx={30} cy={20} r={4 + bloom * 2} fill="var(--caution)" />
          </g>
        )}
      </svg>
      <span className="pointer-events-none -mt-1 max-w-[120px] truncate rounded-full bg-card/90 px-2 py-0.5 text-[11px] opacity-0 shadow-soft transition group-hover:opacity-100 group-focus-visible:opacity-100">
        {flower.title}
      </span>
    </Link>
  );
}

function Butterfly({
  x,
  y,
  seed,
  title,
  onOpen,
}: {
  x: number;
  y: number;
  seed: number;
  title: string;
  onOpen: () => void;
}) {
  const colors = ["lavender", "blush", "sky", "caution"];
  const color = `var(--${colors[Math.floor(seed * colors.length)]})`;
  return (
    <button
      type="button"
      onClick={onOpen}
      title={title}
      aria-label={`${title} — life memory`}
      className="group absolute z-[999]"
      style={{ left: x, top: y, animation: `garden-flutter ${10 + seed * 8}s ease-in-out ${-seed * 10}s infinite` }}
    >
      <svg width={30} height={24} viewBox="0 0 30 24" className="transition-transform group-hover:scale-125" aria-hidden>
        <g style={{ transformOrigin: "15px 12px", animation: "garden-wing 0.6s ease-in-out infinite" }}>
          <path d="M15 12 C 4 -2, -2 10, 13 13 C 2 16, 6 24, 14 14 Z" fill={color} opacity={0.9} />
          <path d="M15 12 C 26 -2, 32 10, 17 13 C 28 16, 24 24, 16 14 Z" fill={color} opacity={0.9} />
        </g>
        <rect x={14.2} y={7} width={1.6} height={11} rx={0.8} fill="var(--stone)" />
      </svg>
    </button>
  );
}

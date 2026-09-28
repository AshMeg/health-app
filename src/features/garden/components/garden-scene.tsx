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
import type { GardenStyle } from "../styles";
import type { TimeOfDay, Weather } from "../atmosphere";
import { Bee, ButterflyArt, FlowerArt, GardenDefs, HiveArt, TreeArt } from "./garden-art";

export const SCENE_HEIGHT = 640;
const TILE = 1920;

const stageHeight: Record<GrowthStage, number> = { seedling: 44, bud: 60, bloom: 78, mature: 96 };
/** Every completed goal is a full flower; stage only changes size and openness, never removes petals. */
const stageBloom: Record<GrowthStage, number> = { seedling: 0.62, bud: 0.72, bloom: 0.86, mature: 1 };

/** The painting is recoloured per season, so every style works in every season. */
const seasonFilter: Record<Season, string> = {
  spring: "saturate(1.05) hue-rotate(-6deg) brightness(1.03)",
  summer: "saturate(1.08)",
  autumn: "sepia(0.35) hue-rotate(-18deg) saturate(1.25) brightness(0.98)",
  winter: "grayscale(0.55) brightness(1.1) contrast(0.92) hue-rotate(10deg)",
};

export function sceneWidth(flowers: number, butterflies: number, years: number) {
  return Math.max(1100, 420 + years * 180 + Math.ceil(flowers / 3) * 110 + butterflies * 20);
}

/**
 * The illustrated garden. A painted environment for the chosen style,
 * recoloured by season and lit by time of day and real weather, with every
 * Bloom record drawn on top as its own interactive object. Positions are
 * seeded from ids so the garden keeps its shape and simply grows wider.
 */
export function GardenScene({
  season,
  width,
  flowers,
  butterflies,
  habits,
  years,
  months,
  gardenStyle,
  time = "day",
  weather = null,
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
  gardenStyle: GardenStyle;
  time?: TimeOfDay;
  weather?: Weather | null;
  onOpenYear: (year: number) => void;
  onOpenMonth: (key: string) => void;
  onOpenHive: () => void;
  onOpenMemory: (id: string) => void;
}) {
  const ground = Math.round(gardenStyle.horizon * SCENE_HEIGHT);
  const treesEnd = 60 + years.length * 180;
  const hiveX = treesEnd + 30;
  const meadowStart = hiveX + 150;
  const meadowWidth = Math.max(300, width - meadowStart - 60);
  const tiles = Math.ceil(width / TILE);
  // Wind speeds up the sway a little — never more than twice as fast.
  const sway = weather ? Math.max(0.5, 1 - weather.windKmh / 60) : 1;
  const snowing = weather?.kind === "snow";

  // Order flowers into gentle drifts rather than a grid: rows by depth, spread by seed.
  const placed = flowers.map((f, i) => {
    const x = meadowStart + 20 + seeded(f.id) * (meadowWidth - 40);
    const y = ground + 80 + seeded(f.id, 7) * (SCENE_HEIGHT - ground - 190) + (i % 3) * 5;
    return { f, x, y };
  });

  return (
    <div
      className={cn("garden-scene relative overflow-hidden bg-muted", `season-${season}`, `garden-style-${gardenStyle.id}`)}
      style={{ width, height: SCENE_HEIGHT, ["--garden-sway" as string]: sway }}
    >
      <GardenDefs />
      {/* Painted environment, mirrored on every other tile so the landscape flows seamlessly */}
      <div className="absolute inset-0 flex" style={{ filter: seasonFilter[season] }} aria-hidden>
        {Array.from({ length: tiles }, (_, i) => (
          <img
            key={i}
            src={gardenStyle.image}
            alt=""
            width={TILE}
            height={SCENE_HEIGHT}
            loading={i === 0 ? "eager" : "lazy"}
            draggable={false}
            className="h-full max-w-none shrink-0 select-none"
            style={{ width: TILE, transform: i % 2 ? "scaleX(-1)" : undefined }}
          />
        ))}
      </div>
      {season === "winter" || snowing ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{ top: ground - 20, background: "linear-gradient(to bottom, transparent, color-mix(in oklab, var(--garden-snow) 55%, transparent) 30%, color-mix(in oklab, var(--garden-snow) 70%, transparent))" }} aria-hidden />
      ) : null}

      <Sky width={width} ground={ground} time={time} weather={weather} />
      <SeasonParticles season={snowing ? "winter" : season} width={width} />

      {/* Trees — one per year, each with its yearbook at its roots */}
      {years.map((y, i) => (
        <YearTree key={y.year} year={y} x={60 + i * 180} baseY={ground + 95} render={gardenStyle.tree} onOpen={() => onOpenYear(y.year)} />
      ))}

      <Hive x={hiveX} top={ground - 5} habits={habits} render={gardenStyle.hive} onOpen={onOpenHive} />

      {/* Foreground grasses for depth */}
      <Grasses width={width} ground={ground} />

      {/* Flowers — completed goals */}
      {placed.map(({ f, x, y }) => (
        <Flower key={f.id} flower={f} x={x} y={y} render={gardenStyle.flower} />
      ))}

      {/* Butterflies — memories planted in the Garden */}
      {butterflies.map((b) => {
        const x = meadowStart + seeded(b.id, 3) * meadowWidth;
        const y = ground - 150 + seeded(b.id, 5) * 220;
        return <Butterfly key={b.id} x={x} y={y} seed={seeded(b.id, 9)} title={b.title} onOpen={() => onOpenMemory(b.id)} />;
      })}

      {/* Monthly books resting along the path */}
      {months.map((m, i) => (
        <button
          key={m.key}
          type="button"
          onClick={() => onOpenMonth(m.key)}
          title={`${monthNames[m.month]} ${m.year}`}
          aria-label={`Open ${monthNames[m.month]} ${m.year} — monthly book`}
          className="group absolute flex flex-col items-center gap-1 transition-transform hover:-translate-y-1"
          style={{ left: 40 + i * 78, top: SCENE_HEIGHT - 70, zIndex: SCENE_HEIGHT }}
        >
          <svg width={36} height={30} aria-hidden>
            <ellipse cx={18} cy={28} rx={15} ry={2} fill="var(--g-foliage-dark)" opacity={0.3} />
            <path d="M3 5 Q17 1 18 6 Q19 1 33 5 L33 26 Q19 22 18 27 Q17 22 3 26 Z" fill="var(--card)" stroke="var(--g-accent-line)" strokeWidth={1} />
            <path d="M18 6 L18 27" stroke="var(--g-accent-line)" strokeWidth={0.8} />
            <rect x={6} y={10} width={9} height={1.5} rx={0.75} fill={`var(--g-petal-${accentForMonth(m.month)})`} />
            <rect x={21} y={10} width={9} height={1.5} rx={0.75} fill={`var(--g-petal-${accentForMonth(m.month)})`} />
            <rect x={6} y={14} width={7} height={1} rx={0.5} fill="var(--g-accent-line)" opacity={0.4} />
            <rect x={21} y={14} width={7} height={1} rx={0.5} fill="var(--g-accent-line)" opacity={0.4} />
          </svg>
          <span className="rounded-full bg-card/85 px-2 text-[10px] text-muted-foreground backdrop-blur-sm">
            {monthNames[m.month].slice(0, 3)} {String(m.year).slice(2)}
          </span>
        </button>
      ))}

      <Light time={time} weather={weather} />
    </div>
  );
}

function accentForMonth(month: number) {
  return (["sky", "lavender", "sage", "blush", "sage", "sky"] as const)[month % 6];
}

/** Clouds, stars and sun — calm, never a weather app. */
function Sky({ width, ground, time, weather }: { width: number; ground: number; time: TimeOfDay; weather: Weather | null }) {
  const cover = weather ? weather.cloudCover : 0;
  const clouds = weather ? Math.round((cover / 100) * (width / 260)) : 0;
  const rainy = weather?.kind === "rain" || weather?.kind === "storm";
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {time === "night" && cover < 70
        ? Array.from({ length: Math.floor(width / 40) }, (_, i) => (
            <span key={i} className="absolute rounded-full" style={{ left: seeded(`st${i}`) * width, top: seeded(`st${i}`, 1) * (ground * 0.6), width: 2, height: 2, background: "var(--garden-star)", animation: `garden-twinkle ${3 + seeded(`st${i}`, 2) * 4}s ease-in-out infinite` }} />
          ))
        : null}
      {weather?.kind === "clear" && time !== "night" ? (
        <div className="absolute rounded-full blur-3xl" style={{ right: 120, top: 10, width: 220, height: 220, background: "var(--garden-sunlight)", opacity: 0.55 }} />
      ) : null}
      {Array.from({ length: clouds }, (_, i) => (
        <div key={i} className="absolute inset-x-0" style={{ top: 10 + seeded(`c${i}`) * (ground * 0.45), animation: `garden-drift ${160 + seeded(`c${i}`, 1) * 120}s linear ${-seeded(`c${i}`, 2) * 200}s infinite` }}>
          <div className="rounded-full blur-2xl" style={{ width: 240 + seeded(`c${i}`, 3) * 200, height: 60 + seeded(`c${i}`, 4) * 40, background: rainy ? "var(--garden-storm)" : "var(--garden-cloud)", opacity: rainy ? 0.45 : 0.7 }} />
        </div>
      ))}
      {rainy
        ? Array.from({ length: Math.floor(width / 18) }, (_, i) => (
            <span key={i} className="absolute" style={{ left: seeded(`r${i}`) * width, top: -40, width: 1, height: 16, background: "var(--garden-rain)", opacity: 0.55, transform: "rotate(8deg)", animation: `garden-rain ${1.1 + seeded(`r${i}`, 1) * 0.8}s linear ${-seeded(`r${i}`, 2) * 2}s infinite` }} />
          ))
        : null}
      {weather?.kind === "fog" ? <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 20%, color-mix(in oklab, var(--garden-cloud) 55%, transparent) 60%, transparent)" }} /> : null}
    </div>
  );
}

/** Time-of-day and weather light, over everything but never blocking it. */
function Light({ time, weather }: { time: TimeOfDay; weather: Weather | null }) {
  const grey = weather && (weather.kind === "rain" || weather.kind === "storm" || weather.cloudCover > 75);
  const layers: { bg: string; opacity: number; blend: "multiply" | "soft-light" | "screen" }[] = [];
  if (time === "morning") layers.push({ bg: "linear-gradient(120deg, var(--garden-morning), transparent 70%)", opacity: 0.35, blend: "soft-light" });
  if (time === "evening") layers.push({ bg: "linear-gradient(to bottom, transparent, var(--garden-evening))", opacity: 0.35, blend: "multiply" });
  if (time === "night") layers.push({ bg: "var(--garden-night)", opacity: 0.38, blend: "multiply" });
  if (grey) layers.push({ bg: "var(--garden-storm)", opacity: 0.18, blend: "multiply" });
  return (
    <>
      {layers.map((l, i) => (
        <div key={i} aria-hidden className="pointer-events-none absolute inset-0" style={{ background: l.bg, opacity: l.opacity, mixBlendMode: l.blend, zIndex: 2000 }} />
      ))}
    </>
  );
}

function Grasses({ width, ground }: { width: number; ground: number }) {
  return (
    <>
      {Array.from({ length: Math.floor(width / 34) }, (_, i) => {
        const k = `g${i}`;
        const top = ground + 60 + seeded(k, 2) * (SCENE_HEIGHT - ground - 80);
        const h = 12 + seeded(k, 3) * 14;
        return (
          <svg key={k} aria-hidden className="pointer-events-none absolute origin-bottom" style={{ left: i * 34 + seeded(k) * 24, top, zIndex: Math.round(top + h), animation: `garden-sway calc(${5 + seeded(k, 4) * 4}s * var(--garden-sway, 1)) ease-in-out infinite` }} width={22} height={h}>
            {Array.from({ length: 5 }, (_, b) => {
              const x = 2 + b * 4.5;
              const lean = (seeded(k, b + 10) - 0.5) * 8;
              return <path key={b} d={`M${x} ${h} Q${x + lean * 0.4} ${h * 0.5} ${x + lean} ${h * (0.1 + seeded(k, b + 20) * 0.3)}`} stroke={b % 2 ? "var(--g-foliage-light)" : "var(--g-foliage)"} strokeWidth={1.2} fill="none" opacity={0.75} strokeLinecap="round" />;
            })}
          </svg>
        );
      })}
    </>
  );
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

function YearTree({ year, x, baseY, render, onOpen }: { year: GardenYear; x: number; baseY: number; render: GardenStyle["tree"]; onOpen: () => void }) {
  const isCurrent = year.year === new Date().getFullYear();
  // A tree grows with the year: fuller as months pass and memories gather.
  const monthsIn = isCurrent ? new Date().getMonth() + 1 : 12;
  const scale = 0.75 + Math.min(0.5, monthsIn / 40 + year.size / 30);
  const w = 150 * scale;
  const h = 200 * scale;
  return (
    <div className="absolute flex flex-col items-center" style={{ left: x, top: baseY - h, width: w, zIndex: Math.round(baseY) }}>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Year ${year.year} — open the Yearbook`}
        title={`${year.year} — open the Yearbook`}
        className="group block origin-bottom transition-transform hover:scale-[1.03]"
        style={{ animation: "garden-sway calc(10s * var(--garden-sway, 1)) ease-in-out infinite" }}
      >
        <svg width={w} height={h} viewBox="0 0 150 200" aria-hidden>
          <TreeArt render={render} seed={String(year.year)} blossoms={Math.min(16, year.size + 3)} />
        </svg>
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="mt-1 flex items-center gap-1.5 rounded-full bg-card/85 px-3 py-1 text-xs shadow-soft backdrop-blur-sm transition hover:bg-card"
      >
        <span aria-hidden>📚</span>
        {year.year}
      </button>
    </div>
  );
}

function Hive({ x, top, habits, render, onOpen }: { x: number; top: number; habits: HabitState[]; render: GardenStyle["hive"]; onOpen: () => void }) {
  const active = habits.filter((h) => h.active);
  const dormant = habits.length - active.length;
  const layers = Math.min(5, 2 + Math.floor(habits.reduce((n, h) => n + h.activityCount, 0) / 8));
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Your hive of habits — ${active.length} active, ${dormant} resting`}
      title="Your hive of habits"
      className="absolute flex flex-col items-center transition-transform hover:scale-105"
      style={{ left: x, top, zIndex: top + 110 }}
    >
      <div className="relative" style={{ width: 90, height: 110 }}>
        <svg width={90} height={110} viewBox="0 0 90 110" aria-hidden>
          <HiveArt render={render} layers={layers} />
        </svg>
        {active.slice(0, 6).map((h, i) => (
          <span key={h.habitId ?? h.goalId} aria-hidden className="absolute" style={{ left: 38, top: 44, animation: `garden-buzz ${4 + i}s linear ${i * -0.7}s infinite` }}>
            <Bee />
          </span>
        ))}
        {Array.from({ length: Math.min(4, dormant) }, (_, i) => (
          <span key={i} aria-hidden className="absolute" style={{ left: 16 + i * 15, top: 96 }}>
            <Bee resting />
          </span>
        ))}
      </div>
      <span className="mt-1 rounded-full bg-card/85 px-3 py-1 text-xs shadow-soft backdrop-blur-sm">
        {habits.length ? `${active.length} buzzing${dormant ? ` · ${dormant} resting` : ""}` : "Your hive"}
      </span>
    </button>
  );
}

function Flower({ flower, x, y, render }: { flower: GardenFlower; x: number; y: number; render: GardenStyle["flower"] }) {
  const h = stageHeight[flower.stage] ?? stageHeight.bloom;
  const open = stageBloom[flower.stage] ?? stageBloom.bloom;
  return (
    <Link
      to="/goals/$goalId"
      params={{ goalId: flower.goalId }}
      title={flower.title}
      aria-label={`Completed goal: ${flower.title}`}
      className="group absolute flex flex-col items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      style={{ left: x - 32, top: y - h, zIndex: Math.round(y) }}
    >
      <svg
        width={64}
        height={h + 14}
        viewBox={`0 0 64 ${h + 14}`}
        className="origin-bottom transition-transform duration-300 group-hover:scale-110"
        style={{ animation: `garden-sway calc(${6 + (x % 4)}s * var(--garden-sway, 1)) ease-in-out infinite` }}
        aria-hidden
      >
        <FlowerArt render={render} variety={flower.variety} accent={flower.accent} open={open} height={h} seed={flower.id} />
      </svg>
      <span className="pointer-events-none -mt-1 max-w-[140px] truncate rounded-full bg-card/90 px-2 py-0.5 text-[11px] opacity-0 shadow-soft backdrop-blur-sm transition group-hover:opacity-100 group-focus-visible:opacity-100">
        {flower.title}
      </span>
    </Link>
  );
}

function Butterfly({ x, y, seed, title, onOpen }: { x: number; y: number; seed: number; title: string; onOpen: () => void }) {
  const accents = ["lavender", "blush", "sky", "sage"];
  return (
    <button
      type="button"
      onClick={onOpen}
      title={title}
      aria-label={`Memory: ${title}`}
      className="group absolute"
      style={{ left: x, top: y, zIndex: 1500, animation: `garden-flutter ${12 + seed * 8}s ease-in-out ${-seed * 10}s infinite` }}
    >
      <ButterflyArt accent={accents[Math.floor(seed * accents.length)]} />
    </button>
  );
}

import { goalProgress, type BloomGoal } from "@/features/goals/types";
import { formatSleep } from "@/features/timeline/snapshot";
import type { BloomEvent, DailySnapshot } from "@/features/timeline/types";

/**
 * Bloom's evidence-first insight engine.
 *
 * Every sentence is composed from `Evidence` items that point at real logged
 * values. Nothing is inferred beyond simple comparisons with the user's own
 * recent average. Future sources (integrations, AI) plug in by producing more
 * `Evidence` — the UI only ever renders evidence and text built from it.
 */

export type InsightPeriod = "morning" | "afternoon" | "evening";

export type EvidenceSource =
  | "sleep"
  | "recovery"
  | "training"
  | "nutrition"
  | "water"
  | "activity"
  | "cycle"
  | "mood"
  | "measurements"
  | "journal"
  | "habits"
  | "quick-note"
  | "life-event"
  | "goal";

export type Evidence = {
  source: EvidenceSource;
  label: string;
  /** The real value, e.g. "7h 38m". */
  value: string;
  /** When the value is from — keeps today separate from trends. */
  when: "today" | "last night" | "yesterday" | "so far today";
  /** Comparison with the user's own recent average, only when enough data. */
  trend?: string;
  goalId?: string;
};

export type GoalReference = { id: string; title: string; progress: number };

export type DailyInsight = {
  period: InsightPeriod;
  heading: string;
  headline: string;
  body: string;
  evidence: Evidence[];
  goals: GoalReference[];
  reasoning: string;
  confidence: "High" | "Medium" | "Low";
  sufficient: boolean;
};

export const QUICK_NOTE_ORIGIN = "quick-note";

export function isQuickNote(event: BloomEvent) {
  return event.origin === QUICK_NOTE_ORIGIN;
}

export function periodFor(date = new Date()): InsightPeriod {
  const h = date.getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const headings: Record<InsightPeriod, string> = {
  morning: "What should I know before today begins?",
  afternoon: "How is today going?",
  evening: "What happened today?",
};

/** Average of a field across prior days that actually have it (needs ≥ 2). */
function average(days: DailySnapshot[], pick: (d: DailySnapshot) => number | undefined) {
  const values = days.map(pick).filter((v): v is number => typeof v === "number");
  if (values.length < 2) return undefined;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function trendText(value: number, avg: number | undefined, fmt: (n: number) => string) {
  if (avg === undefined) return undefined;
  const diff = value - avg;
  if (Math.abs(diff) < 0.5) return "In line with your recent average";
  return `${diff > 0 ? "↑" : "↓"} ${fmt(Math.abs(diff))} vs your recent average`;
}

const goalKeywords: Record<string, string[]> = {
  sleep: ["sleep", "rest", "bed"],
  recovery: ["recover", "hrv", "rest", "energy"],
  training: ["run", "train", "workout", "gym", "strength", "walk", "exercise", "fit"],
  activity: ["step", "walk", "move", "active"],
  nutrition: ["protein", "eat", "nutrition", "food", "calorie", "diet"],
  water: ["water", "hydrat", "drink"],
  cycle: ["cycle", "period"],
  mood: ["mood", "stress", "calm", "anxi", "mind"],
  measurements: ["weight", "waist", "measure", "lose", "gain"],
};

function relevantGoals(goals: BloomGoal[], evidence: Evidence[]): GoalReference[] {
  const sources = new Set(evidence.map((e) => e.source));
  return goals
    .filter((goal) => {
      const t = goal.tracking;
      if (t.method === "automatic") {
        const m = t.metric as string;
        if (m === "sleep" && sources.has("sleep")) return true;
        if (m === "water" && sources.has("water")) return true;
        if (m === "protein" && sources.has("nutrition")) return true;
        if (m === "weight" && sources.has("measurements")) return true;
      }
      const title = goal.title.toLowerCase();
      return [...sources].some((s) => (goalKeywords[s] ?? []).some((k) => title.includes(k)));
    })
    .slice(0, 2)
    .map((goal) => ({ id: goal.id, title: goal.title, progress: goalProgress(goal) }));
}

export function buildDailyInsight(input: {
  today: DailySnapshot;
  recent: DailySnapshot[];
  goals: BloomGoal[];
  now?: Date;
}): DailyInsight {
  const { today, recent, goals } = input;
  const period = periodFor(input.now);
  const prior = recent.slice(1);
  const yesterday = recent[1];
  const evidence: Evidence[] = [];

  if (today.sleepMinutes) {
    evidence.push({
      source: "sleep",
      label: "Sleep",
      value: formatSleep(today.sleepMinutes) ?? "",
      when: "last night",
      trend: trendText(today.sleepMinutes, average(prior, (d) => d.sleepMinutes), (n) => `${Math.round(n)} min`),
    });
  }
  if (today.recoveryPercent) {
    evidence.push({
      source: "recovery",
      label: "Recovery",
      value: `${today.recoveryPercent}%${today.hrv ? ` · HRV ${today.hrv} ms` : ""}`,
      when: "today",
      trend: trendText(today.recoveryPercent, average(prior, (d) => d.recoveryPercent), (n) => `${Math.round(n)}%`),
    });
  }
  if (today.cycleDay) {
    evidence.push({ source: "cycle", label: "Cycle", value: `Day ${today.cycleDay}`, when: "today" });
  }

  const nutritionDay = period === "morning" ? yesterday : today;
  const nutritionWhen = period === "morning" ? "yesterday" : "so far today";
  if (nutritionDay && (nutritionDay.proteinG || nutritionDay.caloriesKcal)) {
    const parts = [
      nutritionDay.proteinG ? `${nutritionDay.proteinG}g protein` : null,
      nutritionDay.caloriesKcal ? `${nutritionDay.caloriesKcal.toLocaleString()} kcal` : null,
    ].filter(Boolean);
    evidence.push({ source: "nutrition", label: "Nutrition", value: parts.join(" · "), when: nutritionWhen });
  }
  if (period !== "morning" && today.waterL) {
    evidence.push({ source: "water", label: "Water", value: `${today.waterL} L`, when: "so far today" });
  }
  if (period !== "morning" && today.steps) {
    evidence.push({ source: "activity", label: "Steps", value: today.steps.toLocaleString(), when: "so far today" });
  }
  if (today.workout) {
    evidence.push({ source: "training", label: "Training", value: today.workout, when: "today" });
  }
  if (today.mood) {
    evidence.push({
      source: "mood",
      label: "Mood",
      value: today.stress ? `${today.mood} · stress ${today.stress.toLowerCase()}` : today.mood,
      when: "today",
    });
  }
  const notes = today.events.filter(isQuickNote);
  for (const note of notes.slice(0, 3)) {
    evidence.push({ source: "quick-note", label: "Your note", value: note.title, when: "today" });
  }

  const goalRefs = relevantGoals(goals, evidence);
  for (const g of goalRefs) {
    evidence.push({ source: "goal", label: "Goal", value: `${g.title} · ${g.progress}% complete`, when: "today", goalId: g.id });
  }

  const daysWithData = recent.filter((d) => d.events.length > 0).length;
  const dataEvidence = evidence.filter((e) => e.source !== "goal");
  const sufficient = dataEvidence.length > 0;

  if (!sufficient) {
    return {
      period,
      heading: headings[period],
      headline:
        daysWithData < 3
          ? "I'm still learning your patterns."
          : "Nothing logged yet today, so there's nothing new to explain.",
      body:
        daysWithData < 3
          ? "Log a few more days and I'll start spotting patterns across your health, habits and goals."
          : "As soon as you add sleep, food, activity or a quick note, I'll tell you what I notice.",
      evidence: [],
      goals: [],
      reasoning: "There isn't enough information recorded today to say anything meaningful yet.",
      confidence: "Low",
      sufficient: false,
    };
  }

  const sentences = compose(period, today, nutritionDay, notes.length, evidence);
  const hasTrend = evidence.some((e) => e.trend);
  return {
    period,
    heading: headings[period],
    headline: sentences[0],
    body: sentences.slice(1).join(" "),
    evidence,
    goals: goalRefs,
    reasoning: reasoningFor(evidence, hasTrend),
    confidence: dataEvidence.length >= 4 && hasTrend ? "High" : dataEvidence.length >= 2 ? "Medium" : "Low",
    sufficient: true,
  };
}

function compose(
  period: InsightPeriod,
  today: DailySnapshot,
  nutritionDay: DailySnapshot | undefined,
  noteCount: number,
  evidence: Evidence[],
): string[] {
  const out: string[] = [];
  const sleep = evidence.find((e) => e.source === "sleep");
  const recovery = evidence.find((e) => e.source === "recovery");
  const up = (e?: Evidence) => e?.trend?.startsWith("↑");
  const down = (e?: Evidence) => e?.trend?.startsWith("↓");

  if (period === "morning") {
    if (sleep && recovery) {
      out.push(
        `You slept ${sleep.value} and your recovery is ${today.recoveryPercent}%${
          up(recovery) ? ", up from your recent average" : down(recovery) ? ", a little below your recent average" : ""
        }.`,
      );
    } else if (sleep) {
      out.push(`You slept ${sleep.value} last night${sleep.trend ? ` — ${sleep.trend.replace(/^[↑↓] /, "").toLowerCase().includes("line") ? "in line with your usual" : down(sleep) ? "a bit shorter than usual" : "a bit longer than usual"}` : ""}.`);
    } else if (recovery) {
      out.push(`Your recovery is ${today.recoveryPercent}% this morning.`);
    }
    if (today.workout) {
      out.push(
        down(recovery) || down(sleep)
          ? `You have ${today.workout.toLowerCase()} on today — keeping it comfortable may feel best.`
          : `You have ${today.workout.toLowerCase()} on today, and nothing in your data suggests changing it.`,
      );
    } else if (down(recovery) || down(sleep)) {
      out.push("A gentler pace today could help you bounce back.");
    }
    if (nutritionDay?.proteinG) out.push(`Yesterday you logged ${nutritionDay.proteinG}g of protein.`);
  } else {
    const done: string[] = [];
    if (today.proteinG) done.push(`${today.proteinG}g of protein`);
    if (today.waterL) done.push(`${today.waterL} L of water`);
    if (today.steps) done.push(`${today.steps.toLocaleString()} steps`);
    const verb = period === "afternoon" ? "So far today you've logged" : "Today you logged";
    if (done.length) out.push(`${verb} ${done.join(", ")}.`);
    if (today.workout) out.push(period === "afternoon" ? `Training today: ${today.workout}.` : `You also fitted in ${today.workout.toLowerCase()} — nice consistency.`);
    if (!out.length && sleep) out.push(`You started the day with ${sleep.value} of sleep.`);
    if (!out.length && recovery) out.push(`Your recovery this morning was ${today.recoveryPercent}%.`);
    if (period === "evening" && (down(recovery) || down(sleep)))
      out.push("Your recovery or sleep was lower than usual this morning, so an easy evening and a good night's sleep may help tomorrow.");
  }

  if (!out.length) out.push("Here's what you've shared with Bloom today.");
  if (noteCount) out.push(`I've kept your note${noteCount > 1 ? "s" : ""} in mind for today.`);
  const goal = evidence.find((e) => e.source === "goal");
  if (goal) out.push(`This connects to your goal "${goal.value.split(" · ")[0]}".`);
  return out;
}

function reasoningFor(evidence: Evidence[], hasTrend: boolean) {
  const sources = [...new Set(evidence.filter((e) => e.source !== "goal").map((e) => e.label.toLowerCase()))];
  const base = `This insight is built only from what you've recorded: ${sources.join(", ")}.`;
  return hasTrend
    ? `${base} Comparisons use your own average from the previous days that have data.`
    : `${base} There isn't enough history yet to compare with your usual, so no trends are shown.`;
}

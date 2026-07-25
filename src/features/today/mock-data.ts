import type {
  Confidence,
  FocusItem,
  GoalCard,
  LogStatusItem,
  QuickAddItem,
  SummaryStat,
  TimelineEvent,
} from "./types";

export const todayInsight: {
  headline: string;
  body: string;
  confidence: Confidence;
} = {
  headline: "Your recovery is trending up after three calmer evenings.",
  body: "Sleep has been more consistent this week and your resting heart rate settled by 3 bpm. Today looks like a good day for a harder training session — keep protein above target to support it.",
  confidence: "Medium",
};

export const goalProgress: GoalCard[] = [
  { id: "weight", name: "Weight Trend", description: "Down 0.3 kg over 14 days", status: "good" },
  { id: "protein", name: "Protein", description: "Averaging 12 g under target", status: "watch" },
  { id: "recovery", name: "Recovery", description: "Steady, above your baseline", status: "good" },
  { id: "hydration", name: "Hydration", description: "No water logged yet today", status: "off" },
  { id: "training", name: "Training", description: "2 of 4 sessions this week", status: "watch" },
  { id: "sleep", name: "Sleep", description: "7 h 24 m average, on track", status: "good" },
];

export const todaySummary: SummaryStat[] = [
  { id: "weight", label: "Weight", value: "71.4", unit: "kg", detail: "−0.2 vs last week" },
  { id: "cycle", label: "Cycle Day", value: "12", detail: "Follicular" },
  { id: "sleep", label: "Sleep", value: "7h 38m", detail: "Bed 23:10" },
  { id: "recovery", label: "Recovery", value: "68", unit: "%", detail: "Balanced" },
  { id: "protein", label: "Protein Yesterday", value: "118", unit: "g", detail: "Target 140 g" },
  { id: "steps", label: "Steps Yesterday", value: "9,204", detail: "Goal 8,000" },
];

export const todayFocus: FocusItem[] = [
  {
    id: "protein",
    title: "Hit 140 g of protein",
    detail: "You are averaging 128 g this week",
    done: false,
  },
  {
    id: "walk",
    title: "Take a 20 minute afternoon walk",
    detail: "Helps your evening heart rate settle",
    done: true,
  },
  {
    id: "winddown",
    title: "Start winding down by 22:30",
    detail: "Your best sleep nights follow an earlier start",
    done: false,
  },
];

export const logStatus: LogStatusItem[] = [
  { id: "weight", label: "Weight", state: "logged" },
  { id: "sleep", label: "Sleep", state: "synced" },
  { id: "water", label: "Water", state: "missing" },
  { id: "journal", label: "Journal", state: "missing" },
];

export const quickAddItems: QuickAddItem[] = [
  { id: "weight", label: "Weight" },
  { id: "mood", label: "Mood" },
  { id: "journal", label: "Journal" },
  { id: "period", label: "Period" },
  { id: "workout", label: "Workout" },
  { id: "water", label: "Water" },
  { id: "medication", label: "Medication" },
  { id: "life-event", label: "Life Event" },
];

export const timelinePreview: TimelineEvent[] = [
  { id: "1", time: "06:48", title: "Sleep synced", detail: "7h 38m · Oura" },
  { id: "2", time: "07:15", title: "Weight logged", detail: "71.4 kg" },
  { id: "3", time: "08:02", title: "Morning mood", detail: "Calm, focused" },
];

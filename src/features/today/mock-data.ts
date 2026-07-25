import type {
  Confidence,
  FocusItem,
  Goal,
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

export const goals: Goal[] = [
  {
    id: "weight-loss",
    name: "Lose 5 kg",
    note: "Down 1.6 kg since you started, moving steadily.",
    progress: 32,
    currentLabel: "Current",
    currentValue: "71.4 kg",
    targetLabel: "Target",
    targetValue: "68.0 kg",
    estimate: "On pace to arrive around mid September",
    accent: "sage",
    status: "good",
    emphasis: "primary",
  },
  {
    id: "protein",
    name: "Protein",
    note: "Averaging 128 g a day over the last week.",
    progress: 91,
    currentLabel: "7-day average",
    currentValue: "128 g",
    targetLabel: "Daily target",
    targetValue: "140 g",
    estimate: "One extra serving a day would close the gap",
    accent: "blush",
    status: "watch",
    emphasis: "primary",
  },
  {
    id: "training",
    name: "Train 4× a week",
    note: "Two sessions logged, two still to go.",
    progress: 50,
    currentLabel: "This week",
    currentValue: "2 sessions",
    targetLabel: "Goal",
    targetValue: "4 sessions",
    accent: "lavender",
    status: "watch",
    emphasis: "supporting",
  },
  {
    id: "sleep",
    name: "Sleep 7h 30m",
    note: "Your nights have been remarkably even.",
    progress: 98,
    currentLabel: "Average",
    currentValue: "7h 24m",
    targetLabel: "Target",
    targetValue: "7h 30m",
    accent: "sky",
    status: "good",
    emphasis: "supporting",
  },
  {
    id: "hydration",
    name: "Drink 2.5 L",
    note: "Nothing logged yet today — an easy win.",
    progress: 12,
    currentLabel: "Today",
    currentValue: "0.3 L",
    targetLabel: "Target",
    targetValue: "2.5 L",
    accent: "stone",
    status: "off",
    emphasis: "supporting",
  },
];

export const todaySummary: SummaryStat[] = [
  { id: "weight", label: "Weight", value: "71.4", unit: "kg", detail: "−0.2 vs last week" },
  { id: "cycle", label: "Cycle day", value: "12", detail: "Follicular" },
  { id: "sleep", label: "Sleep", value: "7h 38m", detail: "Bed 23:10" },
  { id: "recovery", label: "Recovery", value: "68", unit: "%", detail: "Balanced" },
  { id: "protein", label: "Protein yesterday", value: "118", unit: "g", detail: "Target 140 g" },
  { id: "steps", label: "Steps yesterday", value: "9,204", detail: "Goal 8,000" },
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
  { id: "life-event", label: "Life event" },
];

export const timelinePreview: TimelineEvent[] = [
  { id: "1", time: "06:48", title: "Sleep synced", detail: "7h 38m · Oura" },
  { id: "2", time: "07:15", title: "Weight logged", detail: "71.4 kg" },
  { id: "3", time: "08:02", title: "Morning mood", detail: "Calm, focused" },
];

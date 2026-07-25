import type { GoalType, TrackingMethod } from "./types";

/** A starting point, not a rule — every field stays editable in the flow. */
export type GoalTemplate = {
  id: string;
  title: string;
  type: GoalType;
  /** Optional nudge towards a tracking method when the title alone is ambiguous. */
  method?: TrackingMethod;
  /** Suggested wording for "why this matters", offered as a prompt. */
  whyPrompt?: string;
};

export type GoalCategory = {
  id: string;
  emoji: string;
  label: string;
  tagline: string;
  templates: GoalTemplate[];
};

export const goalCategories: GoalCategory[] = [
  {
    id: "feel-better",
    emoji: "🌸",
    label: "Feel Better",
    tagline: "Small things that lift the whole day.",
    templates: [
      { id: "more-energy", title: "Have more energy in the afternoons", type: "wellbeing", method: "reflection" },
      { id: "move-daily", title: "Move my body every day", type: "habit", method: "streak" },
      { id: "outside", title: "Get outside for 20 minutes daily", type: "habit", method: "streak" },
      { id: "less-alcohol", title: "Drink less alcohol this month", type: "habit", method: "streak" },
    ],
  },
  {
    id: "get-stronger",
    emoji: "💪",
    label: "Get Stronger",
    tagline: "Build something you can feel.",
    templates: [
      { id: "train-3x", title: "Train 3 times a week", type: "habit", method: "repetition" },
      { id: "first-pullup", title: "Do my first pull-up", type: "outcome", method: "milestone" },
      { id: "run-5k", title: "Run 5 km without stopping", type: "outcome", method: "milestone" },
      { id: "lift-heavier", title: "Add 10 kg to my squat", type: "outcome", method: "milestone" },
    ],
  },
  {
    id: "sleep",
    emoji: "😴",
    label: "Improve Sleep",
    tagline: "Better nights, gentler mornings.",
    templates: [
      { id: "sleep-75", title: "Sleep 7.5 hours", type: "outcome", method: "automatic" },
      { id: "bed-1030", title: "Bed before 10:30 pm", type: "habit", method: "streak" },
      { id: "screen-time", title: "Reduce evening screen time", type: "habit", method: "streak" },
      { id: "wake-consistent", title: "Wake up at the same time each day", type: "habit", method: "streak" },
    ],
  },
  {
    id: "relationships",
    emoji: "❤️",
    label: "Relationships",
    tagline: "The people who make life feel full.",
    templates: [
      { id: "two-dates", title: "Go on 2 dates", type: "life-event", method: "checklist" },
      { id: "call-family", title: "Call my family once a week", type: "habit", method: "streak" },
      { id: "weekend-away", title: "Plan a weekend away", type: "life-event", method: "milestone" },
      { id: "friends-evening", title: "Spend one evening a week with friends", type: "habit", method: "repetition" },
    ],
  },
  {
    id: "mental-wellbeing",
    emoji: "🧠",
    label: "Mental Wellbeing",
    tagline: "Kinder headspace, steadier days.",
    templates: [
      { id: "kinder", title: "Be kinder to myself", type: "wellbeing", method: "reflection" },
      { id: "less-stress", title: "Feel less stressed at work", type: "wellbeing", method: "reflection" },
      { id: "journal-20", title: "Journal 20 times", type: "habit", method: "repetition" },
      { id: "therapy", title: "Start therapy", type: "life-event", method: "checklist" },
    ],
  },
  {
    id: "nutrition",
    emoji: "🍎",
    label: "Nutrition",
    tagline: "Eating in a way that looks after you.",
    templates: [
      { id: "protein", title: "Hit protein target", type: "outcome", method: "automatic" },
      { id: "water", title: "Drink 2.5 L water", type: "outcome", method: "automatic" },
      { id: "veg", title: "Eat vegetables with every dinner", type: "habit", method: "streak" },
      { id: "cook-home", title: "Cook at home 5 nights a week", type: "habit", method: "repetition" },
    ],
  },
  {
    id: "travel-life",
    emoji: "✈️",
    label: "Travel & Life",
    tagline: "Moments worth clearing the diary for.",
    templates: [
      { id: "trip", title: "Take a trip somewhere new", type: "life-event", method: "milestone" },
      { id: "weekend-city", title: "Visit a city I've never been to", type: "life-event", method: "checklist" },
      { id: "declutter", title: "Declutter the whole flat", type: "life-event", method: "milestone" },
      { id: "photos", title: "Print a photo book of this year", type: "life-event", method: "checklist" },
    ],
  },
  {
    id: "learning",
    emoji: "📚",
    label: "Learning",
    tagline: "Room to grow, at your own pace.",
    templates: [
      { id: "read-12", title: "Read 12 books this year", type: "habit", method: "repetition" },
      { id: "language", title: "Learn conversational Spanish", type: "outcome", method: "milestone" },
      { id: "course", title: "Finish an online course", type: "outcome", method: "milestone" },
      { id: "practice-daily", title: "Practise something new every day", type: "habit", method: "streak" },
    ],
  },
  {
    id: "career",
    emoji: "💼",
    label: "Career",
    tagline: "Work that moves in the right direction.",
    templates: [
      { id: "promotion", title: "Get a promotion", type: "outcome", method: "milestone" },
      { id: "cv", title: "Update my CV and portfolio", type: "life-event", method: "checklist" },
      { id: "network", title: "Have a coffee with someone new each month", type: "habit", method: "repetition" },
      { id: "boundaries", title: "Log off on time every day", type: "habit", method: "streak" },
    ],
  },
];

/** The final tile: skip the templates and start from a blank page. */
export const createYourOwn = { id: "own", emoji: "✨", label: "Create My Own" } as const;

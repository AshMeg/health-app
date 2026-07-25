import type { GoalMilestone, GoalType } from "./types";

export function makeMilestone(label: string, extra?: Partial<GoalMilestone>): GoalMilestone {
  return {
    id: `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    label: label.trim(),
    done: false,
    ...extra,
  };
}

export function milestonesFromLabels(labels: string[]): GoalMilestone[] {
  return labels.map((label, i) => ({
    id: `m${i + 1}-${Math.random().toString(36).slice(2, 6)}`,
    label: label.trim(),
    done: false,
  }));
}

/** Moves a milestone to a new position — used by drag-and-drop reordering. */
export function reorderMilestones(
  milestones: GoalMilestone[],
  fromId: string,
  toId: string,
): GoalMilestone[] {
  if (fromId === toId) return milestones;
  const from = milestones.findIndex((m) => m.id === fromId);
  const to = milestones.findIndex((m) => m.id === toId);
  if (from === -1 || to === -1) return milestones;
  const next = [...milestones];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

type SuggestionRule = { keywords: string[]; steps: string[] };

/**
 * Placeholder milestone suggestions, read from the goal's own words. The shape
 * is deliberately simple so an AI call can replace the body later without
 * anything else in the app changing.
 */
const suggestionRules: SuggestionRule[] = [
  {
    keywords: ["5k", "10k", "couch", "run", "jog", "marathon", "race"],
    steps: [
      "Download Couch to 5K",
      "Buy running shoes",
      "Complete Week 1",
      "Complete Week 2",
      "Complete Week 3",
      "Run first continuous 5K",
    ],
  },
  {
    keywords: ["learn", "course", "study", "module", "history", "language", "read about", "understand"],
    steps: [
      "Find a course or book",
      "Complete Module 1",
      "Complete Module 2",
      "Complete Module 3",
      "Watch a documentary",
      "Write a summary",
    ],
  },
  {
    keywords: ["holiday", "trip", "travel", "italy", "visit", "weekend away", "flight"],
    steps: [
      "Book flights",
      "Book accommodation",
      "Save spending money",
      "Plan itinerary",
      "Pack",
    ],
  },
  {
    keywords: ["renovate", "renovation", "kitchen", "decorate", "declutter", "move house", "garden"],
    steps: [
      "Set a budget",
      "Gather inspiration",
      "Get quotes",
      "Book the work in",
      "Finish the first room",
      "Final tidy-up",
    ],
  },
  {
    keywords: ["read", "book", "books", "reading"],
    steps: [
      "Choose the first book",
      "Read the first 50 pages",
      "Reach the halfway point",
      "Finish the book",
      "Pick the next one",
    ],
  },
  {
    keywords: ["job", "career", "promotion", "interview", "cv", "portfolio", "business", "launch"],
    steps: [
      "Update my CV",
      "Ask for feedback",
      "Apply to three places",
      "Prepare for interviews",
      "First interview done",
    ],
  },
  {
    keywords: ["strong", "strength", "lift", "squat", "pull-up", "gym", "train"],
    steps: [
      "Plan the first four weeks",
      "Complete week one",
      "Complete month one",
      "Add weight or reps",
      "Retest where I'm at",
    ],
  },
  {
    keywords: ["therapy", "gp", "doctor", "appointment", "health check", "dentist"],
    steps: ["Find someone to contact", "Make the appointment", "Attend the first session", "Decide next steps"],
  },
  {
    keywords: ["wedding", "party", "event", "birthday"],
    steps: ["Set the date", "Make a guest list", "Book the venue", "Send invitations", "The big day"],
  },
];

const byType: Record<GoalType, string[]> = {
  outcome: ["Make a simple plan", "Take the first step", "Reach the halfway point", "Finish it"],
  habit: ["Choose when it happens", "Do it once", "Keep it going for a week", "Keep it going for a month"],
  wellbeing: [
    "Notice what makes it harder",
    "Try one small change",
    "Check in after a week",
    "Check in after a month",
  ],
  "life-event": ["Decide the details", "Book what needs booking", "Prepare", "Make it happen"],
};

/** Suggested steps for a goal — placeholders until AI suggestions arrive. */
export function suggestMilestones(title: string, type: GoalType | null): GoalMilestone[] {
  const text = ` ${title.toLowerCase()} `;
  const rule = suggestionRules.find((r) => r.keywords.some((k) => text.includes(k)));
  const steps = rule?.steps ?? byType[type ?? "outcome"];
  return milestonesFromLabels(steps);
}

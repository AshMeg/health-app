/**
 * Bloom's voice. Personality changes HOW Bloom speaks, never WHAT the data says:
 * facts are composed elsewhere and passed through untouched; tone only adds
 * framing or chooses between equivalent phrasings.
 */
export type BloomPersonality = "gentle" | "encouraging" | "cheerful" | "calm";

export const DEFAULT_PERSONALITY: BloomPersonality = "encouraging";

export const personalityMeta: Record<BloomPersonality, { emoji: string; label: string; summary: string; example: string }> = {
  gentle: {
    emoji: "🌿",
    label: "Gentle",
    summary: "Warm, patient and reassuring.",
    example: "You've had a quieter day today. That's okay. Your recovery is still moving in a good direction.",
  },
  encouraging: {
    emoji: "🌸",
    label: "Encouraging",
    summary: "Positive, optimistic and quietly motivating.",
    example: "You're making steady progress. Your recovery is looking good today.",
  },
  cheerful: {
    emoji: "☀️",
    label: "Cheerful",
    summary: "Light, celebratory and playful.",
    example: "Look at that — another little step forward. 🌱",
  },
  calm: {
    emoji: "🌙",
    label: "Calm",
    summary: "Clear, reflective and factual.",
    example: "Your recovery is 68%, which is above your recent average. Your sleep was 7h 38m.",
  },
};

/** Equivalent phrasings for recurring Bloom messages. */
const phrases = {
  allCaughtUp: {
    gentle: "There's nothing that needs you today. Take it easy.",
    encouraging: "You're all caught up for today.",
    cheerful: "All caught up — nice. 🌱",
    calm: "Nothing needs your attention today.",
  },
  noFocus: {
    gentle: "Nothing needs your attention right now. That's perfectly fine.",
    encouraging: "Nothing needs your attention right now.",
    cheerful: "Nothing needs you right now — enjoy the quiet.",
    calm: "No goal needs attention right now.",
  },
  nothingToday: {
    gentle: "Nothing recorded yet today — whenever you're ready.",
    encouraging: "Nothing recorded yet today.",
    cheerful: "A fresh page today.",
    calm: "Nothing recorded today.",
  },
  goalBloomed: {
    gentle: "Your goal has bloomed.",
    encouraging: "You did it. This one has bloomed.",
    cheerful: "You did it — this one has bloomed. 🌸",
    calm: "This goal is complete.",
  },
  goalBloomedBody: {
    gentle: "It's now part of your Garden, with everything you gathered along the way.",
    encouraging: "This goal is now part of your Garden — everything you gathered along the way is kept here.",
    cheerful: "It's growing in your Garden now, with every note and photo kept safe.",
    calm: "It has been added to your Garden. Its full history is kept here.",
  },
  stepDone: {
    gentle: "Another step done.",
    encouraging: "You've completed another step.",
    cheerful: "Another step done — lovely.",
    calm: "Step completed.",
  },
  gettingClose: {
    gentle: "You're getting close.",
    encouraging: "You're getting close.",
    cheerful: "So close now.",
    calm: "Nearly complete.",
  },
  goalQuiet: {
    gentle: "This goal has been quiet recently. It's still here whenever you are.",
    encouraging: "This goal has been quiet recently.",
    cheerful: "This one's been resting lately.",
    calm: "No recent activity on this goal.",
  },
  quietMonth: {
    gentle: "Some seasons are quieter. They're still part of the story.",
    encouraging: "Some seasons are quieter. They're still part of the story.",
    cheerful: "A quiet month — every garden has those.",
    calm: "A quieter month.",
  },
  gardenEmpty: {
    gentle: "Your Garden is waiting patiently. It grows as you do.",
    encouraging: "Your Garden grows as you do — complete a goal to plant your first flower.",
    cheerful: "Your first flower is on its way. 🌱",
    calm: "Completed goals will appear here.",
  },
} satisfies Record<string, Record<BloomPersonality, string>>;

export type PhraseKey = keyof typeof phrases;

export function say(key: PhraseKey, tone: BloomPersonality): string {
  return phrases[key][tone];
}

type InsightLike = { headline: string; body: string; sufficient: boolean; confidence: "High" | "Medium" | "Low" };

/**
 * Passes an insight through the chosen tone. Facts (numbers, dates, goals)
 * are left exactly as composed. Low-evidence and sensitive cases stay
 * gentle/calm regardless of personality — confidence is never inflated.
 */
export function toneInsight<T extends InsightLike>(insight: T, tone: BloomPersonality): T {
  if (!insight.sufficient) {
    // Honest, unhurried — no cheer on thin evidence.
    return tone === "calm"
      ? { ...insight, body: insight.body.replace(/ and I'll start spotting.*$/, ".") }
      : insight;
  }
  const lowEvidence = insight.confidence === "Low";
  const close: Record<BloomPersonality, string> = {
    gentle: "Go at whatever pace feels right today.",
    encouraging: "You're building a solid foundation.",
    cheerful: lowEvidence ? "Every little log helps. 🌱" : "Nice little win. 🌱",
    calm: "",
  };
  const extra = close[tone];
  return { ...insight, body: [insight.body, extra].filter(Boolean).join(" ") };
}

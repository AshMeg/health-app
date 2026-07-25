import type { BloomGoal } from "./types";

/** Placeholder goals — replaced by real data once goal tracking is wired up. */
export const seedGoals: BloomGoal[] = [
  {
    id: "lose-5kg",
    title: "Lose 5 kg",
    type: "outcome",
    why: "I want to feel lighter on long walks with the dog.",
    tracking: {
      method: "automatic",
      metric: "weight",
      unit: "kg",
      start: 73,
      current: 71.4,
      target: 68,
      history: [
        { date: "2026-05-04", value: 73 },
        { date: "2026-05-25", value: 72.6 },
        { date: "2026-06-15", value: 72.1 },
        { date: "2026-07-06", value: 71.7 },
        { date: "2026-07-24", value: 71.4 },
      ],
    },
    startDate: "2026-05-04",
    targetDate: "2026-09-15",
    accent: "sage",
    nextStep: "Hit today's protein target.",
    notes: [
      {
        id: "n1",
        date: "2026-07-22",
        body: "Weighing in on Monday mornings before breakfast keeps the trend honest.",
      },
    ],
    updates: [
      {
        id: "u1",
        date: "2026-07-24",
        kind: "progress",
        title: "Weighed in at 71.4 kg",
        detail: "Down 0.3 kg on last week.",
      },
      {
        id: "u2",
        date: "2026-05-04",
        kind: "created",
        title: "Goal created",
        detail: "Starting from 73.0 kg.",
      },
    ],
  },
  {
    id: "two-dates",
    title: "Go on two dates",
    type: "life-event",
    why: "I've been putting my own life on hold.",
    tracking: {
      method: "checklist",
      items: [
        { id: "d1", label: "Date 1", done: true, doneOn: "12 Jul" },
        { id: "d2", label: "Date 2", done: false },
      ],
    },
    startDate: "2026-07-01",
    accent: "sky",
    nextStep: "Reply to someone you've been meaning to message.",
    notes: [
      { id: "n2", date: "2026-07-22", body: "Feeling much more confident." },
      { id: "n1", date: "2026-07-15", body: "Coffee date went much better than I expected." },
    ],
    updates: [
      {
        id: "u1",
        date: "2026-07-12",
        kind: "checklist",
        title: "Checklist item completed",
        detail: "Date 1",
      },
      { id: "u2", date: "2026-07-01", kind: "created", title: "Goal created" },
    ],
  },
  {
    id: "journal-20",
    title: "Journal 20 times",
    type: "habit",
    tracking: {
      method: "repetition",
      unit: "entries",
      target: 20,
      completed: 12,
      logs: [
        { id: "l1", date: "24 Jul" },
        { id: "l2", date: "22 Jul" },
        { id: "l3", date: "19 Jul" },
      ],
    },
    startDate: "2026-06-01",
    targetDate: "2026-09-30",
    accent: "lavender",
    nextStep: "Write three lines before bed — that's enough.",
    notes: [],
    updates: [
      {
        id: "u2",
        date: "2026-07-24",
        kind: "progress",
        title: "Logged another one",
        detail: "12 of 20 entries",
      },
      { id: "u1", date: "2026-06-01", kind: "created", title: "Goal created" },
    ],
  },
  {
    id: "water-daily",
    title: "Drink water every day",
    type: "habit",
    tracking: {
      method: "streak",
      cadence: "every day",
      targetDays: 30,
      current: 9,
      longest: 14,
      history: Array.from({ length: 9 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().slice(0, 10);
      }),
    },
    startDate: "2026-06-20",
    accent: "sky",
    nextStep: "Fill a bottle now and keep it on your desk.",
    notes: [],
    updates: [{ id: "u1", date: "2026-06-20", kind: "created", title: "Goal created" }],
  },
  {
    id: "half-marathon",
    title: "Run a half marathon",
    type: "outcome",
    why: "I said I'd do one before I turned forty.",
    tracking: { method: "milestone" },
    milestones: [
      { id: "m1", label: "Buy trainers", done: true, doneOn: "02 May" },
      { id: "m2", label: "Start training plan", done: true, doneOn: "11 May" },
      {
        id: "m3",
        label: "Complete 10 km",
        done: true,
        doneOn: "28 Jun",
        note: "Slower than I hoped, but I finished it.",
      },
      { id: "m4", label: "Complete 15 km", done: false, targetDate: "2026-09-20" },
      { id: "m5", label: "Race day", done: false, targetDate: "2026-11-08" },
    ],

    startDate: "2026-05-01",
    targetDate: "2026-11-08",
    accent: "sage",
    nextStep: "Spend ten minutes planning this weekend's long run.",
    notes: [],
    updates: [
      {
        id: "u2",
        date: "2026-06-28",
        kind: "checklist",
        title: "Milestone completed",
        detail: "Complete 10 km",
      },
      { id: "u1", date: "2026-05-01", kind: "created", title: "Goal created" },
    ],
  },
  {
    id: "be-kinder",
    title: "Be kinder to myself",
    type: "wellbeing",
    why: "I talk to myself in a way I'd never talk to a friend.",
    tracking: {
      method: "reflection",
      cadence: "weekly",
      reflections: [
        { id: "r1", date: "21 Jul", rating: "better", note: "Caught myself spiralling and stopped." },
        { id: "r2", date: "14 Jul", rating: "same" },
        { id: "r3", date: "07 Jul", rating: "better", note: "A gentler week overall." },
      ],
    },
    startDate: "2026-07-01",
    accent: "blush",
    nextStep: "Take 10 minutes away from your screen this afternoon.",
    notes: [],
    updates: [
      {
        id: "u2",
        date: "2026-07-21",
        kind: "reflection",
        title: "Reflection added",
        detail: "Caught myself spiralling and stopped.",
      },
      { id: "u1", date: "2026-07-01", kind: "created", title: "Goal created" },
    ],
  },
  {
    id: "gp-appointment",
    title: "Book a GP appointment",
    type: "life-event",
    tracking: {
      method: "checklist",
      items: [{ id: "c1", label: "Call the surgery", done: true, doneOn: "18 Jul" }],
    },
    startDate: "2026-07-10",
    accent: "stone",
    completedAt: "2026-07-18",
    notes: [],
    updates: [
      { id: "u2", date: "2026-07-18", kind: "completed", title: "Goal completed" },
      { id: "u1", date: "2026-07-10", kind: "created", title: "Goal created" },
    ],
  },
];

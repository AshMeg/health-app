export type TrafficLight = "good" | "watch" | "off";

export type Confidence = "High" | "Medium" | "Low";

/** Nature-derived accent palette used across widgets. */
export type BloomAccent = "sage" | "lavender" | "blush" | "sky" | "stone";

export type GoalCard = {
  id: string;
  name: string;
  description: string;
  status: TrafficLight;
};

/** A tracked goal with measurable progress. */
export type Goal = {
  id: string;
  /** "Lose 5 kg", "Protein" ... */
  name: string;
  /** One calm sentence of context. */
  note: string;
  /** 0–100 completion. */
  progress: number;
  /** Left-hand metric, e.g. current weight or average intake. */
  currentLabel: string;
  currentValue: string;
  /** Right-hand metric, e.g. target. */
  targetLabel: string;
  targetValue: string;
  /** Soft forecast line, e.g. "On pace for late August". */
  estimate?: string;
  accent: BloomAccent;
  status: TrafficLight;
  /** Primary goals get a larger, more emphasised card. */
  emphasis: "primary" | "supporting";
};

export type SummaryStat = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  detail?: string;
  /** Full page this metric belongs to, for deep linking from the dashboard. */
  to?: string;
};

export type FocusItem = {
  id: string;
  title: string;
  detail: string;
  done: boolean;
};

export type LogState = "logged" | "synced" | "missing";

export type LogStatusItem = {
  id: string;
  label: string;
  state: LogState;
  /** Where to go to log or review this. */
  to?: string;
};

export type QuickAddItem = {
  id: string;
  label: string;
};

export type TimelineEvent = {
  id: string;
  time: string;
  title: string;
  detail?: string;
};

/** ---------- Widget system ---------- */

export type WidgetId = string;

export type WidgetSpan = "full" | "half";

export type WidgetDefinition = {
  id: WidgetId;
  /** Shown as the widget heading, and in the customise panel. */
  title: string;
  /** Short explanation used in the customise panel. */
  summary: string;
  span: WidgetSpan;
  /** Widgets that can never be hidden (e.g. active goals). */
  locked?: boolean;
  /** Reserved for a future data source — renders a calm placeholder. */
  upcoming?: boolean;
  /** Hidden by default when a user has no saved layout. */
  defaultHidden?: boolean;
  /** Full page this widget opens — every card should lead somewhere. */
  to?: string;
  /** Label for the link, e.g. "Open weight". */
  linkLabel?: string;
  render: () => React.ReactNode;
};

export type DashboardLayout = {
  order: WidgetId[];
  hidden: WidgetId[];
};

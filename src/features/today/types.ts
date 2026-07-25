export type TrafficLight = "good" | "watch" | "off";

export type Confidence = "High" | "Medium" | "Low";

export type GoalCard = {
  id: string;
  name: string;
  description: string;
  status: TrafficLight;
};

export type SummaryStat = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  detail?: string;
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

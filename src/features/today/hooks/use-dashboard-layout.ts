import { useCallback, useEffect, useMemo, useState } from "react";

import type { DashboardLayout, WidgetDefinition, WidgetId } from "../types";

const STORAGE_KEY = "bloom.today.layout.v1";

function defaultLayout(widgets: WidgetDefinition[]): DashboardLayout {
  return {
    order: widgets.map((w) => w.id),
    hidden: widgets.filter((w) => w.defaultHidden).map((w) => w.id),
  };
}

function reconcile(saved: DashboardLayout, widgets: WidgetDefinition[]): DashboardLayout {
  const known = new Set(widgets.map((w) => w.id));
  const order = saved.order.filter((id) => known.has(id));
  // Newly shipped widgets append to the end, keeping their default visibility.
  const added = widgets.filter((w) => !order.includes(w.id));
  const hidden = saved.hidden.filter((id) => known.has(id));
  for (const w of added) {
    order.push(w.id);
    if (w.defaultHidden) hidden.push(w.id);
  }
  return { order, hidden: hidden.filter((id) => !widgets.find((w) => w.id === id)?.locked) };
}

/**
 * Reorder / hide / restore state for the Today dashboard.
 * Persisted locally so the layout survives refreshes.
 */
export function useDashboardLayout(widgets: WidgetDefinition[]) {
  const initial = useMemo(() => defaultLayout(widgets), [widgets]);
  const [layout, setLayout] = useState<DashboardLayout>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DashboardLayout>;
        if (Array.isArray(parsed.order)) {
          setLayout(
            reconcile({ order: parsed.order, hidden: parsed.hidden ?? [] }, widgets),
          );
        }
      }
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback((next: DashboardLayout) => {
    setLayout(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — layout stays for this session */
    }
  }, []);

  const move = useCallback(
    (id: WidgetId, targetId: WidgetId) => {
      if (id === targetId) return;
      const order = [...layout.order];
      const from = order.indexOf(id);
      const to = order.indexOf(targetId);
      if (from < 0 || to < 0) return;
      order.splice(from, 1);
      order.splice(to, 0, id);
      persist({ ...layout, order });
    },
    [layout, persist],
  );

  const shift = useCallback(
    (id: WidgetId, direction: -1 | 1) => {
      const visible = layout.order.filter((wid) => !layout.hidden.includes(wid));
      const index = visible.indexOf(id);
      const neighbour = visible[index + direction];
      if (!neighbour) return;
      move(id, neighbour);
    },
    [layout, move],
  );

  const hide = useCallback(
    (id: WidgetId) => {
      if (layout.hidden.includes(id)) return;
      persist({ ...layout, hidden: [...layout.hidden, id] });
    },
    [layout, persist],
  );

  const show = useCallback(
    (id: WidgetId) => {
      persist({ ...layout, hidden: layout.hidden.filter((wid) => wid !== id) });
    },
    [layout, persist],
  );

  const reset = useCallback(() => persist(defaultLayout(widgets)), [persist, widgets]);

  const visibleWidgets = useMemo(
    () =>
      layout.order
        .filter((id) => !layout.hidden.includes(id))
        .map((id) => widgets.find((w) => w.id === id))
        .filter((w): w is WidgetDefinition => Boolean(w)),
    [layout, widgets],
  );

  const hiddenWidgets = useMemo(
    () =>
      layout.hidden
        .map((id) => widgets.find((w) => w.id === id))
        .filter((w): w is WidgetDefinition => Boolean(w)),
    [layout, widgets],
  );

  return { layout, hydrated, visibleWidgets, hiddenWidgets, move, shift, hide, show, reset };
}

import { useCallback, useEffect, useSyncExternalStore } from "react";

import {
  getEvents,
  hydrateEvents,
  isHydrated,
  logEvent,
  removeEvent,
  subscribeToEvents,
  type NewEvent,
} from "../store";
import type { BloomEvent } from "../types";

const emptyServer: BloomEvent[] = [];

/** Subscribes a component to Bloom's shared event list. */
export function useTimeline() {
  const events = useSyncExternalStore(subscribeToEvents, getEvents, () => emptyServer);

  // Reading stored events after mount keeps the first render identical on the
  // server and the client.
  useEffect(() => {
    hydrateEvents();
  }, []);

  const record = useCallback((event: NewEvent) => logEvent(event), []);
  const remove = useCallback((id: string) => removeEvent(id), []);

  return { events, hydrated: isHydrated(), record, remove };
}


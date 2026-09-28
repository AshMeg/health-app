import { useCallback, useEffect, useSyncExternalStore } from "react";

import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_PERSONALITY, type BloomPersonality } from "./tone";

const KEY = "bloom.personality.v1";
const listeners = new Set<() => void>();
let current: BloomPersonality = DEFAULT_PERSONALITY;
let loaded = false;

function set(p: BloomPersonality) {
  current = p;
  try {
    localStorage.setItem(KEY, p);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

/** Reads the saved preference from the profile once, with a local cache for instant use. */
async function load() {
  if (loaded) return;
  loaded = true;
  try {
    const cached = localStorage.getItem(KEY) as BloomPersonality | null;
    if (cached) set(cached);
  } catch {
    /* ignore */
  }
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  const { data } = await supabase.from("profiles").select("bloom_personality").eq("id", auth.user.id).maybeSingle();
  if (data?.bloom_personality) set(data.bloom_personality as BloomPersonality);
}

export function usePersonality() {
  useEffect(() => {
    void load();
  }, []);
  const personality = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => DEFAULT_PERSONALITY,
  );

  const setPersonality = useCallback(async (p: BloomPersonality) => {
    set(p);
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) await supabase.from("profiles").update({ bloom_personality: p }).eq("id", auth.user.id);
  }, []);

  return { personality, setPersonality };
}

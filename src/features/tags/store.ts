import { useEffect, useSyncExternalStore } from "react";

/**
 * Reusable tag system. Tags are their own records; links join a tag to any
 * entity (goal today; habit, memory, journal, garden later). Goals never store
 * tag names themselves, so renaming or deleting a tag updates everything.
 */
export type TagColour = "sage" | "lavender" | "blush" | "sky" | "stone";
export const tagColours: TagColour[] = ["sage", "lavender", "blush", "sky", "stone"];

export type BloomTag = {
  id: string;
  name: string;
  slug: string;
  colour: TagColour;
  createdAt: string;
  updatedAt: string;
};

export type TaggableEntity = "goal" | "habit" | "memory" | "journal" | "garden";

export type TagLink = {
  entityType: TaggableEntity;
  entityId: string;
  tagId: string;
  createdAt: string;
};

type State = { tags: BloomTag[]; links: TagLink[] };

const KEY = "bloom.tags.v1";
/** Offered to pick from — never created until someone actually chooses one. */
export const suggestedTagNames = [
  "Fitness", "Health", "Learning", "Career", "Relationships", "Finances",
  "Creativity", "Art", "Travel", "Personal growth", "Wellbeing",
];

let state: State = { tags: [], links: [] };
let hydrated = false;
const listeners = new Set<() => void>();
const serverState: State = { tags: [], links: [] };

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (Array.isArray(parsed.tags) && Array.isArray(parsed.links)) state = parsed;
    }
  } catch {
    /* ignore malformed storage */
  }
  listeners.forEach((l) => l());
}

function write(next: State) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l());
}

export const slugify = (name: string) =>
  name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function findTagByName(name: string) {
  const slug = slugify(name);
  return state.tags.find((t) => t.slug === slug);
}

/** Creates a tag, or returns the existing one with the same name. */
export function createTag(name: string): BloomTag | undefined {
  const clean = name.trim().replace(/\s+/g, " ");
  if (!clean) return;
  const existing = findTagByName(clean);
  if (existing) return existing;
  const now = new Date().toISOString();
  const tag: BloomTag = {
    id: `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: clean,
    slug: slugify(clean),
    colour: tagColours[state.tags.length % tagColours.length],
    createdAt: now,
    updatedAt: now,
  };
  write({ ...state, tags: [...state.tags, tag] });
  return tag;
}

/** Returns false when another tag already uses that name. */
export function renameTag(id: string, name: string): boolean {
  const clean = name.trim().replace(/\s+/g, " ");
  if (!clean) return false;
  const clash = findTagByName(clean);
  if (clash && clash.id !== id) return false;
  write({
    ...state,
    tags: state.tags.map((t) =>
      t.id === id ? { ...t, name: clean, slug: slugify(clean), updatedAt: new Date().toISOString() } : t,
    ),
  });
  return true;
}

export function setTagColour(id: string, colour: TagColour) {
  write({ ...state, tags: state.tags.map((t) => (t.id === id ? { ...t, colour } : t)) });
}

/** Removes the tag and its links — never the tagged things themselves. */
export function deleteTag(id: string) {
  write({ tags: state.tags.filter((t) => t.id !== id), links: state.links.filter((l) => l.tagId !== id) });
}

/** Replaces an entity's tags; duplicates are impossible by construction. */
export function setEntityTags(entityType: TaggableEntity, entityId: string, tagIds: string[]) {
  const unique = [...new Set(tagIds)].filter((id) => state.tags.some((t) => t.id === id));
  const kept = state.links.filter((l) => !(l.entityType === entityType && l.entityId === entityId));
  const previous = state.links.filter((l) => l.entityType === entityType && l.entityId === entityId);
  const now = new Date().toISOString();
  const links = unique.map(
    (tagId) => previous.find((l) => l.tagId === tagId) ?? { entityType, entityId, tagId, createdAt: now },
  );
  write({ ...state, links: [...kept, ...links] });
}

export function clearEntityTags(entityType: TaggableEntity, entityId: string) {
  setEntityTags(entityType, entityId, []);
}

export function tagIdsFor(s: State, entityType: TaggableEntity, entityId: string) {
  return s.links.filter((l) => l.entityType === entityType && l.entityId === entityId).map((l) => l.tagId);
}

export function useTags() {
  useEffect(hydrate, []);
  const s = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => serverState,
  );
  const tags = [...s.tags].sort((a, b) => a.name.localeCompare(b.name));
  const byId = new Map(s.tags.map((t) => [t.id, t]));
  const tagsFor = (entityType: TaggableEntity, entityId: string) =>
    tagIdsFor(s, entityType, entityId)
      .map((id) => byId.get(id))
      .filter((t): t is BloomTag => Boolean(t))
      .sort((a, b) => a.name.localeCompare(b.name));
  return { tags, links: s.links, byId, tagsFor };
}

export const tagChipClass: Record<TagColour, string> = {
  sage: "bg-sage-soft",
  lavender: "bg-lavender-soft",
  blush: "bg-blush-soft",
  sky: "bg-sky-soft",
  stone: "bg-stone-soft",
};

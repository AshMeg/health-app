import { getEvents, logEvents, type NewEvent } from "@/features/timeline/store";
import type { BloomEvent } from "@/features/timeline/types";
import { adapterById } from "./providers";
import type { ProviderRecord, SyncResult } from "./types";

/**
 * Import pipeline: provider records → adapter mapping → dedupe → shared store.
 * Once in the store, goals, Dashboard and Analytics pick them up like any log.
 */

const DAY = 24 * 60 * 60 * 1000;

/** Same provider + same provider id = already imported. */
export const sourceKey = (provider: string, recordId: string) => `${provider}::${recordId}`;

/**
 * A manual entry that very likely describes the same thing (same category,
 * same day, same value). Imports never overwrite it — the import is skipped
 * as a duplicate so the user's own entry stays untouched.
 */
export function matchesManual(candidate: NewEvent, events: BloomEvent[]) {
  const day = (candidate.at ?? "").slice(0, 10);
  return events.some(
    (e) =>
      !e.sourceProvider &&
      e.category === candidate.category &&
      e.at.slice(0, 10) === day &&
      e.value !== undefined &&
      e.value === candidate.value,
  );
}

export function importRecords(records: ProviderRecord[], sinceDays: number | null = null): SyncResult {
  const attemptedAt = new Date().toISOString();
  const provider = records[0]?.provider;
  const existing = getEvents();
  const seen = new Set(existing.filter((e) => e.sourceProvider && e.sourceRecordId).map((e) => sourceKey(e.sourceProvider!, e.sourceRecordId!)));
  const cutoff = sinceDays === null ? null : Date.now() - sinceDays * DAY;

  const toAdd: NewEvent[] = [];
  let skipped = 0;
  let duplicates = 0;
  let errors = 0;

  for (const r of records) {
    const adapter = adapterById[r.provider];
    if (!adapter || !r.recordId || Number.isNaN(Date.parse(r.at))) {
      errors++;
      continue;
    }
    if (cutoff !== null && Date.parse(r.at) < cutoff) {
      skipped++;
      continue;
    }
    const key = sourceKey(r.provider, r.recordId);
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    const mapped = adapter.mapToBloomRecord(r);
    if (!mapped) {
      skipped++;
      continue;
    }
    if (matchesManual(mapped, existing)) {
      duplicates++;
      continue;
    }
    seen.add(key);
    toAdd.push({ ...mapped, importedAt: attemptedAt });
  }

  const created = toAdd.length ? logEvents(toAdd) : [];
  const added: SyncResult["added"] = {};
  for (const e of created) added[e.category] = (added[e.category] ?? 0) + 1;

  return {
    provider: provider ?? "apple-health",
    attemptedAt,
    status: errors && created.length ? "partial" : errors ? "failed" : "success",
    imported: created.length,
    skipped,
    duplicates,
    errors,
    added,
  };
}

/** Imported records from one provider — used when the user disconnects and chooses to remove them. */
export const importedFrom = (provider: string, events: BloomEvent[]) =>
  events.filter((e) => e.sourceProvider === provider);

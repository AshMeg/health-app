import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failed, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_weight_logs",
  title: "List weight logs",
  description:
    "List the signed-in Bloom user's weight entries (weight in kg, body fat %, notes, source), newest first.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).default(30).describe("How many entries to return."),
    from: z.string().optional().describe("Optional earliest date, YYYY-MM-DD."),
    to: z.string().optional().describe("Optional latest date, YYYY-MM-DD."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, from, to }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    let query = supabaseForUser(ctx)
      .from("weight_logs")
      .select("id, date, weight_kg, body_fat_percent, notes, source")
      .order("date", { ascending: false })
      .limit(limit ?? 30);
    if (from) query = query.gte("date", from);
    if (to) query = query.lte("date", to);
    const { data, error } = await query;
    if (error) return failed(error.message);
    return ok(data ?? [], { entries: data ?? [] });
  },
});

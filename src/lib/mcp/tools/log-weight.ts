import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failed, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "log_weight",
  title: "Log a weight entry",
  description:
    "Create or update a weight entry for the signed-in Bloom user on a given date. Weight is in kilograms.",
  inputSchema: {
    weight_kg: z.number().min(20).max(400).describe("Body weight in kilograms."),
    date: z
      .string()
      .optional()
      .describe("Date of the entry, YYYY-MM-DD. Defaults to today (UTC)."),
    body_fat_percent: z.number().min(1).max(70).optional().describe("Optional body fat percent."),
    notes: z.string().max(500).optional().describe("Optional short note."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ weight_kg, date, body_fat_percent, notes }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const day = date ?? new Date().toISOString().slice(0, 10);
    const { data, error } = await supabaseForUser(ctx)
      .from("weight_logs")
      .insert({
        user_id: ctx.getUserId()!,
        date: day,
        weight_kg,
        body_fat_percent: body_fat_percent ?? null,
        notes: notes ?? null,
        source: "manual",
      })
      .select("id, date, weight_kg, body_fat_percent, notes")
      .single();
    if (error) return failed(error.message);
    return ok(data, { entry: data });
  },
});

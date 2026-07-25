import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failed, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_body_measurements",
  title: "List body measurements",
  description:
    "List the signed-in Bloom user's body measurement entries (waist, chest, hips, neck, arms, thighs, calves in cm), newest first.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).default(20).describe("How many entries to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("body_measurements")
      .select(
        "id, date, waist_cm, chest_cm, hips_cm, neck_cm, left_arm_cm, right_arm_cm, left_thigh_cm, right_thigh_cm, left_calf_cm, right_calf_cm, notes",
      )
      .order("date", { ascending: false })
      .limit(limit ?? 20);
    if (error) return failed(error.message);
    return ok(data ?? [], { entries: data ?? [] });
  },
});

import { defineTool } from "@lovable.dev/mcp-js";
import { failed, ok, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "get_profile",
  title: "Get profile and targets",
  description:
    "Read the signed-in Bloom user's profile: name, date of birth, biological sex, height, activity level, weight goal and daily calorie/protein/carb/fat targets.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("profiles")
      .select(
        "full_name, date_of_birth, biological_sex, height_cm, activity_level, weight_goal, calorie_target, protein_target, carb_target, fat_target",
      )
      .eq("id", ctx.getUserId()!)
      .maybeSingle();
    if (error) return failed(error.message);
    if (!data) return failed("No profile found for this account.");
    return ok(data, { profile: data });
  },
});

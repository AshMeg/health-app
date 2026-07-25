import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getProfile from "./tools/get-profile";
import listWeightLogs from "./tools/list-weight-logs";
import logWeight from "./tools/log-weight";
import listBodyMeasurements from "./tools/list-body-measurements";

// The OAuth issuer must be the direct Supabase host; the project ref is the only
// value that survives publish unchanged, and Vite inlines it at build time.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "bloom-mcp",
  title: "Bloom",
  version: "0.1.0",
  instructions:
    "Tools for Bloom, a personal health and performance tracker. Read the signed-in user's profile and targets, list their weight logs and body measurements, and log new weight entries. All data is scoped to the connected user's own account.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getProfile, listWeightLogs, logWeight, listBodyMeasurements],
});

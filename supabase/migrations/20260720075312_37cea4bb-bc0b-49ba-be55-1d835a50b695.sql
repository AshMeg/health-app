
-- Enums
CREATE TYPE public.biological_sex AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE public.activity_level AS ENUM ('sedentary', 'light', 'moderate', 'active', 'very_active');
CREATE TYPE public.weight_goal AS ENUM ('lose', 'maintain', 'gain');
CREATE TYPE public.data_source AS ENUM ('manual', 'apple_health', 'health_connect', 'garmin', 'strava', 'oura', 'whoop', 'myfitnesspal');

-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS biological_sex public.biological_sex,
  ADD COLUMN IF NOT EXISTS height_cm numeric(5,2),
  ADD COLUMN IF NOT EXISTS activity_level public.activity_level,
  ADD COLUMN IF NOT EXISTS calorie_target integer,
  ADD COLUMN IF NOT EXISTS protein_target integer,
  ADD COLUMN IF NOT EXISTS carb_target integer,
  ADD COLUMN IF NOT EXISTS fat_target integer,
  ADD COLUMN IF NOT EXISTS weight_goal public.weight_goal;

-- updated_at trigger on profiles (if not present)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- weight_logs
CREATE TABLE public.weight_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  weight_kg numeric(6,2) NOT NULL,
  body_fat_percent numeric(5,2),
  notes text,
  source public.data_source NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_logs TO authenticated;
GRANT ALL ON public.weight_logs TO service_role;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own weight logs" ON public.weight_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own weight logs" ON public.weight_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own weight logs" ON public.weight_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own weight logs" ON public.weight_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_weight_logs_user_date ON public.weight_logs (user_id, date DESC);
CREATE TRIGGER update_weight_logs_updated_at BEFORE UPDATE ON public.weight_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- body_measurements
CREATE TABLE public.body_measurements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  waist_cm numeric(5,2),
  chest_cm numeric(5,2),
  hips_cm numeric(5,2),
  neck_cm numeric(5,2),
  left_arm_cm numeric(5,2),
  right_arm_cm numeric(5,2),
  left_thigh_cm numeric(5,2),
  right_thigh_cm numeric(5,2),
  left_calf_cm numeric(5,2),
  right_calf_cm numeric(5,2),
  notes text,
  source public.data_source NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.body_measurements TO authenticated;
GRANT ALL ON public.body_measurements TO service_role;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own measurements" ON public.body_measurements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own measurements" ON public.body_measurements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own measurements" ON public.body_measurements FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own measurements" ON public.body_measurements FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_body_measurements_user_date ON public.body_measurements (user_id, date DESC);
CREATE TRIGGER update_body_measurements_updated_at BEFORE UPDATE ON public.body_measurements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

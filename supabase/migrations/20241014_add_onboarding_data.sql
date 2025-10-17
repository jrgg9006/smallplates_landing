-- Add onboarding data fields to profiles table
-- This allows us to store the user's recipe goal from the onboarding process

-- Add recipe goal fields to profiles table
ALTER TABLE public.profiles ADD COLUMN recipe_goal_category TEXT;
ALTER TABLE public.profiles ADD COLUMN recipe_goal_number INTEGER DEFAULT 40;

-- Add constraints to ensure valid data
ALTER TABLE public.profiles ADD CONSTRAINT recipe_goal_category_check 
CHECK (recipe_goal_category IN ('40-or-less', '40-60', '60-or-more') OR recipe_goal_category IS NULL);

ALTER TABLE public.profiles ADD CONSTRAINT recipe_goal_number_check 
CHECK (recipe_goal_number > 0 AND recipe_goal_number <= 100);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.recipe_goal_category IS 'Category from onboarding: 40-or-less, 40-60, 60-or-more';
COMMENT ON COLUMN public.profiles.recipe_goal_number IS 'Specific recipe target number based on onboarding category (40, 60, or 80)';

-- Update existing profiles with default goal if they don't have one
UPDATE public.profiles 
SET recipe_goal_category = '40-or-less', recipe_goal_number = 40 
WHERE recipe_goal_category IS NULL;
-- Create recipe_production_status table for tracking production workflow
CREATE TABLE IF NOT EXISTS public.recipe_production_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL UNIQUE REFERENCES public.guest_recipes(id) ON DELETE CASCADE,
  
  -- Production workflow checkboxes
  text_finalized_in_indesign BOOLEAN NOT NULL DEFAULT FALSE,
  image_generated BOOLEAN NOT NULL DEFAULT FALSE,
  image_placed_in_indesign BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Notes for tracking progress
  operations_notes TEXT,
  
  -- Recipe edit tracking
  production_completed_at TIMESTAMPTZ,  -- When all 3 boxes were first checked (ready to print)
  needs_review BOOLEAN NOT NULL DEFAULT FALSE,  -- Flag if recipe was edited after completion
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_recipe_production_status_recipe_id ON public.recipe_production_status(recipe_id);
CREATE INDEX idx_recipe_production_status_text_finalized ON public.recipe_production_status(text_finalized_in_indesign);
CREATE INDEX idx_recipe_production_status_image_generated ON public.recipe_production_status(image_generated);
CREATE INDEX idx_recipe_production_status_image_placed ON public.recipe_production_status(image_placed_in_indesign);
CREATE INDEX idx_recipe_production_status_needs_review ON public.recipe_production_status(needs_review);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_recipe_production_status_updated_at
  BEFORE UPDATE ON public.recipe_production_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to detect recipe edits after production completion
CREATE OR REPLACE FUNCTION public.check_recipe_edit_after_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- If recipe content changed (not just metadata)
  IF (OLD.recipe_name IS DISTINCT FROM NEW.recipe_name OR
      OLD.ingredients IS DISTINCT FROM NEW.ingredients OR
      OLD.instructions IS DISTINCT FROM NEW.instructions OR
      OLD.comments IS DISTINCT FROM NEW.comments) THEN
    
    -- Check if production was completed and recipe was edited after
    UPDATE public.recipe_production_status
    SET needs_review = TRUE
    WHERE recipe_id = NEW.id
      AND production_completed_at IS NOT NULL
      AND NEW.updated_at > production_completed_at;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to detect recipe edits after production completion
CREATE TRIGGER trigger_check_recipe_edit
  AFTER UPDATE ON public.guest_recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_recipe_edit_after_completion();

-- Add comments
COMMENT ON TABLE public.recipe_production_status IS 'Tracks production workflow status for recipes (text finalized, image generated, image placed)';
COMMENT ON COLUMN public.recipe_production_status.recipe_id IS 'Reference to the recipe';
COMMENT ON COLUMN public.recipe_production_status.text_finalized_in_indesign IS 'Whether recipe text has been finalized in InDesign';
COMMENT ON COLUMN public.recipe_production_status.image_generated IS 'Whether image has been generated';
COMMENT ON COLUMN public.recipe_production_status.image_placed_in_indesign IS 'Whether image has been placed in InDesign';
COMMENT ON COLUMN public.recipe_production_status.operations_notes IS 'Notes about the production progress';
COMMENT ON COLUMN public.recipe_production_status.production_completed_at IS 'Timestamp when all 3 checkboxes were first checked (ready to print)';
COMMENT ON COLUMN public.recipe_production_status.needs_review IS 'Flag indicating recipe was edited after production completion';
COMMENT ON FUNCTION public.check_recipe_edit_after_completion() IS 'Detects if a recipe was edited after production was completed and sets needs_review flag';


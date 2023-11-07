ALTER TABLE questions
ADD COLUMN IF NOT EXISTS unique_variants_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS unique_variants_max integer DEFAULT 1;
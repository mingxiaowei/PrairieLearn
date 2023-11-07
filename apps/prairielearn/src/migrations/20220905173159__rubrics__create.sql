CREATE TABLE IF NOT EXISTS
  rubrics (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    starting_points DOUBLE PRECISION NOT NULL,
    max_extra_points DOUBLE PRECISION NOT NULL,
    min_points DOUBLE PRECISION NOT NULL,
    replace_auto_points BOOLEAN NOT NULL,
    modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
  );

CREATE TABLE IF NOT EXISTS
  rubric_items (
    id BIGSERIAL PRIMARY KEY,
    rubric_id BIGINT NOT NULL REFERENCES rubrics (id) ON DELETE CASCADE ON UPDATE CASCADE,
    number BIGINT NOT NULL,
    points DOUBLE PRECISION NOT NULL,
    description VARCHAR(100) NOT NULL,
    explanation VARCHAR(10000),
    grader_note VARCHAR(10000),
    key_binding VARCHAR(30),
    deleted_at TIMESTAMP WITH TIME ZONE
  );

CREATE INDEX IF NOT EXISTS rubric_items_rubric_id ON rubric_items (rubric_id);

CREATE TABLE IF NOT EXISTS
  rubric_gradings (
    id BIGSERIAL PRIMARY KEY,
    rubric_id BIGINT NOT NULL REFERENCES rubrics (id) ON DELETE CASCADE ON UPDATE CASCADE,
    computed_points DOUBLE PRECISION NOT NULL,
    adjust_points DOUBLE PRECISION NOT NULL,
    starting_points DOUBLE PRECISION NOT NULL,
    max_extra_points DOUBLE PRECISION NOT NULL,
    min_points DOUBLE PRECISION NOT NULL
  );

CREATE TABLE IF NOT EXISTS
  rubric_grading_items (
    id BIGSERIAL PRIMARY KEY,
    rubric_grading_id BIGINT NOT NULL REFERENCES rubric_gradings (id) ON DELETE CASCADE ON UPDATE CASCADE,
    rubric_item_id BIGINT NOT NULL REFERENCES rubric_items (id) ON DELETE CASCADE ON UPDATE CASCADE,
    score DOUBLE PRECISION NOT NULL DEFAULT 1,
    points DOUBLE PRECISION NOT NULL,
    description VARCHAR(100) NOT NULL,
    UNIQUE (rubric_grading_id, rubric_item_id)
  );

ALTER TABLE assessment_questions
ADD COLUMN IF NOT EXISTS manual_rubric_id BIGINT REFERENCES rubrics (id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS manual_rubric_grading_id BIGINT REFERENCES rubric_gradings (id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE grading_jobs
ADD COLUMN IF NOT EXISTS manual_rubric_grading_id BIGINT REFERENCES rubric_gradings (id) ON DELETE SET NULL ON UPDATE CASCADE;

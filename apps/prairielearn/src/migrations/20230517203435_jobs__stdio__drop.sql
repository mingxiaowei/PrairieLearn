ALTER TABLE jobs
DROP COLUMN IF EXISTS stdin;

ALTER TABLE jobs
DROP COLUMN IF EXISTS stdout;

ALTER TABLE jobs
DROP COLUMN IF EXISTS stderr;

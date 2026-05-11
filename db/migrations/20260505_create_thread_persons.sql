-- Junction table: threads can reference multiple persons
CREATE TABLE thread_persons (
  thread_id  UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  person_id  UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (thread_id, person_id)
);

CREATE INDEX thread_persons_person_id_idx ON thread_persons (person_id);
CREATE INDEX thread_persons_thread_id_idx ON thread_persons (thread_id);

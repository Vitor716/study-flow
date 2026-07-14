CREATE INDEX idx_anki_notes_mature ON anki_notes(mature);
CREATE INDEX idx_anki_notes_interval ON anki_notes(last_known_interval_days);

ALTER TABLE study_cards ADD COLUMN obsidian_path TEXT;
ALTER TABLE study_cards ADD COLUMN obsidian_note_created_at TEXT;
ALTER TABLE study_cards ADD COLUMN obsidian_last_opened_at TEXT;

CREATE INDEX idx_study_cards_obsidian_path ON study_cards(obsidian_path);

CREATE TABLE anki_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL,
    note_id INTEGER NOT NULL,
    card_ids TEXT,
    deck_name TEXT NOT NULL,
    model_name TEXT NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    last_known_interval_days INTEGER,
    mature INTEGER NOT NULL DEFAULT 0 CHECK (mature IN (0, 1)),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (card_id) REFERENCES study_cards(id) ON DELETE CASCADE
);

CREATE INDEX idx_anki_notes_card_id ON anki_notes(card_id);
CREATE UNIQUE INDEX idx_anki_notes_note_id ON anki_notes(note_id);

CREATE TABLE flashcard_quality_checklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL,
    item_key TEXT NOT NULL,
    checked INTEGER NOT NULL DEFAULT 0 CHECK (checked IN (0, 1)),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (card_id) REFERENCES study_cards(id) ON DELETE CASCADE,
    UNIQUE (card_id, item_key)
);

CREATE INDEX idx_flashcard_quality_checklist_card_id
    ON flashcard_quality_checklist(card_id);

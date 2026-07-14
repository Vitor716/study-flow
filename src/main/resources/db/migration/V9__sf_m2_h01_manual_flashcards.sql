ALTER TABLE study_cards ADD COLUMN manual_flashcards_count INTEGER;
ALTER TABLE study_cards ADD COLUMN manual_flashcards_created_at DATE;
ALTER TABLE study_cards ADD COLUMN manual_flashcards_registered_at TIMESTAMP;

CREATE INDEX idx_study_cards_manual_flashcards_created_at
    ON study_cards(manual_flashcards_created_at);

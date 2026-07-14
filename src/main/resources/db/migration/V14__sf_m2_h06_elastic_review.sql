ALTER TABLE study_cards ADD COLUMN next_review_at DATE;
ALTER TABLE study_cards ADD COLUMN review_interval_days INTEGER NOT NULL DEFAULT 3;
ALTER TABLE study_cards ADD COLUMN last_reviewed_at TIMESTAMP;
ALTER TABLE study_cards ADD COLUMN review_skipped_at TIMESTAMP;

CREATE INDEX idx_study_cards_next_review_at
    ON study_cards(next_review_at);

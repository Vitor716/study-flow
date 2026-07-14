CREATE TABLE anki_connect_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    deck_name TEXT NOT NULL DEFAULT 'Study Flow',
    model_name TEXT NOT NULL DEFAULT 'Basic',
    mature_threshold_days INTEGER NOT NULL DEFAULT 21,
    auto_absorb_mature INTEGER NOT NULL DEFAULT 0 CHECK (auto_absorb_mature IN (0, 1)),
    daily_review_limit INTEGER NOT NULL DEFAULT 8,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

INSERT INTO anki_connect_config (
    id,
    deck_name,
    model_name,
    mature_threshold_days,
    auto_absorb_mature,
    daily_review_limit,
    created_at,
    updated_at
) VALUES (
    1,
    'Study Flow',
    'Basic',
    21,
    0,
    8,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

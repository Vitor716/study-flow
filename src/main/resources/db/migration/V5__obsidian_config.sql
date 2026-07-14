CREATE TABLE system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

INSERT INTO system_config (key, value, created_at, updated_at)
VALUES
    ('obsidian.vaultName', '', datetime('now'), datetime('now')),
    ('obsidian.vaultPath', '', datetime('now'), datetime('now')),
    ('obsidian.notesFolder', '04 - CEREBRO', datetime('now'), datetime('now'));

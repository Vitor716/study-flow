DROP INDEX IF EXISTS idx_study_cards_estagio;
DROP INDEX IF EXISTS idx_study_cards_contexto;
DROP INDEX IF EXISTS idx_study_cards_prioridade;
DROP INDEX IF EXISTS idx_study_cards_estagio_order;
DROP INDEX IF EXISTS idx_study_cards_obsidian_path;

CREATE TABLE study_cards_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descricao TEXT,
    contexto TEXT NOT NULL,
    prioridade TEXT NOT NULL CHECK (prioridade IN ('ALTA', 'MEDIA', 'BAIXA')),
    estagio TEXT NOT NULL DEFAULT 'TRIAGEM' CHECK (estagio IN (
        'TRIAGEM',
        'ESTUDO_ATIVO',
        'APLICACAO',
        'REFINAMENTO',
        'CONSOLIDACAO',
        'ABSORVIDO'
    )),
    order_index INTEGER NOT NULL DEFAULT 0,
    obsidian_path TEXT,
    obsidian_note_created_at TIMESTAMP,
    obsidian_last_opened_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

INSERT INTO study_cards_new (
    id,
    titulo,
    descricao,
    contexto,
    prioridade,
    estagio,
    order_index,
    obsidian_path,
    obsidian_note_created_at,
    obsidian_last_opened_at,
    created_at,
    updated_at
)
SELECT
    id,
    titulo,
    descricao,
    contexto,
    prioridade,
    estagio,
    order_index,
    obsidian_path,
    obsidian_note_created_at,
    obsidian_last_opened_at,
    created_at,
    updated_at
FROM study_cards;

DROP TABLE study_cards;

ALTER TABLE study_cards_new RENAME TO study_cards;

CREATE INDEX idx_study_cards_estagio ON study_cards(estagio);
CREATE INDEX idx_study_cards_contexto ON study_cards(contexto);
CREATE INDEX idx_study_cards_prioridade ON study_cards(prioridade);
CREATE INDEX idx_study_cards_estagio_order ON study_cards(estagio, order_index);
CREATE INDEX idx_study_cards_obsidian_path ON study_cards(obsidian_path);

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
    created_at,
    updated_at
)
SELECT
    id,
    titulo,
    descricao,
    contexto,
    prioridade,
    CASE
        WHEN estagio IN ('GATILHO', 'CAPTURA') THEN 'TRIAGEM'
        ELSE estagio
    END,
    order_index,
    created_at,
    updated_at
FROM study_cards;

CREATE TABLE card_tags_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('LINGUAGEM', 'TIPO')),
    valor TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (card_id) REFERENCES study_cards(id) ON DELETE CASCADE
);

INSERT INTO card_tags_new (id, card_id, categoria, valor, created_at)
SELECT id, card_id, categoria, valor, created_at
FROM card_tags;

CREATE TABLE stage_history_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL,
    from_stage TEXT CHECK (
       from_stage IS NULL OR from_stage IN (
            'TRIAGEM',
            'ESTUDO_ATIVO',
            'APLICACAO',
            'REFINAMENTO',
            'CONSOLIDACAO',
            'ABSORVIDO'
        )
    ),
    to_stage TEXT NOT NULL CHECK (to_stage IN (
        'TRIAGEM',
        'ESTUDO_ATIVO',
        'APLICACAO',
        'REFINAMENTO',
        'CONSOLIDACAO',
        'ABSORVIDO'
    )),
    razao TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (card_id) REFERENCES study_cards(id) ON DELETE CASCADE
);

INSERT INTO stage_history_new (
    id,
    card_id,
    from_stage,
    to_stage,
    razao,
    created_at,
    updated_at
)
SELECT
    id,
    card_id,
    CASE
        WHEN from_stage IN ('GATILHO', 'CAPTURA') THEN 'TRIAGEM'
        ELSE from_stage
    END,
    CASE
        WHEN to_stage IN ('GATILHO', 'CAPTURA') THEN 'TRIAGEM'
        ELSE to_stage
    END,
    razao,
    created_at,
    updated_at
FROM stage_history;

CREATE TABLE recursos_estudo_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN (
        'VIDEO',
        'ARTIGO',
        'CURSO',
        'LIVRO',
        'DOCUMENTACAO',
        'BUG',
        'TAREFA',
        'OUTRO'
    )),
    titulo TEXT NOT NULL,
    url TEXT,
    observacoes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (card_id) REFERENCES study_cards(id) ON DELETE CASCADE
);

INSERT INTO recursos_estudo_new (
    id,
    card_id,
    tipo,
    titulo,
    url,
    observacoes,
    created_at,
    updated_at
)
SELECT
    id,
    card_id,
    tipo,
    titulo,
    url,
    observacoes,
    created_at,
    updated_at
FROM recursos_estudo;

CREATE TABLE evidencias_ativas_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN (
        'TEXTO',
        'CODIGO',
        'PERGUNTA_RESPOSTA',
        'DECISAO_TECNICA',
        'RESUMO_ATIVO',
        'CHECKLIST'
    )),
    titulo TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (card_id) REFERENCES study_cards(id) ON DELETE CASCADE
);

INSERT INTO evidencias_ativas_new (
    id,
    card_id,
    tipo,
    titulo,
    conteudo,
    created_at,
    updated_at
)
SELECT
    id,
    card_id,
    tipo,
    titulo,
    conteudo,
    created_at,
    updated_at
FROM evidencias_ativas;

DROP TABLE evidencias_ativas;
DROP TABLE recursos_estudo;
DROP TABLE stage_history;
DROP TABLE card_tags;
DROP TABLE study_cards;

ALTER TABLE study_cards_new RENAME TO study_cards;
ALTER TABLE card_tags_new RENAME TO card_tags;
ALTER TABLE stage_history_new RENAME TO stage_history;
ALTER TABLE recursos_estudo_new RENAME TO recursos_estudo;
ALTER TABLE evidencias_ativas_new RENAME TO evidencias_ativas;

CREATE INDEX idx_study_cards_estagio ON study_cards(estagio);
CREATE INDEX idx_study_cards_contexto ON study_cards(contexto);
CREATE INDEX idx_study_cards_prioridade ON study_cards(prioridade);
CREATE INDEX idx_study_cards_estagio_order ON study_cards(estagio, order_index);
CREATE INDEX idx_card_tags_card_id ON card_tags(card_id);
CREATE INDEX idx_card_tags_categoria_valor ON card_tags(categoria, valor);
CREATE INDEX idx_stage_history_card_id ON stage_history(card_id);
CREATE INDEX idx_stage_history_created_at ON stage_history(created_at);
CREATE INDEX idx_recursos_estudo_card_id ON recursos_estudo(card_id);
CREATE INDEX idx_recursos_estudo_tipo ON recursos_estudo(tipo);
CREATE INDEX idx_evidencias_ativas_card_id ON evidencias_ativas(card_id);
CREATE INDEX idx_evidencias_ativas_tipo ON evidencias_ativas(tipo);

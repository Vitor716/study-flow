CREATE TABLE recursos_estudo (
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

CREATE INDEX idx_recursos_estudo_card_id ON recursos_estudo(card_id);
CREATE INDEX idx_recursos_estudo_tipo ON recursos_estudo(tipo);

CREATE TABLE evidencias_ativas (
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

CREATE INDEX idx_evidencias_ativas_card_id ON evidencias_ativas(card_id);
CREATE INDEX idx_evidencias_ativas_tipo ON evidencias_ativas(tipo);

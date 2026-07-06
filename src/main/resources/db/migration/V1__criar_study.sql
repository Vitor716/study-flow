CREATE TABLE study_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descricao TEXT,
    contexto TEXT NOT NULL,
    prioridade TEXT NOT NULL CHECK (prioridade IN ('ALTA', 'MEDIA', 'BAIXA')),
    estagio TEXT NOT NULL DEFAULT 'GATILHO' CHECK (estagio IN (
                                                        'GATILHO',
                                                        'CAPTURA',
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

CREATE INDEX idx_study_cards_estagio ON study_cards(estagio);
CREATE INDEX idx_study_cards_contexto ON study_cards(contexto);
CREATE INDEX idx_study_cards_prioridade ON study_cards(prioridade);
CREATE INDEX idx_study_cards_estagio_order ON study_cards(estagio, order_index);

CREATE TABLE card_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('LINGUAGEM', 'TIPO')),
    valor TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (card_id) REFERENCES study_cards(id) ON DELETE CASCADE
);

CREATE INDEX idx_card_tags_card_id ON card_tags(card_id);
CREATE INDEX idx_card_tags_categoria_valor ON card_tags(categoria, valor);

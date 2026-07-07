CREATE TABLE stage_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL,
    from_stage TEXT CHECK (
       from_stage IS NULL OR from_stage IN (
                                            'GATILHO',
                                            'CAPTURA',
                                            'ESTUDO_ATIVO',
                                            'APLICACAO',
                                            'REFINAMENTO',
                                            'CONSOLIDACAO',
                                            'ABSORVIDO'
           )
       ),
    to_stage TEXT NOT NULL CHECK (to_stage IN (
                                              'GATILHO',
                                              'CAPTURA',
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

CREATE INDEX idx_stage_history_card_id ON stage_history(card_id);
CREATE INDEX idx_stage_history_created_at ON stage_history(created_at);

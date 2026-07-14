UPDATE study_cards
SET created_at = replace(created_at, 'T', ' ')
WHERE created_at LIKE '%T%';

UPDATE study_cards
SET updated_at = replace(updated_at, 'T', ' ')
WHERE updated_at LIKE '%T%';

UPDATE study_cards
SET obsidian_note_created_at = replace(obsidian_note_created_at, 'T', ' ')
WHERE obsidian_note_created_at LIKE '%T%';

UPDATE study_cards
SET obsidian_last_opened_at = replace(obsidian_last_opened_at, 'T', ' ')
WHERE obsidian_last_opened_at LIKE '%T%';

UPDATE card_tags
SET created_at = replace(created_at, 'T', ' ')
WHERE created_at LIKE '%T%';

UPDATE stage_history
SET created_at = replace(created_at, 'T', ' ')
WHERE created_at LIKE '%T%';

UPDATE stage_history
SET updated_at = replace(updated_at, 'T', ' ')
WHERE updated_at LIKE '%T%';

UPDATE recursos_estudo
SET created_at = replace(created_at, 'T', ' ')
WHERE created_at LIKE '%T%';

UPDATE recursos_estudo
SET updated_at = replace(updated_at, 'T', ' ')
WHERE updated_at LIKE '%T%';

UPDATE evidencias_ativas
SET created_at = replace(created_at, 'T', ' ')
WHERE created_at LIKE '%T%';

UPDATE evidencias_ativas
SET updated_at = replace(updated_at, 'T', ' ')
WHERE updated_at LIKE '%T%';

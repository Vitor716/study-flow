package org.example.flowstudy.studycard.application.port

import org.example.flowstudy.studycard.domain.model.AnkiNote
import org.example.flowstudy.studycard.infrastructure.persistence.JpaAnkiNoteRepository

interface AnkiNoteRepository : JpaAnkiNoteRepository {
    override fun findByCardId(cardId: Long): List<AnkiNote>
    override fun deleteByCardId(cardId: Long)
}

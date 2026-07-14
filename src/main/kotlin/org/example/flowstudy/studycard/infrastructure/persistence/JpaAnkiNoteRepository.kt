package org.example.flowstudy.studycard.infrastructure.persistence

import org.example.flowstudy.studycard.domain.model.AnkiNote
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface JpaAnkiNoteRepository : JpaRepository<AnkiNote, Long> {
    fun findByCardId(cardId: Long): List<AnkiNote>
    fun deleteByCardId(cardId: Long)
}

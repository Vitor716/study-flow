package org.example.flowstudy.studycard.infrastructure.persistence

import org.example.flowstudy.studycard.domain.model.FlashcardQualityChecklistItem
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface JpaFlashcardQualityChecklistRepository : JpaRepository<FlashcardQualityChecklistItem, Long> {
    fun findByCardId(cardId: Long): List<FlashcardQualityChecklistItem>
    fun deleteByCardId(cardId: Long)
}

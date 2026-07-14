package org.example.flowstudy.studycard.application.port

import org.example.flowstudy.studycard.domain.model.FlashcardQualityChecklistItem
import org.example.flowstudy.studycard.infrastructure.persistence.JpaFlashcardQualityChecklistRepository

interface FlashcardQualityChecklistRepository : JpaFlashcardQualityChecklistRepository {
    override fun findByCardId(cardId: Long): List<FlashcardQualityChecklistItem>
    override fun deleteByCardId(cardId: Long)
}

package org.example.flowstudy.studycard.api.dto

import org.example.flowstudy.studycard.domain.model.AnkiConnectConfig
import org.example.flowstudy.studycard.domain.model.AnkiNote
import org.example.flowstudy.studycard.domain.model.FlashcardQualityChecklistItem
import org.example.flowstudy.studycard.domain.model.StudyCard
import java.time.LocalDate
import java.time.LocalDateTime

data class ManualFlashcardsRequest(
    val quantidade: Int,
    val dataCriacao: LocalDate
)

data class FlashcardQualityChecklistResponse(
    val items: List<FlashcardQualityChecklistItemResponse>,
    val checkedCount: Int,
    val totalCount: Int,
    val complete: Boolean
)

data class FlashcardQualityChecklistItemResponse(
    val key: String,
    val label: String,
    val checked: Boolean
) {
    companion object {
        fun fromEntity(entity: FlashcardQualityChecklistItem, label: String): FlashcardQualityChecklistItemResponse =
            FlashcardQualityChecklistItemResponse(
                key = entity.itemKey,
                label = label,
                checked = entity.checked
            )
    }
}

data class FlashcardQualityChecklistRequest(
    val items: List<FlashcardQualityChecklistItemUpdate>
)

data class FlashcardQualityChecklistItemUpdate(
    val key: String,
    val checked: Boolean
)

data class AnkiConnectConfigRequest(
    val deckName: String,
    val modelName: String = "Basic",
    val matureThresholdDays: Int = 21,
    val autoAbsorbMature: Boolean = false,
    val dailyReviewLimit: Int = 8
)

data class AnkiConnectConfigResponse(
    val deckName: String,
    val modelName: String,
    val matureThresholdDays: Int,
    val autoAbsorbMature: Boolean,
    val dailyReviewLimit: Int
) {
    companion object {
        fun fromEntity(entity: AnkiConnectConfig): AnkiConnectConfigResponse =
            AnkiConnectConfigResponse(
                deckName = entity.deckName,
                modelName = entity.modelName,
                matureThresholdDays = entity.matureThresholdDays,
                autoAbsorbMature = entity.autoAbsorbMature,
                dailyReviewLimit = entity.dailyReviewLimit
            )
    }
}

data class AnkiConnectStatusResponse(
    val connected: Boolean,
    val message: String,
    val version: String? = null
)

data class AnkiNoteRequest(
    val front: String,
    val back: String
)

data class AnkiNoteResponse(
    val id: Long,
    val cardId: Long,
    val noteId: Long,
    val cardIds: String?,
    val deckName: String,
    val modelName: String,
    val front: String,
    val back: String,
    val lastKnownIntervalDays: Int?,
    val mature: Boolean,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
) {
    companion object {
        fun fromEntity(entity: AnkiNote): AnkiNoteResponse =
            AnkiNoteResponse(
                id = entity.id ?: 0,
                cardId = entity.cardId ?: 0,
                noteId = entity.noteId,
                cardIds = entity.cardIds,
                deckName = entity.deckName,
                modelName = entity.modelName,
                front = entity.front,
                back = entity.back,
                lastKnownIntervalDays = entity.lastKnownIntervalDays,
                mature = entity.mature,
                createdAt = entity.createdAt,
                updatedAt = entity.updatedAt
            )
    }
}

data class ReviewQueueResponse(
    val suggested: List<StudyCardResponse>,
    val overflow: List<StudyCardResponse>,
    val dailyLimit: Int
)

data class ReviewActionResponse(
    val card: StudyCardResponse,
    val message: String
)

fun StudyCard.hasTransferEvidence(evidenceCount: Int): Boolean = evidenceCount > 0

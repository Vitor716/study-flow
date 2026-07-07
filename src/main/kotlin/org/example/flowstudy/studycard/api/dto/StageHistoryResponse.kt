package org.example.flowstudy.studycard.api.dto

import org.example.flowstudy.studycard.domain.model.StageHistory
import java.time.LocalDateTime

data class StageHistoryResponse(
    val id: Long,
    val cardId: Long,
    val fromEstage: String,
    val toEstage: String,
    val razao: String,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
) {
    companion object {
        fun fromEntity(entity: StageHistory): StageHistoryResponse =
            StageHistoryResponse(
                id = entity.id ?: 0,
                cardId = entity.cardId?: 0,
                fromEstage = entity.fromEstage.name,
                toEstage = entity.toEstage.name,
                razao = entity.razao,
                createdAt = entity.createdAt,
                updatedAt = entity.updatedAt
            )
    }
}

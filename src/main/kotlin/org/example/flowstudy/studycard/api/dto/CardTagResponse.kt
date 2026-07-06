package org.example.flowstudy.studycard.api.dto

import org.example.flowstudy.studycard.domain.model.CardTag
import org.example.flowstudy.studycard.domain.model.enums.CategoriaTag
import java.time.LocalDateTime

data class CardTagResponse(
    val id: Long,
    val categoria: CategoriaTag,
    val valor: String,
    val createdAt: LocalDateTime
) {
    companion object {
        fun fromEntity(cardTag: CardTag): CardTagResponse =
            CardTagResponse(
                id = cardTag.id ?: 0,
                categoria = cardTag.categoria,
                valor = cardTag.valor,
                createdAt = cardTag.createdAt
            )
    }
}

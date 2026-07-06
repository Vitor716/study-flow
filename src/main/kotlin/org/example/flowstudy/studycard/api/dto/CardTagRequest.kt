package org.example.flowstudy.studycard.api.dto

import org.example.flowstudy.studycard.domain.model.CardTag
import org.example.flowstudy.studycard.domain.model.StudyCard
import org.example.flowstudy.studycard.domain.model.enums.CategoriaTag

data class CardTagRequest(
    val categoria: CategoriaTag,
    val valor: String
)

fun CardTagRequest.toEntity(studyCard: StudyCard): CardTag =
    CardTag().also { cardTag ->
        cardTag.card = studyCard
        cardTag.categoria = categoria
        cardTag.valor = valor
    }

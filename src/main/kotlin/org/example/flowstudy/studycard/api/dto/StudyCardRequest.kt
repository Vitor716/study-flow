package org.example.flowstudy.studycard.api.dto

import org.example.flowstudy.studycard.domain.model.StudyCard
import org.example.flowstudy.studycard.domain.model.enums.Estagio
import org.example.flowstudy.studycard.domain.model.enums.Prioridade
import java.util.Collections.emptyList

data class StudyCardRequest(
    val titulo: String,
    val descricao: String? = null,
    val contexto: String,
    val prioridade: Prioridade = Prioridade.MEDIA,
    val estagio: Estagio = Estagio.TRIAGEM,
    val orderIndex: Int = 0,
    val tags: List<CardTagRequest> = emptyList()
)

fun StudyCardRequest.toEntity(): StudyCard =
    StudyCard().also { studyCard ->
        studyCard.titulo = titulo
        studyCard.descricao = descricao
        studyCard.contexto = contexto
        studyCard.prioridade = prioridade
        studyCard.estagio = estagio
        studyCard.orderIndex = orderIndex
        studyCard.tags = tags
            .map { it.toEntity(studyCard) }
            .toMutableList()
    }

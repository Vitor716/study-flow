package org.example.flowstudy.studycard.api.dto

import org.example.flowstudy.studycard.domain.model.StudyCard
import org.example.flowstudy.studycard.domain.model.enums.Estagio
import org.example.flowstudy.studycard.domain.model.enums.Prioridade
import java.time.LocalDateTime

data class StudyCardResponse(
    val id: Long,
    val titulo: String,
    val descricao: String?,
    val contexto: String,
    val prioridade: Prioridade,
    val estagio: Estagio,
    val orderIndex: Int,
    val tags: List<CardTagResponse>,
    val obsidianPath: String?,
    val obsidianNoteCreatedAt: LocalDateTime?,
    val obsidianLastOpenedAt: LocalDateTime?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
) {
    companion object {
        fun fromEntity(studyCard: StudyCard): StudyCardResponse =
            StudyCardResponse(
                id = studyCard.id ?: 0,
                titulo = studyCard.titulo,
                descricao = studyCard.descricao,
                contexto = studyCard.contexto,
                prioridade = studyCard.prioridade,
                estagio = studyCard.estagio,
                orderIndex = studyCard.orderIndex,
                tags = studyCard.tags.map(CardTagResponse::fromEntity),
                obsidianPath = studyCard.obsidianPath,
                obsidianNoteCreatedAt = studyCard.obsidianNoteCreatedAt,
                obsidianLastOpenedAt = studyCard.obsidianLastOpenedAt,
                createdAt = studyCard.createdAt,
                updatedAt = studyCard.updatedAt
            )
    }
}

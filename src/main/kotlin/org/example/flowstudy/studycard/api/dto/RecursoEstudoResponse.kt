package org.example.flowstudy.studycard.api.dto

import org.example.flowstudy.studycard.domain.model.RecursoEstudo
import org.example.flowstudy.studycard.domain.model.enums.TipoRecursoEstudo
import java.time.LocalDateTime

data class RecursoEstudoResponse(
    val id: Long,
    val cardId: Long,
    val tipo: TipoRecursoEstudo,
    val titulo: String,
    val url: String?,
    val observacoes: String?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
) {
    companion object {
        fun fromEntity(entity: RecursoEstudo): RecursoEstudoResponse =
            RecursoEstudoResponse(
                id = entity.id ?: 0,
                cardId = entity.cardId ?: 0,
                tipo = entity.tipo,
                titulo = entity.titulo,
                url = entity.url,
                observacoes = entity.observacoes,
                createdAt = entity.createdAt,
                updatedAt = entity.updatedAt
            )
    }
}

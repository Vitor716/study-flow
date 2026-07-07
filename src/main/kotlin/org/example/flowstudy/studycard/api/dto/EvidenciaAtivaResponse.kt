package org.example.flowstudy.studycard.api.dto

import org.example.flowstudy.studycard.domain.model.EvidenciaAtiva
import org.example.flowstudy.studycard.domain.model.enums.TipoEvidenciaAtiva
import java.time.LocalDateTime

data class EvidenciaAtivaResponse(
    val id: Long,
    val cardId: Long,
    val tipo: TipoEvidenciaAtiva,
    val titulo: String,
    val conteudo: String,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
) {
    companion object {
        fun fromEntity(entity: EvidenciaAtiva): EvidenciaAtivaResponse =
            EvidenciaAtivaResponse(
                id = entity.id ?: 0,
                cardId = entity.cardId ?: 0,
                tipo = entity.tipo,
                titulo = entity.titulo,
                conteudo = entity.conteudo,
                createdAt = entity.createdAt,
                updatedAt = entity.updatedAt
            )
    }
}

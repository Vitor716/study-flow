package org.example.flowstudy.studycard.api.dto

import org.example.flowstudy.studycard.domain.model.EvidenciaAtiva
import org.example.flowstudy.studycard.domain.model.enums.TipoEvidenciaAtiva

data class EvidenciaAtivaRequest(
    val cardId: Long = 0,
    val tipo: TipoEvidenciaAtiva,
    val titulo: String,
    val conteudo: String
)

fun EvidenciaAtivaRequest.toEntity(): EvidenciaAtiva =
    EvidenciaAtiva().also { evidenciaAtiva ->
        evidenciaAtiva.cardId = cardId
        evidenciaAtiva.tipo = tipo
        evidenciaAtiva.titulo = titulo
        evidenciaAtiva.conteudo = conteudo
    }

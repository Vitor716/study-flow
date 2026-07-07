package org.example.flowstudy.studycard.application.service

import org.example.flowstudy.studycard.api.dto.EvidenciaAtivaRequest
import org.example.flowstudy.studycard.api.dto.EvidenciaAtivaResponse

interface EvidenciaAtivaService {
    fun criar(request: EvidenciaAtivaRequest): EvidenciaAtivaResponse
    fun atualizar(cardId: Long, id: Long, request: EvidenciaAtivaRequest): EvidenciaAtivaResponse
    fun apagar(cardId: Long, id: Long)
    fun buscarPorCard(cardId: Long): List<EvidenciaAtivaResponse>
}

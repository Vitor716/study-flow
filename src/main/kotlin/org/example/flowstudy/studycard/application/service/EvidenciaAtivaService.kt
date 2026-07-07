package org.example.flowstudy.studycard.application.service

import org.example.flowstudy.studycard.api.dto.EvidenciaAtivaRequest
import org.example.flowstudy.studycard.api.dto.EvidenciaAtivaResponse

interface EvidenciaAtivaService {
    fun criar(request: EvidenciaAtivaRequest): EvidenciaAtivaResponse
    fun buscarPorCard(cardId: Long): List<EvidenciaAtivaResponse>
}

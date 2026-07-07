package org.example.flowstudy.studycard.application.service.impl

import org.example.flowstudy.studycard.api.dto.EvidenciaAtivaRequest
import org.example.flowstudy.studycard.api.dto.EvidenciaAtivaResponse
import org.example.flowstudy.studycard.api.dto.toEntity
import org.example.flowstudy.studycard.application.port.EvidenciaAtivaRepository
import org.example.flowstudy.studycard.application.service.EvidenciaAtivaService
import org.springframework.stereotype.Service

@Service
class EvidenciaAtivaServiceImpl(
    private val repository: EvidenciaAtivaRepository
) : EvidenciaAtivaService {

    override fun criar(request: EvidenciaAtivaRequest): EvidenciaAtivaResponse {
        val evidenciaAtiva = repository.save(request.toEntity())
        return EvidenciaAtivaResponse.fromEntity(evidenciaAtiva)
    }

    override fun buscarPorCard(cardId: Long): List<EvidenciaAtivaResponse> {
        val evidenciasAtivas = repository.findByCardId(cardId)
        return evidenciasAtivas.map { EvidenciaAtivaResponse.fromEntity(it) }
    }
}

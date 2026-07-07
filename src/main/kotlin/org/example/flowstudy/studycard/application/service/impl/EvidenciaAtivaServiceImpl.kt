package org.example.flowstudy.studycard.application.service.impl

import org.example.flowstudy.studycard.api.dto.EvidenciaAtivaRequest
import org.example.flowstudy.studycard.api.dto.EvidenciaAtivaResponse
import org.example.flowstudy.studycard.api.dto.toEntity
import org.example.flowstudy.studycard.application.port.EvidenciaAtivaRepository
import org.example.flowstudy.studycard.application.service.EvidenciaAtivaService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class EvidenciaAtivaServiceImpl(
    private val repository: EvidenciaAtivaRepository
) : EvidenciaAtivaService {

    override fun criar(request: EvidenciaAtivaRequest): EvidenciaAtivaResponse {
        val evidenciaAtiva = repository.save(request.toEntity())
        return EvidenciaAtivaResponse.fromEntity(evidenciaAtiva)
    }

    @Transactional
    override fun atualizar(cardId: Long, id: Long, request: EvidenciaAtivaRequest): EvidenciaAtivaResponse {
        val evidenciaAtiva = repository.findById(id).orElseThrow {
            IllegalArgumentException("Evidencia nao encontrada com id: $id")
        }

        if (evidenciaAtiva.cardId != cardId) {
            throw IllegalArgumentException("Evidencia nao pertence ao card: $cardId")
        }

        evidenciaAtiva.tipo = request.tipo
        evidenciaAtiva.titulo = request.titulo
        evidenciaAtiva.conteudo = request.conteudo

        return EvidenciaAtivaResponse.fromEntity(repository.save(evidenciaAtiva))
    }

    @Transactional
    override fun apagar(cardId: Long, id: Long) {
        val evidenciaAtiva = repository.findById(id).orElseThrow {
            IllegalArgumentException("Evidencia nao encontrada com id: $id")
        }

        if (evidenciaAtiva.cardId != cardId) {
            throw IllegalArgumentException("Evidencia nao pertence ao card: $cardId")
        }

        repository.delete(evidenciaAtiva)
    }

    override fun buscarPorCard(cardId: Long): List<EvidenciaAtivaResponse> {
        val evidenciasAtivas = repository.findByCardId(cardId)
        return evidenciasAtivas.map { EvidenciaAtivaResponse.fromEntity(it) }
    }
}

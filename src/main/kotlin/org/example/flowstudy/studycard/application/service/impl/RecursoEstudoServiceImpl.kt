package org.example.flowstudy.studycard.application.service.impl

import org.example.flowstudy.studycard.api.dto.RecursoEstudoRequest
import org.example.flowstudy.studycard.api.dto.RecursoEstudoResponse
import org.example.flowstudy.studycard.api.dto.toEntity
import org.example.flowstudy.studycard.application.port.RecursoEstudoRepository
import org.example.flowstudy.studycard.application.service.RecursoEstudoService
import org.springframework.stereotype.Service

@Service
class RecursoEstudoServiceImpl(
    private val repository: RecursoEstudoRepository
) : RecursoEstudoService {

    override fun criar(request: RecursoEstudoRequest): RecursoEstudoResponse {
        val recursoEstudo = repository.save(request.toEntity())
        return RecursoEstudoResponse.fromEntity(recursoEstudo)
    }

    override fun buscarPorCard(cardId: Long): List<RecursoEstudoResponse> {
        val recursosEstudo = repository.findByCardId(cardId)
        return recursosEstudo.map { RecursoEstudoResponse.fromEntity(it) }
    }
}

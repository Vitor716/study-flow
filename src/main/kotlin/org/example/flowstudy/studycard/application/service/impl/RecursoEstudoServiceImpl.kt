package org.example.flowstudy.studycard.application.service.impl

import org.example.flowstudy.studycard.api.dto.RecursoEstudoRequest
import org.example.flowstudy.studycard.api.dto.RecursoEstudoResponse
import org.example.flowstudy.studycard.api.dto.toEntity
import org.example.flowstudy.studycard.application.port.RecursoEstudoRepository
import org.example.flowstudy.studycard.application.service.RecursoEstudoService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class RecursoEstudoServiceImpl(
    private val repository: RecursoEstudoRepository
) : RecursoEstudoService {

    override fun criar(request: RecursoEstudoRequest): RecursoEstudoResponse {
        val recursoEstudo = repository.save(request.toEntity())
        return RecursoEstudoResponse.fromEntity(recursoEstudo)
    }

    @Transactional
    override fun atualizar(cardId: Long, id: Long, request: RecursoEstudoRequest): RecursoEstudoResponse {
        val recursoEstudo = repository.findById(id).orElseThrow {
            IllegalArgumentException("Recurso nao encontrado com id: $id")
        }

        if (recursoEstudo.cardId != cardId) {
            throw IllegalArgumentException("Recurso nao pertence ao card: $cardId")
        }

        recursoEstudo.tipo = request.tipo
        recursoEstudo.titulo = request.titulo
        recursoEstudo.url = request.url
        recursoEstudo.observacoes = request.observacoes

        return RecursoEstudoResponse.fromEntity(repository.save(recursoEstudo))
    }

    @Transactional
    override fun apagar(cardId: Long, id: Long) {
        val recursoEstudo = repository.findById(id).orElseThrow {
            IllegalArgumentException("Recurso nao encontrado com id: $id")
        }

        if (recursoEstudo.cardId != cardId) {
            throw IllegalArgumentException("Recurso nao pertence ao card: $cardId")
        }

        repository.delete(recursoEstudo)
    }

    override fun buscarPorCard(cardId: Long): List<RecursoEstudoResponse> {
        val recursosEstudo = repository.findByCardId(cardId)
        return recursosEstudo.map { RecursoEstudoResponse.fromEntity(it) }
    }
}

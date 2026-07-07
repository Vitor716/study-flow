package org.example.flowstudy.studycard.application.service

import org.example.flowstudy.studycard.api.dto.RecursoEstudoRequest
import org.example.flowstudy.studycard.api.dto.RecursoEstudoResponse

interface RecursoEstudoService {
    fun criar(request: RecursoEstudoRequest): RecursoEstudoResponse
    fun atualizar(cardId: Long, id: Long, request: RecursoEstudoRequest): RecursoEstudoResponse
    fun apagar(cardId: Long, id: Long)
    fun buscarPorCard(cardId: Long): List<RecursoEstudoResponse>
}

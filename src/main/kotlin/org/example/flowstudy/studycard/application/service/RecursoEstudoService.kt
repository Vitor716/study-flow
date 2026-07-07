package org.example.flowstudy.studycard.application.service

import org.example.flowstudy.studycard.api.dto.RecursoEstudoRequest
import org.example.flowstudy.studycard.api.dto.RecursoEstudoResponse

interface RecursoEstudoService {
    fun criar(request: RecursoEstudoRequest): RecursoEstudoResponse
    fun buscarPorCard(cardId: Long): List<RecursoEstudoResponse>
}

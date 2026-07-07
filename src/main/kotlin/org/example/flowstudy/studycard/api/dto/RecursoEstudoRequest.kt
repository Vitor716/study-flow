package org.example.flowstudy.studycard.api.dto

import org.example.flowstudy.studycard.domain.model.RecursoEstudo
import org.example.flowstudy.studycard.domain.model.enums.TipoRecursoEstudo

data class RecursoEstudoRequest(
    val cardId: Long = 0,
    val tipo: TipoRecursoEstudo,
    val titulo: String,
    val url: String? = null,
    val observacoes: String? = null
)

fun RecursoEstudoRequest.toEntity(): RecursoEstudo =
    RecursoEstudo().also { recursoEstudo ->
        recursoEstudo.cardId = cardId
        recursoEstudo.tipo = tipo
        recursoEstudo.titulo = titulo
        recursoEstudo.url = url
        recursoEstudo.observacoes = observacoes
    }

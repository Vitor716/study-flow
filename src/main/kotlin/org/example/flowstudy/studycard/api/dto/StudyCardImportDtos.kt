package org.example.flowstudy.studycard.api.dto

import org.example.flowstudy.studycard.domain.model.enums.Estagio
import org.example.flowstudy.studycard.domain.model.enums.Prioridade
import org.example.flowstudy.studycard.domain.model.enums.TipoRecursoEstudo

data class StudyCardImportRequest(
    val cards: List<StudyCardImportCardRequest> = emptyList()
)

data class StudyCardImportError(
    val index: Int,
    val field: String,
    val message: String
)

data class StudyCardImportResponse(
    val requestedCount: Int,
    val createdCount: Int,
    val resourcesCreatedCount: Int,
    val errorCount: Int,
    val cards: List<StudyCardResponse>,
    val errors: List<StudyCardImportError>
)

data class StudyCardImportCardRequest(
    val titulo: String,
    val descricao: String? = null,
    val contexto: String,
    val prioridade: Prioridade = Prioridade.MEDIA,
    val estagio: Estagio = Estagio.TRIAGEM,
    val orderIndex: Int = 0,
    val tags: List<CardTagRequest> = emptyList(),
    val recursos: List<RecursoEstudoImportRequest> = emptyList()
) {
    fun toStudyCardRequest(): StudyCardRequest =
        StudyCardRequest(
            titulo = titulo,
            descricao = descricao,
            contexto = contexto,
            prioridade = prioridade,
            estagio = estagio,
            orderIndex = orderIndex,
            tags = tags
        )
}

data class RecursoEstudoImportRequest(
    val tipo: TipoRecursoEstudo = TipoRecursoEstudo.OUTRO,
    val titulo: String,
    val url: String? = null,
    val observacoes: String? = null
)

data class StudyCardBatchDeleteRequest(
    val ids: List<Long> = emptyList()
)

data class StudyCardBatchDeleteResponse(
    val requestedCount: Int,
    val deletedCount: Int,
    val notFoundIds: List<Long>
)

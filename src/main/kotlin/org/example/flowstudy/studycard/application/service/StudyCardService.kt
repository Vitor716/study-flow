package org.example.flowstudy.studycard.application.service

import org.example.flowstudy.studycard.api.dto.*

interface StudyCardService {
    fun criar(request: StudyCardRequest): StudyCardResponse
    fun importar(request: StudyCardImportRequest): StudyCardImportResponse
    fun atualizar(id: Long, request: StudyCardRequest): StudyCardResponse
    fun buscar(): List<StudyCardResponse>
    fun apagar(id: Long)
    fun apagarEmLote(request: StudyCardBatchDeleteRequest): StudyCardBatchDeleteResponse
}

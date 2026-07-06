package org.example.flowstudy.studycard.application.service

import org.example.flowstudy.studycard.api.dto.StudyCardRequest
import org.example.flowstudy.studycard.api.dto.StudyCardResponse

interface StudyCardService {
    fun criar(request: StudyCardRequest): StudyCardResponse
    fun buscar(): List<StudyCardResponse>
}
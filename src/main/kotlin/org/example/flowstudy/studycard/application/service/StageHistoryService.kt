package org.example.flowstudy.studycard.application.service

import org.example.flowstudy.studycard.api.dto.StageHistoryRequest
import org.example.flowstudy.studycard.api.dto.StageHistoryResponse

interface StageHistoryService {
    fun criar(request: StageHistoryRequest): StageHistoryResponse
}
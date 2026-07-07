package org.example.flowstudy.studycard.api.dto

import org.example.flowstudy.studycard.domain.model.StageHistory
import org.example.flowstudy.studycard.domain.model.enums.Estagio

data class StageHistoryRequest (
    val cardId: Long,
    val fromEstage: Estagio,
    val toEstage: Estagio,
    val razao: String
)

fun StageHistoryRequest.toEntity(): StageHistory =
    StageHistory().also { stageHistory ->
        stageHistory.cardId = cardId
        stageHistory.fromEstage = fromEstage
        stageHistory.toEstage = toEstage
        stageHistory.razao = razao
    }

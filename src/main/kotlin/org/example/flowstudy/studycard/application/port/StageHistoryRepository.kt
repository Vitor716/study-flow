package org.example.flowstudy.studycard.application.port

import org.example.flowstudy.studycard.domain.model.StageHistory
import org.example.flowstudy.studycard.infrastructure.persistence.JpaStageHistoryRepository

interface StageHistoryRepository : JpaStageHistoryRepository{
    override fun findByCardId(studyCardId: Long): StageHistory?
}
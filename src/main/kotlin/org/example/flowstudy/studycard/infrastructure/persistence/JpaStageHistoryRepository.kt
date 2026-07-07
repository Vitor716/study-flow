package org.example.flowstudy.studycard.infrastructure.persistence

import org.example.flowstudy.studycard.domain.model.StageHistory
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface JpaStageHistoryRepository : JpaRepository<StageHistory, Long>{
    fun findByCardId(studyCardId: Long): StageHistory?
    fun deleteByCardId(studyCardId: Long)
}

package org.example.flowstudy.studycard.infrastructure.persistence

import org.example.flowstudy.studycard.domain.model.EvidenciaAtiva
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface JpaEvidenciaAtivaRepository : JpaRepository<EvidenciaAtiva, Long> {
    fun findByCardId(cardId: Long): List<EvidenciaAtiva>
}

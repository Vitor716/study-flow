package org.example.flowstudy.studycard.application.port

import org.example.flowstudy.studycard.domain.model.EvidenciaAtiva
import org.example.flowstudy.studycard.infrastructure.persistence.JpaEvidenciaAtivaRepository

interface EvidenciaAtivaRepository : JpaEvidenciaAtivaRepository {
    override fun findByCardId(cardId: Long): List<EvidenciaAtiva>
    override fun deleteByCardId(cardId: Long)
}

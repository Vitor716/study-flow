package org.example.flowstudy.studycard.application.port

import org.example.flowstudy.studycard.domain.model.RecursoEstudo
import org.example.flowstudy.studycard.infrastructure.persistence.JpaRecursoEstudoRepository

interface RecursoEstudoRepository : JpaRecursoEstudoRepository {
    override fun findByCardId(cardId: Long): List<RecursoEstudo>
}

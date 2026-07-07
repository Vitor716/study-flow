package org.example.flowstudy.studycard.infrastructure.persistence

import org.example.flowstudy.studycard.domain.model.RecursoEstudo
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface JpaRecursoEstudoRepository : JpaRepository<RecursoEstudo, Long> {
    fun findByCardId(cardId: Long): List<RecursoEstudo>
}

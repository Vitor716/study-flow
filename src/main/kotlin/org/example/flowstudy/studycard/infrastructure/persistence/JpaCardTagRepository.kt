package org.example.flowstudy.studycard.infrastructure.persistence

import org.example.flowstudy.studycard.domain.model.CardTag
import org.springframework.data.jpa.repository.JpaRepository

interface JpaCardTagRepository : JpaRepository<CardTag, Long> {
}
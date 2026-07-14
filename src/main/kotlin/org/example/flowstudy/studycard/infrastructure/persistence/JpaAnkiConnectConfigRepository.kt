package org.example.flowstudy.studycard.infrastructure.persistence

import org.example.flowstudy.studycard.domain.model.AnkiConnectConfig
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface JpaAnkiConnectConfigRepository : JpaRepository<AnkiConnectConfig, Long>

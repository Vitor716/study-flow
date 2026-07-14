package org.example.flowstudy.studycard.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "anki_connect_config")
class AnkiConnectConfig {
    @Id
    @Column(columnDefinition = "INTEGER")
    var id: Long = 1

    @Column(name = "deck_name")
    var deckName: String = "Study Flow"

    @Column(name = "model_name")
    var modelName: String = "Basic"

    @Column(name = "mature_threshold_days", columnDefinition = "INTEGER")
    var matureThresholdDays: Int = 21

    @Column(name = "auto_absorb_mature", columnDefinition = "INTEGER")
    var autoAbsorbMature: Boolean = false

    @Column(name = "daily_review_limit", columnDefinition = "INTEGER")
    var dailyReviewLimit: Int = 8

    @Column(name = "created_at")
    var createdAt: LocalDateTime = LocalDateTime.now()

    @Column(name = "updated_at")
    var updatedAt: LocalDateTime = LocalDateTime.now()

    @PrePersist
    fun prePersist() {
        val now = LocalDateTime.now()
        createdAt = now
        updatedAt = now
    }

    @PreUpdate
    fun preUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

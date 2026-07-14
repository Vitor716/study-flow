package org.example.flowstudy.studycard.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "anki_notes")
class AnkiNote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INTEGER")
    var id: Long? = null

    @Column(name = "card_id", columnDefinition = "INTEGER")
    var cardId: Long? = null

    @Column(name = "note_id", columnDefinition = "INTEGER")
    var noteId: Long = 0

    @Column(name = "card_ids")
    var cardIds: String? = null

    @Column(name = "deck_name")
    var deckName: String = ""

    @Column(name = "model_name")
    var modelName: String = ""

    var front: String = ""

    var back: String = ""

    @Column(name = "last_known_interval_days", columnDefinition = "INTEGER")
    var lastKnownIntervalDays: Int? = null

    @Column(columnDefinition = "INTEGER")
    var mature: Boolean = false

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

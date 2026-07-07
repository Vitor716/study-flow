package org.example.flowstudy.studycard.domain.model

import jakarta.persistence.*
import org.example.flowstudy.studycard.domain.model.enums.Estagio
import java.time.LocalDateTime

@Entity
@Table(name = "stage_history")
class StageHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INTEGER")
    var id: Long? = null

    @Column(name = "card_id", columnDefinition = "INTEGER")
    var cardId: Long? = null

    @Column(name = "from_stage")
    @Enumerated(EnumType.STRING)
    var fromEstage: Estagio = Estagio.GATILHO

    @Column(name = "to_stage")
    @Enumerated(EnumType.STRING)
    var toEstage: Estagio = Estagio.GATILHO

    var razao: String = ""

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

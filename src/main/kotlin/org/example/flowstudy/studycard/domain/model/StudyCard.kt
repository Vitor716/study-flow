package org.example.flowstudy.studycard.domain.model

import jakarta.persistence.*
import org.example.flowstudy.studycard.domain.model.enums.Estagio
import org.example.flowstudy.studycard.domain.model.enums.Prioridade
import java.time.LocalDateTime

@Entity
@Table(name = "study_cards")
class StudyCard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INTEGER")
    var id: Long? = null

    var titulo: String = ""

    var descricao: String? = null

    var contexto: String = ""

    @Enumerated(EnumType.STRING)
    var prioridade: Prioridade = Prioridade.MEDIA

    @Enumerated(EnumType.STRING)
    var estagio: Estagio = Estagio.TRIAGEM

    @Column(name = "order_index")
    var orderIndex: Int = 0

    @Column(name = "obsidian_path")
    var obsidianPath: String? = null

    @Column(name = "obsidian_note_created_at")
    var obsidianNoteCreatedAt: LocalDateTime? = null

    @Column(name = "obsidian_last_opened_at")
    var obsidianLastOpenedAt: LocalDateTime? = null

    @Column(name = "created_at")
    var createdAt: LocalDateTime = LocalDateTime.now()

    @Column(name = "updated_at")
    var updatedAt: LocalDateTime = LocalDateTime.now()

    @OneToMany(mappedBy = "card", cascade = [CascadeType.ALL], orphanRemoval = true)
    var tags: MutableList<CardTag> = mutableListOf()

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

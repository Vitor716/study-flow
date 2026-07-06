package org.example.flowstudy.studycard.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.PrePersist
import jakarta.persistence.Table
import org.example.flowstudy.studycard.domain.model.enums.CategoriaTag
import java.time.LocalDateTime

@Entity
@Table(name = "card_tags")
class CardTag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INTEGER")
    var id: Long? = null

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    lateinit var card: StudyCard

    @Enumerated(EnumType.STRING)
    var categoria: CategoriaTag = CategoriaTag.TIPO

    var valor: String = ""

    @Column(name = "created_at")
    var createdAt: LocalDateTime = LocalDateTime.now()

    @PrePersist
    fun prePersist() {
        createdAt = LocalDateTime.now()
    }
}

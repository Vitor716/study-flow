package org.example.flowstudy.studycard.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import org.example.flowstudy.studycard.domain.model.enums.TipoEvidenciaAtiva
import java.time.LocalDateTime

@Entity
@Table(name = "evidencias_ativas")
class EvidenciaAtiva {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "INTEGER")
    var id: Long? = null

    @Column(name = "card_id", columnDefinition = "INTEGER")
    var cardId: Long? = null

    @Enumerated(EnumType.STRING)
    var tipo: TipoEvidenciaAtiva = TipoEvidenciaAtiva.TEXTO

    var titulo: String = ""

    var conteudo: String = ""

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

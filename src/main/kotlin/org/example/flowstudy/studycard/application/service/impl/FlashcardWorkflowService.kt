package org.example.flowstudy.studycard.application.service.impl

import org.example.flowstudy.studycard.api.dto.FlashcardQualityChecklistItemResponse
import org.example.flowstudy.studycard.api.dto.FlashcardQualityChecklistRequest
import org.example.flowstudy.studycard.api.dto.FlashcardQualityChecklistResponse
import org.example.flowstudy.studycard.api.dto.ManualFlashcardsRequest
import org.example.flowstudy.studycard.api.dto.ReviewActionResponse
import org.example.flowstudy.studycard.api.dto.ReviewQueueResponse
import org.example.flowstudy.studycard.api.dto.StudyCardResponse
import org.example.flowstudy.studycard.application.port.AnkiConnectConfigRepository
import org.example.flowstudy.studycard.application.port.FlashcardQualityChecklistRepository
import org.example.flowstudy.studycard.application.port.StudyCardRepository
import org.example.flowstudy.studycard.domain.model.AnkiConnectConfig
import org.example.flowstudy.studycard.domain.model.FlashcardQualityChecklistItem
import org.example.flowstudy.studycard.domain.model.enums.Estagio
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime

private val QUALITY_ITEMS = listOf(
    "tradeoff" to "Pelo menos um flashcard sobre trade-off.",
    "erro_comum" to "Pelo menos um flashcard sobre erro comum.",
    "quando_nao_usar" to "Pelo menos um flashcard sobre quando nao usar.",
    "sem_consulta" to "Pelo menos uma pergunta respondida sem consultar a nota.",
    "transferencia" to "Pelo menos uma evidencia de transferencia para outro contexto."
)

@Service
class FlashcardWorkflowService(
    private val studyCardRepository: StudyCardRepository,
    private val checklistRepository: FlashcardQualityChecklistRepository,
    private val ankiConfigRepository: AnkiConnectConfigRepository
) {

    @Transactional
    fun registrarFlashcards(cardId: Long, request: ManualFlashcardsRequest): StudyCardResponse {
        require(request.quantidade > 0) { "Informe uma quantidade maior que zero." }
        val card = studyCardRepository.findById(cardId).orElseThrow {
            IllegalArgumentException("Study card nao encontrado com id: $cardId")
        }

        card.manualFlashcardsCount = request.quantidade
        card.manualFlashcardsCreatedAt = request.dataCriacao
        card.manualFlashcardsRegisteredAt = LocalDateTime.now()
        card.estagio = Estagio.CONSOLIDACAO
        if (card.nextReviewAt == null) {
            card.nextReviewAt = LocalDate.now().plusDays(card.reviewIntervalDays.toLong())
        }

        return StudyCardResponse.fromEntity(studyCardRepository.save(card))
    }

    @Transactional
    fun buscarChecklist(cardId: Long): FlashcardQualityChecklistResponse {
        ensureCardExists(cardId)
        val savedItems = checklistRepository.findByCardId(cardId).associateBy { it.itemKey }
        val items = QUALITY_ITEMS.map { (key, label) ->
            val entity = savedItems[key] ?: checklistRepository.save(FlashcardQualityChecklistItem().also {
                it.cardId = cardId
                it.itemKey = key
                it.checked = false
            })
            FlashcardQualityChecklistItemResponse.fromEntity(entity, label)
        }
        return buildChecklistResponse(items)
    }

    @Transactional
    fun salvarChecklist(cardId: Long, request: FlashcardQualityChecklistRequest): FlashcardQualityChecklistResponse {
        ensureCardExists(cardId)
        val allowedKeys = QUALITY_ITEMS.map { it.first }.toSet()
        val updates = request.items
            .filter { it.key in allowedKeys }
            .associateBy { it.key }
        val savedItems = checklistRepository.findByCardId(cardId).associateBy { it.itemKey }.toMutableMap()

        QUALITY_ITEMS.forEach { (key, _) ->
            val entity = savedItems[key] ?: FlashcardQualityChecklistItem().also {
                it.cardId = cardId
                it.itemKey = key
            }
            entity.checked = updates[key]?.checked ?: entity.checked
            savedItems[key] = checklistRepository.save(entity)
        }

        return buscarChecklist(cardId)
    }

    fun buscarRevisoes(): ReviewQueueResponse {
        val config = ankiConfigRepository.findById(1).orElseGet { ankiConfigRepository.save(AnkiConnectConfig()) }
        val today = LocalDate.now()
        val dueCards = studyCardRepository.findAll()
            .filter { it.estagio == Estagio.CONSOLIDACAO && it.nextReviewAt != null && !it.nextReviewAt!!.isAfter(today) }
            .sortedWith(compareBy({ it.nextReviewAt }, { it.prioridade.name }, { it.updatedAt }))
        val suggested = dueCards.take(config.dailyReviewLimit).map(StudyCardResponse::fromEntity)
        val overflow = dueCards.drop(config.dailyReviewLimit).map(StudyCardResponse::fromEntity)
        return ReviewQueueResponse(suggested = suggested, overflow = overflow, dailyLimit = config.dailyReviewLimit)
    }

    @Transactional
    fun revisar(cardId: Long): ReviewActionResponse {
        val card = studyCardRepository.findById(cardId).orElseThrow {
            IllegalArgumentException("Study card nao encontrado com id: $cardId")
        }
        card.lastReviewedAt = LocalDateTime.now()
        card.reviewIntervalDays = (card.reviewIntervalDays * 2).coerceIn(3, 60)
        card.nextReviewAt = LocalDate.now().plusDays(card.reviewIntervalDays.toLong())
        return ReviewActionResponse(StudyCardResponse.fromEntity(studyCardRepository.save(card)), "Revisao registrada.")
    }

    @Transactional
    fun pular(cardId: Long): ReviewActionResponse {
        val card = studyCardRepository.findById(cardId).orElseThrow {
            IllegalArgumentException("Study card nao encontrado com id: $cardId")
        }
        card.reviewSkippedAt = LocalDateTime.now()
        card.reviewIntervalDays = (card.reviewIntervalDays + 2).coerceIn(3, 60)
        card.nextReviewAt = LocalDate.now().plusDays(card.reviewIntervalDays.toLong())
        return ReviewActionResponse(StudyCardResponse.fromEntity(studyCardRepository.save(card)), "Revisao pulada conscientemente.")
    }

    private fun ensureCardExists(cardId: Long) {
        if (!studyCardRepository.existsById(cardId)) {
            throw IllegalArgumentException("Study card nao encontrado com id: $cardId")
        }
    }

    private fun buildChecklistResponse(items: List<FlashcardQualityChecklistItemResponse>): FlashcardQualityChecklistResponse {
        val checkedCount = items.count { it.checked }
        return FlashcardQualityChecklistResponse(
            items = items,
            checkedCount = checkedCount,
            totalCount = items.size,
            complete = checkedCount == items.size
        )
    }
}

package org.example.flowstudy.studycard.application.service.impl

import org.example.flowstudy.studycard.api.dto.*
import org.example.flowstudy.studycard.application.port.*
import org.example.flowstudy.studycard.application.service.StudyCardService
import org.example.flowstudy.studycard.domain.model.RecursoEstudo
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class StudyCardService (
    private val repository : StudyCardRepository,
    private val recursoEstudoRepository: RecursoEstudoRepository,
    private val evidenciaAtivaRepository: EvidenciaAtivaRepository,
    private val stageHistoryRepository: StageHistoryRepository,
    private val flashcardQualityChecklistRepository: FlashcardQualityChecklistRepository,
    private val ankiNoteRepository: AnkiNoteRepository
) : StudyCardService {


    override fun criar(request: StudyCardRequest): StudyCardResponse {
        val studyCard = repository.save(request.withDistinctTags().toEntity())
        return StudyCardResponse.fromEntity(studyCard)
    }

    @Transactional
    override fun importar(request: StudyCardImportRequest): StudyCardImportResponse {
        val errors = request.cards.flatMapIndexed { index, card -> validateImportCard(index, card) }
        val validIndexes = request.cards.indices.toSet() - errors.map { it.index }.toSet()
        var resourcesCreatedCount = 0
        val createdCards = request.cards
            .filterIndexed { index, _ -> index in validIndexes }
            .map { importCard ->
                val savedCard = repository.save(importCard.toStudyCardRequest().withDistinctTags().toEntity())
                importCard.recursos
                    .map { it.toEntity(savedCard.id ?: 0) }
                    .forEach {
                        recursoEstudoRepository.save(it)
                        resourcesCreatedCount++
                    }
                savedCard
            }
            .map(StudyCardResponse::fromEntity)

        return StudyCardImportResponse(
            requestedCount = request.cards.size,
            createdCount = createdCards.size,
            resourcesCreatedCount = resourcesCreatedCount,
            errorCount = errors.size,
            cards = createdCards,
            errors = errors
        )
    }

    override fun atualizar(id: Long, request: StudyCardRequest): StudyCardResponse {
        val studyCard = repository.findById(id).orElseThrow {
            IllegalArgumentException("Study card nao encontrado com id: $id")
        }

        studyCard.titulo = request.titulo
        studyCard.descricao = request.descricao
        studyCard.contexto = request.contexto
        studyCard.prioridade = request.prioridade
        studyCard.estagio = request.estagio
        studyCard.orderIndex = request.orderIndex
        val normalizedRequest = request.withDistinctTags()
        studyCard.tags.clear()
        studyCard.tags.addAll(normalizedRequest.tags.map { it.toEntity(studyCard) })

        return StudyCardResponse.fromEntity(repository.save(studyCard))
    }

    override fun buscar(): List<StudyCardResponse> {
        val studyCard = repository.findAll()
        return studyCard.map { StudyCardResponse.fromEntity(it) }
    }

    @Transactional
    override fun apagar(id: Long) {
        if (!repository.existsById(id)) {
            throw IllegalArgumentException("Study card nao encontrado com id: $id")
        }

        deleteCardWithDependencies(id)
    }

    @Transactional
    override fun apagarEmLote(request: StudyCardBatchDeleteRequest): StudyCardBatchDeleteResponse {
        val ids = request.ids.distinct()
        val existingIds = ids.filter { repository.existsById(it) }
        val notFoundIds = ids - existingIds.toSet()

        existingIds.forEach(::deleteCardWithDependencies)

        return StudyCardBatchDeleteResponse(
            requestedCount = ids.size,
            deletedCount = existingIds.size,
            notFoundIds = notFoundIds
        )
    }

    private fun deleteCardWithDependencies(id: Long) {
        evidenciaAtivaRepository.deleteByCardId(id)
        recursoEstudoRepository.deleteByCardId(id)
        stageHistoryRepository.deleteByCardId(id)
        flashcardQualityChecklistRepository.deleteByCardId(id)
        ankiNoteRepository.deleteByCardId(id)
        repository.deleteById(id)
    }

    private fun validateImportCard(index: Int, card: StudyCardImportCardRequest): List<StudyCardImportError> {
        val errors = mutableListOf<StudyCardImportError>()

        if (card.titulo.isBlank()) {
            errors.add(StudyCardImportError(index, "titulo", "Informe um titulo."))
        }

        if (card.contexto.isBlank()) {
            errors.add(StudyCardImportError(index, "contexto", "Informe um contexto."))
        }

        card.tags.forEachIndexed { tagIndex, tag ->
            if (tag.valor.isBlank()) {
                errors.add(StudyCardImportError(index, "tags[$tagIndex].valor", "Informe o valor da tag."))
            }
        }

        card.recursos.forEachIndexed { resourceIndex, resource ->
            if (resource.titulo.isBlank()) {
                errors.add(StudyCardImportError(index, "recursos[$resourceIndex].titulo", "Informe o titulo do recurso."))
            }
        }

        return errors
    }

    private fun StudyCardRequest.withDistinctTags(): StudyCardRequest =
        copy(tags = tags.distinctBy { "${it.categoria}:${it.valor.trim().lowercase()}" })

    private fun org.example.flowstudy.studycard.api.dto.RecursoEstudoImportRequest.toEntity(cardId: Long): RecursoEstudo =
        RecursoEstudo().also { resource ->
            resource.cardId = cardId
            resource.tipo = tipo
            resource.titulo = titulo
            resource.url = url
            resource.observacoes = observacoes
        }
}

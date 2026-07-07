package org.example.flowstudy.studycard.application.service.impl

import jakarta.transaction.Transactional
import org.example.flowstudy.studycard.api.dto.StageHistoryRequest
import org.example.flowstudy.studycard.api.dto.StageHistoryResponse
import org.example.flowstudy.studycard.api.dto.toEntity
import org.example.flowstudy.studycard.application.port.StageHistoryRepository
import org.example.flowstudy.studycard.application.port.StudyCardRepository
import org.example.flowstudy.studycard.application.service.StageHistoryService
import org.springframework.stereotype.Service
import java.time.LocalDateTime

@Service
class StageHistoryServiceImpl (
    private val repository: StageHistoryRepository,
    private val studyCardRepository: StudyCardRepository
): StageHistoryService {

    @Transactional
    override fun criar(request: StageHistoryRequest): StageHistoryResponse {
        atualizarStudyCard(request)

        val stageHistory = repository.findByCardId(request.cardId) ?: request.toEntity()

        stageHistory.toEstage = request.toEstage
        stageHistory.updatedAt = LocalDateTime.now()

        val salvo = repository.save(stageHistory)
        return StageHistoryResponse.fromEntity(salvo)
    }

    fun atualizarStudyCard(request: StageHistoryRequest) {
        val studyCard = studyCardRepository.findById(request.cardId).orElseThrow {
            throw IllegalArgumentException("Study card não encontrado com id: ${request.cardId}")
        }

        studyCard.estagio = request.toEstage
    }
}
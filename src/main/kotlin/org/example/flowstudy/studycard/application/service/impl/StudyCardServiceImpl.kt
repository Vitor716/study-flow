package org.example.flowstudy.studycard.application.service.impl

import org.example.flowstudy.studycard.api.dto.StudyCardRequest
import org.example.flowstudy.studycard.api.dto.StudyCardResponse
import org.example.flowstudy.studycard.api.dto.toEntity
import org.example.flowstudy.studycard.application.port.EvidenciaAtivaRepository
import org.example.flowstudy.studycard.application.port.RecursoEstudoRepository
import org.example.flowstudy.studycard.application.port.StageHistoryRepository
import org.example.flowstudy.studycard.application.port.StudyCardRepository
import org.example.flowstudy.studycard.application.service.StudyCardService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class StudyCardService (
    private val repository : StudyCardRepository,
    private val recursoEstudoRepository: RecursoEstudoRepository,
    private val evidenciaAtivaRepository: EvidenciaAtivaRepository,
    private val stageHistoryRepository: StageHistoryRepository
) : StudyCardService {


    override fun criar(request: StudyCardRequest): StudyCardResponse {
        val studyCard = repository.save(request.toEntity())
        return StudyCardResponse.fromEntity(studyCard)
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
        studyCard.tags.clear()
        studyCard.tags.addAll(request.tags.map { it.toEntity(studyCard) })

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

        evidenciaAtivaRepository.deleteByCardId(id)
        recursoEstudoRepository.deleteByCardId(id)
        stageHistoryRepository.deleteByCardId(id)
        repository.deleteById(id)
    }
}

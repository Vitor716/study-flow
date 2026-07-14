package org.example.flowstudy.studycard.api.controller

import org.example.flowstudy.studycard.api.dto.AnkiConnectConfigRequest
import org.example.flowstudy.studycard.api.dto.AnkiConnectConfigResponse
import org.example.flowstudy.studycard.api.dto.AnkiConnectStatusResponse
import org.example.flowstudy.studycard.api.dto.AnkiNoteRequest
import org.example.flowstudy.studycard.api.dto.AnkiNoteResponse
import org.example.flowstudy.studycard.api.dto.FlashcardQualityChecklistRequest
import org.example.flowstudy.studycard.api.dto.FlashcardQualityChecklistResponse
import org.example.flowstudy.studycard.api.dto.ManualFlashcardsRequest
import org.example.flowstudy.studycard.api.dto.ReviewActionResponse
import org.example.flowstudy.studycard.api.dto.ReviewQueueResponse
import org.example.flowstudy.studycard.api.dto.StudyCardResponse
import org.example.flowstudy.studycard.application.service.impl.AnkiConnectService
import org.example.flowstudy.studycard.application.service.impl.FlashcardWorkflowService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/cards/{cardId}")
class CardMvp2Controller(
    private val flashcardWorkflowService: FlashcardWorkflowService,
    private val ankiConnectService: AnkiConnectService
) {
    @PutMapping("/manual-flashcards")
    fun registrarFlashcards(
        @PathVariable cardId: Long,
        @RequestBody request: ManualFlashcardsRequest
    ): ResponseEntity<StudyCardResponse> =
        ResponseEntity.ok(flashcardWorkflowService.registrarFlashcards(cardId, request))

    @GetMapping("/consolidation-checklist")
    fun buscarChecklist(@PathVariable cardId: Long): ResponseEntity<FlashcardQualityChecklistResponse> =
        ResponseEntity.ok(flashcardWorkflowService.buscarChecklist(cardId))

    @PutMapping("/consolidation-checklist")
    fun salvarChecklist(
        @PathVariable cardId: Long,
        @RequestBody request: FlashcardQualityChecklistRequest
    ): ResponseEntity<FlashcardQualityChecklistResponse> =
        ResponseEntity.ok(flashcardWorkflowService.salvarChecklist(cardId, request))

    @PostMapping("/review/done")
    fun revisar(@PathVariable cardId: Long): ResponseEntity<ReviewActionResponse> =
        ResponseEntity.ok(flashcardWorkflowService.revisar(cardId))

    @PostMapping("/review/skip")
    fun pular(@PathVariable cardId: Long): ResponseEntity<ReviewActionResponse> =
        ResponseEntity.ok(flashcardWorkflowService.pular(cardId))

    @PostMapping("/anki-notes")
    fun criarNotaAnki(
        @PathVariable cardId: Long,
        @RequestBody request: AnkiNoteRequest
    ): ResponseEntity<AnkiNoteResponse> =
        ResponseEntity.ok(ankiConnectService.criarNota(cardId, request))

    @GetMapping("/anki-notes")
    fun listarNotasAnki(@PathVariable cardId: Long): ResponseEntity<List<AnkiNoteResponse>> =
        ResponseEntity.ok(ankiConnectService.listarNotas(cardId))

    @PostMapping("/anki-notes/sync-mature")
    fun sincronizarMature(@PathVariable cardId: Long): ResponseEntity<List<AnkiNoteResponse>> =
        ResponseEntity.ok(ankiConnectService.sincronizarMature(cardId))
}

@RestController
@RequestMapping("/api/anki")
class AnkiConnectController(
    private val ankiConnectService: AnkiConnectService
) {
    @GetMapping("/config")
    fun buscarConfig(): ResponseEntity<AnkiConnectConfigResponse> =
        ResponseEntity.ok(ankiConnectService.buscarConfig())

    @PutMapping("/config")
    fun salvarConfig(@RequestBody request: AnkiConnectConfigRequest): ResponseEntity<AnkiConnectConfigResponse> =
        ResponseEntity.ok(ankiConnectService.salvarConfig(request))

    @GetMapping("/status")
    fun verificarStatus(): ResponseEntity<AnkiConnectStatusResponse> =
        ResponseEntity.ok(ankiConnectService.verificarStatus())
}

@RestController
@RequestMapping("/api/reviews")
class ReviewController(
    private val flashcardWorkflowService: FlashcardWorkflowService
) {
    @GetMapping("/suggestions")
    fun buscarSugestoes(): ResponseEntity<ReviewQueueResponse> =
        ResponseEntity.ok(flashcardWorkflowService.buscarRevisoes())
}

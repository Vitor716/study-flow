package org.example.flowstudy.studycard.api.controller

import org.example.flowstudy.studycard.api.dto.*
import org.example.flowstudy.studycard.application.service.impl.AnkiConnectService
import org.example.flowstudy.studycard.application.service.impl.FlashcardWorkflowService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

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

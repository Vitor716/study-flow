package org.example.flowstudy.studycard.api.controller

import org.example.flowstudy.studycard.api.dto.ReviewQueueResponse
import org.example.flowstudy.studycard.application.service.impl.FlashcardWorkflowService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/reviews")
class ReviewController(
    private val flashcardWorkflowService: FlashcardWorkflowService
) {
    @GetMapping("/suggestions")
    fun buscarSugestoes(): ResponseEntity<ReviewQueueResponse> =
        ResponseEntity.ok(flashcardWorkflowService.buscarRevisoes())
}
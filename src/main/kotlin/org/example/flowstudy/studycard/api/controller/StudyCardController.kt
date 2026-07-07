package org.example.flowstudy.studycard.api.controller

import jakarta.validation.Valid
import org.example.flowstudy.studycard.api.dto.StudyCardRequest
import org.example.flowstudy.studycard.api.dto.StudyCardResponse
import org.example.flowstudy.studycard.application.service.StudyCardService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/study-card")
class StudyCardController (
    private val studyCardService: StudyCardService
) {

    @PostMapping
    fun criar(
        @Valid
        @RequestBody request: StudyCardRequest
    ): ResponseEntity<StudyCardResponse> = ResponseEntity.ok(studyCardService.criar(request))

    @PutMapping("/{id}")
    fun atualizar(
        @PathVariable id: Long,
        @Valid
        @RequestBody request: StudyCardRequest
    ): ResponseEntity<StudyCardResponse> = ResponseEntity.ok(studyCardService.atualizar(id, request))

    @GetMapping
    fun listar(): ResponseEntity<List<StudyCardResponse>> {
        return ResponseEntity.ok(studyCardService.buscar())
    }
}

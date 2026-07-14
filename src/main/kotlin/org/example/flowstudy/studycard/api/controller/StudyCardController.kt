package org.example.flowstudy.studycard.api.controller

import jakarta.validation.Valid
import org.example.flowstudy.studycard.api.dto.*
import org.example.flowstudy.studycard.application.service.StudyCardService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

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

    @PostMapping("/import")
    fun importar(
        @RequestBody request: StudyCardImportRequest
    ): ResponseEntity<StudyCardImportResponse> = ResponseEntity.ok(studyCardService.importar(request))

    @PostMapping("/delete-batch")
    fun apagarEmLote(
        @RequestBody request: StudyCardBatchDeleteRequest
    ): ResponseEntity<StudyCardBatchDeleteResponse> = ResponseEntity.ok(studyCardService.apagarEmLote(request))

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

    @DeleteMapping("/{id}")
    fun apagar(@PathVariable id: Long): ResponseEntity<Void> {
        studyCardService.apagar(id)
        return ResponseEntity.noContent().build()
    }
}

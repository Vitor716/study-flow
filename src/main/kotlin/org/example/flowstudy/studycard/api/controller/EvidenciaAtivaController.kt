package org.example.flowstudy.studycard.api.controller

import jakarta.validation.Valid
import org.example.flowstudy.studycard.api.dto.EvidenciaAtivaRequest
import org.example.flowstudy.studycard.api.dto.EvidenciaAtivaResponse
import org.example.flowstudy.studycard.application.service.EvidenciaAtivaService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/cards/{cardId}/evidence")
class EvidenciaAtivaController(
    private val evidenciaAtivaService: EvidenciaAtivaService
) {

    @PostMapping
    fun criar(
        @PathVariable cardId: Long,
        @Valid
        @RequestBody request: EvidenciaAtivaRequest
    ): ResponseEntity<EvidenciaAtivaResponse> =
        ResponseEntity.ok(evidenciaAtivaService.criar(request.copy(cardId = cardId)))

    @GetMapping
    fun listar(@PathVariable cardId: Long): ResponseEntity<List<EvidenciaAtivaResponse>> =
        ResponseEntity.ok(evidenciaAtivaService.buscarPorCard(cardId))

    @PutMapping("/{id}")
    fun atualizar(
        @PathVariable cardId: Long,
        @PathVariable id: Long,
        @Valid
        @RequestBody request: EvidenciaAtivaRequest
    ): ResponseEntity<EvidenciaAtivaResponse> =
        ResponseEntity.ok(evidenciaAtivaService.atualizar(cardId, id, request.copy(cardId = cardId)))

    @DeleteMapping("/{id}")
    fun apagar(
        @PathVariable cardId: Long,
        @PathVariable id: Long
    ): ResponseEntity<Void> {
        evidenciaAtivaService.apagar(cardId, id)
        return ResponseEntity.noContent().build()
    }
}

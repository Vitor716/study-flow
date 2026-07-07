package org.example.flowstudy.studycard.api.controller

import jakarta.validation.Valid
import org.example.flowstudy.studycard.api.dto.RecursoEstudoRequest
import org.example.flowstudy.studycard.api.dto.RecursoEstudoResponse
import org.example.flowstudy.studycard.application.service.RecursoEstudoService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/cards/{cardId}/resources")
class RecursoEstudoController(
    private val recursoEstudoService: RecursoEstudoService
) {

    @PostMapping
    fun criar(
        @PathVariable cardId: Long,
        @Valid
        @RequestBody request: RecursoEstudoRequest
    ): ResponseEntity<RecursoEstudoResponse> =
        ResponseEntity.ok(recursoEstudoService.criar(request.copy(cardId = cardId)))

    @GetMapping
    fun listar(@PathVariable cardId: Long): ResponseEntity<List<RecursoEstudoResponse>> =
        ResponseEntity.ok(recursoEstudoService.buscarPorCard(cardId))
}

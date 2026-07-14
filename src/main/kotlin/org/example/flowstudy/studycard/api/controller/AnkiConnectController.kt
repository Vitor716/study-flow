package org.example.flowstudy.studycard.api.controller

import org.example.flowstudy.studycard.api.dto.AnkiConnectConfigRequest
import org.example.flowstudy.studycard.api.dto.AnkiConnectConfigResponse
import org.example.flowstudy.studycard.api.dto.AnkiConnectStatusResponse
import org.example.flowstudy.studycard.application.service.impl.AnkiConnectService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

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
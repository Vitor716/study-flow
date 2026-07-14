package org.example.flowstudy.obsidian.api

import org.example.flowstudy.obsidian.application.ObsidianService
import org.example.flowstudy.obsidian.dto.ObsidianConfigRequest
import org.example.flowstudy.obsidian.dto.ObsidianConfigResponse
import org.example.flowstudy.obsidian.dto.ObsidianNoteRequest
import org.example.flowstudy.obsidian.dto.ObsidianNoteResponse
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
class ObsidianController(
    private val obsidianService: ObsidianService
) {
    @GetMapping("/api/obsidian/config")
    fun buscarConfig(): ResponseEntity<ObsidianConfigResponse> =
        ResponseEntity.ok(obsidianService.findConfig())

    @PutMapping("/api/obsidian/config")
    fun salvarConfig(@RequestBody request: ObsidianConfigRequest): ResponseEntity<ObsidianConfigResponse> =
        ResponseEntity.ok(obsidianService.saveConfig(request))

    @PostMapping("/api/cards/{cardId}/obsidian-note")
    fun criarNota(
        @PathVariable cardId: Long,
        @RequestBody request: ObsidianNoteRequest
    ): ResponseEntity<ObsidianNoteResponse> {
        val result = obsidianService.createNote(cardId, request.createAlternative)
        val status = if (result.status == "CONFLICT") HttpStatus.CONFLICT else HttpStatus.OK
        return ResponseEntity.status(status).body(result)
    }

    @PostMapping("/api/cards/{cardId}/open-obsidian")
    fun abrirNota(@PathVariable cardId: Long): ResponseEntity<ObsidianNoteResponse> =
        ResponseEntity.ok(obsidianService.openNote(cardId))
}

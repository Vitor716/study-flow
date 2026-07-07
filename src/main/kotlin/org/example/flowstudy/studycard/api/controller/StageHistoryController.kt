package org.example.flowstudy.studycard.api.controller

import jakarta.validation.Valid
import org.example.flowstudy.studycard.api.dto.StageHistoryRequest
import org.example.flowstudy.studycard.api.dto.StageHistoryResponse
import org.example.flowstudy.studycard.application.service.StageHistoryService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/stage-history")
class StageHistoryController (
    private val stageHistoryService: StageHistoryService
){
    @PostMapping
    fun criar(
        @Valid
        @RequestBody request: StageHistoryRequest
    ): ResponseEntity<StageHistoryResponse> = ResponseEntity.ok(stageHistoryService.criar(request))
}
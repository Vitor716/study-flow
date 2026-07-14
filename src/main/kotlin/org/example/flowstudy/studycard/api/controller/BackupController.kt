package org.example.flowstudy.studycard.api.controller

import org.example.flowstudy.studycard.api.dto.BackupActionResponse
import org.example.flowstudy.studycard.api.dto.BackupConfigRequest
import org.example.flowstudy.studycard.api.dto.BackupConfigResponse
import org.example.flowstudy.studycard.api.dto.ImportPreviewResponse
import org.example.flowstudy.studycard.api.dto.ImportSnapshotRequest
import org.example.flowstudy.studycard.application.service.impl.BackupWorkflowService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/backup")
class BackupController(
    private val backupWorkflowService: BackupWorkflowService
) {
    @GetMapping("/config")
    fun buscarConfig(): ResponseEntity<BackupConfigResponse> =
        ResponseEntity.ok(backupWorkflowService.buscarConfig())

    @PutMapping("/config")
    fun salvarConfig(@RequestBody request: BackupConfigRequest): ResponseEntity<BackupConfigResponse> =
        ResponseEntity.ok(backupWorkflowService.salvarConfig(request))

    @PostMapping("/export-json")
    fun exportarJson(): ResponseEntity<BackupActionResponse> =
        ResponseEntity.ok(backupWorkflowService.exportarJson())

    @PostMapping("/export-markdown")
    fun exportarMarkdown(): ResponseEntity<BackupActionResponse> =
        ResponseEntity.ok(backupWorkflowService.exportarMarkdown())

    @PostMapping("/sqlite")
    fun gerarBackupSqlite(): ResponseEntity<BackupActionResponse> =
        ResponseEntity.ok(backupWorkflowService.gerarBackupSqlite())

    @PostMapping("/commit")
    fun commitExports(): ResponseEntity<BackupActionResponse> =
        ResponseEntity.ok(backupWorkflowService.commitExports())

    @PostMapping("/push")
    fun push(): ResponseEntity<BackupActionResponse> =
        ResponseEntity.ok(backupWorkflowService.push())

    @PostMapping("/import/preview")
    fun previewImport(@RequestBody request: ImportSnapshotRequest): ResponseEntity<ImportPreviewResponse> =
        ResponseEntity.ok(backupWorkflowService.previewImport(request))

    @PostMapping("/import")
    fun importar(@RequestBody request: ImportSnapshotRequest): ResponseEntity<BackupActionResponse> =
        ResponseEntity.ok(backupWorkflowService.importar(request))
}

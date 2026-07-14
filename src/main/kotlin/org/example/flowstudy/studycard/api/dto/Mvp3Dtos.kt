package org.example.flowstudy.studycard.api.dto

data class BackupConfigRequest(
    val remoteUrl: String? = null,
    val token: String? = null
)

data class BackupConfigResponse(
    val remoteUrl: String,
    val tokenConfigured: Boolean
)

data class BackupActionResponse(
    val status: String,
    val message: String,
    val path: String? = null,
    val cardsCount: Int = 0,
    val filesCount: Int = 0,
    val commitId: String? = null
)

data class ImportPreviewResponse(
    val schemaVersion: Int,
    val cardsCount: Int,
    val existingCardsCount: Int,
    val newCardsCount: Int
)

data class ImportSnapshotRequest(
    val path: String? = null
)

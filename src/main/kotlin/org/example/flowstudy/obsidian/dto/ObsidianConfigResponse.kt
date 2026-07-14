package org.example.flowstudy.obsidian.dto

data class ObsidianConfigResponse(
    val vaultName: String,
    val vaultPath: String,
    val notesFolder: String,
    val configured: Boolean,
    val vaultPathExists: Boolean,
    val status: String
)

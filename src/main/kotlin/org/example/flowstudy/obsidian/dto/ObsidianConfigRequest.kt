package org.example.flowstudy.obsidian.dto

data class ObsidianConfigRequest(
    val vaultName: String = "",
    val vaultPath: String = "",
    val notesFolder: String = "04 - CEREBRO"
)

package org.example.flowstudy.obsidian.dto

data class ObsidianNoteResponse(
    val status: String,
    val obsidianPath: String,
    val deepLink: String,
    val message: String
)

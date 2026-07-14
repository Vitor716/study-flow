package org.example.flowstudy.studycard.application.service.impl

import org.example.flowstudy.studycard.api.dto.AnkiConnectConfigRequest
import org.example.flowstudy.studycard.api.dto.AnkiConnectConfigResponse
import org.example.flowstudy.studycard.api.dto.AnkiConnectStatusResponse
import org.example.flowstudy.studycard.api.dto.AnkiNoteRequest
import org.example.flowstudy.studycard.api.dto.AnkiNoteResponse
import org.example.flowstudy.studycard.application.port.AnkiConnectConfigRepository
import org.example.flowstudy.studycard.application.port.AnkiNoteRepository
import org.example.flowstudy.studycard.application.port.EvidenciaAtivaRepository
import org.example.flowstudy.studycard.application.port.StudyCardRepository
import org.example.flowstudy.studycard.domain.model.AnkiConnectConfig
import org.example.flowstudy.studycard.domain.model.AnkiNote
import org.example.flowstudy.studycard.domain.model.enums.Estagio
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import tools.jackson.databind.JsonNode
import tools.jackson.databind.ObjectMapper
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse

@Service
class AnkiConnectService(
    private val configRepository: AnkiConnectConfigRepository,
    private val ankiNoteRepository: AnkiNoteRepository,
    private val studyCardRepository: StudyCardRepository,
    private val evidenciaAtivaRepository: EvidenciaAtivaRepository,
    private val objectMapper: ObjectMapper
) {
    private val client = HttpClient.newBuilder().build()

    fun buscarConfig(): AnkiConnectConfigResponse =
        AnkiConnectConfigResponse.fromEntity(config())

    @Transactional
    fun salvarConfig(request: AnkiConnectConfigRequest): AnkiConnectConfigResponse {
        require(request.deckName.isNotBlank()) { "Informe o deck do Anki." }
        require(request.dailyReviewLimit > 0) { "O limite diario precisa ser maior que zero." }
        val config = config()
        config.deckName = request.deckName.trim()
        config.modelName = request.modelName.ifBlank { "Basic" }.trim()
        config.matureThresholdDays = request.matureThresholdDays.coerceAtLeast(1)
        config.autoAbsorbMature = request.autoAbsorbMature
        config.dailyReviewLimit = request.dailyReviewLimit.coerceAtLeast(1)
        return AnkiConnectConfigResponse.fromEntity(configRepository.save(config))
    }

    fun verificarStatus(): AnkiConnectStatusResponse =
        runCatching {
            val response = request("version", emptyMap())
            AnkiConnectStatusResponse(
                connected = true,
                message = "AnkiConnect conectado em localhost:8765.",
                version = response["result"]?.asText()
            )
        }.getOrElse {
            AnkiConnectStatusResponse(
                connected = false,
                message = "AnkiConnect indisponivel. Abra o Anki e confirme se o add-on AnkiConnect esta instalado."
            )
        }

    @Transactional
    fun criarNota(cardId: Long, request: AnkiNoteRequest): AnkiNoteResponse {
        val card = studyCardRepository.findById(cardId).orElseThrow {
            IllegalArgumentException("Study card nao encontrado com id: $cardId")
        }
        val config = config()
        val front = request.front.ifBlank { card.titulo }
        val back = request.back.ifBlank { card.descricao ?: card.contexto }
        val model = resolveNoteModel(config.modelName)
        val payload = mapOf(
            "note" to mapOf(
                "deckName" to config.deckName,
                "modelName" to model.name,
                "fields" to model.fields(front, back),
                "options" to mapOf("allowDuplicate" to false),
                "tags" to listOf("study-flow", card.contexto.replace(Regex("\\s+"), "-").lowercase())
            )
        )
        val response = request("addNote", payload)
        val noteId = response["result"]?.asLong() ?: throw IllegalStateException("AnkiConnect nao retornou o id da nota.")
        val cardIds: String? = runCatching {
            request("cardsOfNote", mapOf("note" to noteId))["result"]
                ?.values()
                ?.map { it.asLong() }
                ?.joinToString(",")
        }.getOrNull()
        val note = ankiNoteRepository.save(AnkiNote().also {
            it.cardId = cardId
            it.noteId = noteId
            it.cardIds = cardIds
            it.deckName = config.deckName
            it.modelName = model.name
            it.front = front
            it.back = back
        })
        return AnkiNoteResponse.fromEntity(note)
    }

    fun listarNotas(cardId: Long): List<AnkiNoteResponse> =
        ankiNoteRepository.findByCardId(cardId).map(AnkiNoteResponse::fromEntity)

    @Transactional
    fun sincronizarMature(cardId: Long): List<AnkiNoteResponse> {
        val config = config()
        val notes = ankiNoteRepository.findByCardId(cardId)
        notes.forEach { note ->
            val cardIds = note.cardIds
                ?.split(",")
                ?.mapNotNull { it.trim().toLongOrNull() }
                ?: emptyList()
            if (cardIds.isNotEmpty()) {
                val intervals: List<Int> = request("cardsInfo", mapOf("cards" to cardIds))["result"]
                    ?.values()
                    ?.mapNotNull { it["interval"]?.asInt() }
                    ?: emptyList()
                val maxInterval = intervals.maxOrNull()
                note.lastKnownIntervalDays = maxInterval
                note.mature = maxInterval != null && maxInterval >= config.matureThresholdDays
                ankiNoteRepository.save(note)
            }
        }
        maybeAutoAbsorb(cardId, config)
        return ankiNoteRepository.findByCardId(cardId).map(AnkiNoteResponse::fromEntity)
    }

    private fun maybeAutoAbsorb(cardId: Long, config: AnkiConnectConfig) {
        if (!config.autoAbsorbMature) {
            return
        }
        val hasMatureNote = ankiNoteRepository.findByCardId(cardId).any { it.mature }
        val hasEvidence = evidenciaAtivaRepository.findByCardId(cardId).isNotEmpty()
        if (hasMatureNote && hasEvidence) {
            studyCardRepository.findById(cardId).ifPresent {
                it.estagio = Estagio.ABSORVIDO
                studyCardRepository.save(it)
            }
        }
    }

    private fun config(): AnkiConnectConfig =
        configRepository.findById(1).orElseGet { configRepository.save(AnkiConnectConfig()) }

    private fun resolveNoteModel(configuredModelName: String): ResolvedAnkiModel {
        val modelNames = request("modelNames", emptyMap())["result"]
            ?.values()
            ?.map { it.asText() }
            ?: emptyList()
        val modelName = modelNames.firstOrNull { it.equals(configuredModelName, ignoreCase = true) }
            ?: modelNames.firstOrNull { it.equals("Basic", ignoreCase = true) }
            ?: modelNames.firstOrNull { it.equals("Básico", ignoreCase = true) || it.equals("Basico", ignoreCase = true) }
            ?: modelNames.firstOrNull()
            ?: throw IllegalStateException("Nenhum modelo de nota foi encontrado no Anki.")

        val fieldNames = request("modelFieldNames", mapOf("modelName" to modelName))["result"]
            ?.values()
            ?.map { it.asText() }
            ?: emptyList()
        if (fieldNames.isEmpty()) {
            throw IllegalStateException("O modelo '$modelName' nao possui campos configurados no Anki.")
        }

        return ResolvedAnkiModel(modelName, fieldNames)
    }

    private fun request(action: String, params: Map<String, Any?>): JsonNode {
        val body = objectMapper.writeValueAsString(mapOf("action" to action, "version" to 6, "params" to params))
        val request = HttpRequest.newBuilder()
            .uri(URI("http://localhost:8765"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build()
        val response = client.send(request, HttpResponse.BodyHandlers.ofString())
        val json = objectMapper.readTree(response.body())
        val error = json["error"]
        if (response.statusCode() !in 200..299 || error != null && !error.isNull) {
            throw IllegalStateException(error?.asText() ?: "AnkiConnect retornou erro HTTP ${response.statusCode()}.")
        }
        return json
    }
}

private data class ResolvedAnkiModel(
    val name: String,
    val fieldNames: List<String>
) {
    fun fields(front: String, back: String): Map<String, String> {
        val frontField = fieldNames.firstOrNull { it.equals("Front", ignoreCase = true) }
            ?: fieldNames.firstOrNull { it.equals("Frente", ignoreCase = true) }
            ?: fieldNames.first()
        val backField = fieldNames.firstOrNull { it.equals("Back", ignoreCase = true) }
            ?: fieldNames.firstOrNull { it.equals("Verso", ignoreCase = true) }
            ?: fieldNames.drop(1).firstOrNull()
            ?: frontField

        return if (frontField == backField) {
            mapOf(frontField to "$front\n\n$back")
        } else {
            mapOf(frontField to front, backField to back)
        }
    }
}

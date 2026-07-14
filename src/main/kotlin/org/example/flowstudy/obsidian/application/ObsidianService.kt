package org.example.flowstudy.obsidian.application

import org.example.flowstudy.obsidian.dto.ObsidianConfigRequest
import org.example.flowstudy.obsidian.dto.ObsidianConfigResponse
import org.example.flowstudy.obsidian.dto.ObsidianNoteResponse
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardOpenOption
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import kotlin.io.path.exists

private const val DEFAULT_OBSIDIAN_NOTES_FOLDER = "04 - CEREBRO"
private val DATABASE_TIMESTAMP_FORMATTER: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS")

@Service
class ObsidianService(
    private val jdbcTemplate: JdbcTemplate
) {
    fun findConfig(): ObsidianConfigResponse =
        obsidianConfig().toResponse()

    fun saveConfig(request: ObsidianConfigRequest): ObsidianConfigResponse {
        val now = databaseTimestamp()
        val values = mapOf(
            "obsidian.vaultName" to request.vaultName.trim(),
            "obsidian.vaultPath" to request.vaultPath.trim(),
            "obsidian.notesFolder" to request.notesFolder.trim().ifBlank { DEFAULT_OBSIDIAN_NOTES_FOLDER }
        )

        values.forEach { (key, value) ->
            jdbcTemplate.update(
                """
                INSERT INTO system_config (key, value, created_at, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
                """.trimIndent(),
                key,
                value,
                now,
                now
            )
        }

        return obsidianConfig().toResponse()
    }

    @Transactional
    fun createNote(cardId: Long, createAlternative: Boolean): ObsidianNoteResponse {
        val card = findCard(cardId)
        val config = obsidianConfig()
        require(config.isComplete) { "Configure nome e caminho do vault antes de gerar a nota." }
        require(config.vaultPathExists) { "O caminho do vault nao existe: ${config.vaultPath}" }

        val vaultPath = Path.of(config.vaultPath)
        val notesFolder = config.notesFolder.trim('/', '\\')
        val baseDirectory = if (notesFolder.isBlank()) vaultPath else vaultPath.resolve(notesFolder)
        Files.createDirectories(baseDirectory)
        val now = databaseTimestamp()

        if (!createAlternative && !card.obsidianPath.isNullOrBlank()) {
            return ObsidianNoteResponse(
                status = "LINKED",
                obsidianPath = card.obsidianPath,
                deepLink = obsidianDeepLink(vaultPath, card.obsidianPath),
                message = "Nota ja vinculada ao card."
            )
        }

        val fileName = "${slugifyFileName(card.titulo)}.md"
        val target = if (createAlternative) {
            nextAvailablePath(baseDirectory, fileName)
        } else {
            baseDirectory.resolve(fileName)
        }
        val relativePath = vaultPath.relativize(target).toString().replace('\\', '/')

        if (Files.exists(target) && !createAlternative) {
            jdbcTemplate.update(
                "UPDATE study_cards SET obsidian_path = ?, updated_at = ? WHERE id = ?",
                relativePath,
                now,
                cardId
            )
            return ObsidianNoteResponse(
                status = "LINKED",
                obsidianPath = relativePath,
                deepLink = obsidianDeepLink(vaultPath, relativePath),
                message = "Nota existente vinculada ao card."
            )
        }

        Files.writeString(target, obsidianTemplate(card.titulo), StandardCharsets.UTF_8, StandardOpenOption.CREATE_NEW)
        jdbcTemplate.update(
            """
            UPDATE study_cards
            SET obsidian_path = ?, obsidian_note_created_at = ?, updated_at = ?
            WHERE id = ?
            """.trimIndent(),
            relativePath,
            now,
            now,
            cardId
        )

        return ObsidianNoteResponse(
            status = "CREATED",
            obsidianPath = relativePath,
            deepLink = obsidianDeepLink(vaultPath, relativePath),
            message = "Nota criada no vault."
        )
    }

    fun openNote(cardId: Long): ObsidianNoteResponse {
        val card = findCard(cardId)
        val config = obsidianConfig()
        require(config.isComplete) { "Configure nome e caminho do vault antes de abrir a nota." }
        require(config.vaultPathExists) { "O caminho do vault nao existe: ${config.vaultPath}" }
        val obsidianPath = requireNotNull(card.obsidianPath) { "Este card ainda nao tem nota do Obsidian." }
        val vaultPath = Path.of(config.vaultPath)
        val notePath = vaultPath.resolve(obsidianPath).normalize()
        require(Files.exists(notePath)) { "A nota vinculada nao foi encontrada em: $obsidianPath" }
        val now = databaseTimestamp()

        jdbcTemplate.update(
            "UPDATE study_cards SET obsidian_last_opened_at = ?, updated_at = ? WHERE id = ?",
            now,
            now,
            cardId
        )

        return ObsidianNoteResponse(
            status = "OPEN",
            obsidianPath = obsidianPath,
            deepLink = obsidianDeepLink(vaultPath, obsidianPath),
            message = "Abrindo nota no Obsidian."
        )
    }

    private fun findCard(cardId: Long): ObsidianCard =
        jdbcTemplate.query(
            """
            SELECT id, titulo, obsidian_path
            FROM study_cards
            WHERE id = ?
            """.trimIndent(),
            { rows, _ ->
                ObsidianCard(
                    id = rows.getLong("id"),
                    titulo = rows.getString("titulo"),
                    obsidianPath = rows.getString("obsidian_path")
                )
            },
            cardId
        ).firstOrNull() ?: throw IllegalArgumentException("Study card nao encontrado com id: $cardId")

    private fun obsidianConfig(): ObsidianConfig {
        val values = jdbcTemplate.query(
            "SELECT key, value FROM system_config WHERE key LIKE 'obsidian.%'",
            { rows, _ -> rows.getString("key") to rows.getString("value") }
        ).toMap()

        return ObsidianConfig(
            vaultName = values["obsidian.vaultName"].orEmpty(),
            vaultPath = values["obsidian.vaultPath"].orEmpty(),
            notesFolder = values["obsidian.notesFolder"]?.takeIf { it.isNotBlank() } ?: DEFAULT_OBSIDIAN_NOTES_FOLDER
        )
    }
}

private data class ObsidianCard(
    val id: Long,
    val titulo: String,
    val obsidianPath: String?
)

private data class ObsidianConfig(
    val vaultName: String,
    val vaultPath: String,
    val notesFolder: String
) {
    val isComplete: Boolean = vaultName.isNotBlank() && vaultPath.isNotBlank()
    val vaultPathExists: Boolean = vaultPath.isNotBlank() && Path.of(vaultPath).exists()

    fun toResponse(): ObsidianConfigResponse =
        ObsidianConfigResponse(
            vaultName = vaultName,
            vaultPath = vaultPath,
            notesFolder = notesFolder,
            configured = isComplete,
            vaultPathExists = vaultPathExists,
            status = when {
                !isComplete -> "Informe o nome e o caminho do vault."
                !vaultPathExists -> "O caminho do vault nao existe."
                else -> "Vault configurado."
            }
        )
}

private fun slugifyFileName(value: String): String {
    val sanitized = value
        .replace(Regex("""[<>:"/\\|?*\u0000-\u001F]"""), " ")
        .replace(Regex("""\s+"""), " ")
        .trim()
        .trimEnd('.')

    return sanitized.ifBlank { "nota-study-flow" }
}

private fun nextAvailablePath(directory: Path, fileName: String): Path {
    val dotIndex = fileName.lastIndexOf('.')
    val baseName = if (dotIndex > 0) fileName.substring(0, dotIndex) else fileName
    val extension = if (dotIndex > 0) fileName.substring(dotIndex) else ""
    var suffix = 2
    var candidate = directory.resolve(fileName)

    while (Files.exists(candidate)) {
        candidate = directory.resolve("$baseName $suffix$extension")
        suffix += 1
    }

    return candidate
}

private fun obsidianTemplate(title: String): String =
    """
    # $title

    ## Problema real

    ## Conceito

    ## Quando usar

    ## Quando NAO usar

    ## Como usar

    ## Erros comuns

    ## Perguntas de recuperacao

    -
    -
    -

    ## Transferencia

    Como eu aplicaria isso em outro contexto sem consultar a nota?

    ## Flashcards candidatos

    - Trade-off:
    - Erro comum:
    - Quando nao usar:
    """.trimIndent() + "\n"

private fun obsidianDeepLink(vaultPath: Path, obsidianPath: String): String =
    "obsidian://open?path=${urlEncode(vaultPath.resolve(obsidianPath).normalize().toString())}"

private fun urlEncode(value: String): String =
    URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20")

private fun databaseTimestamp(): String =
    LocalDateTime.now().format(DATABASE_TIMESTAMP_FORMATTER)

package org.example.flowstudy.studycard.application.service.impl

import org.eclipse.jgit.api.Git
import org.eclipse.jgit.transport.URIish
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider
import org.example.flowstudy.studycard.api.dto.BackupActionResponse
import org.example.flowstudy.studycard.api.dto.BackupConfigRequest
import org.example.flowstudy.studycard.api.dto.BackupConfigResponse
import org.example.flowstudy.studycard.api.dto.ImportPreviewResponse
import org.example.flowstudy.studycard.api.dto.ImportSnapshotRequest
import org.springframework.beans.factory.annotation.Value
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import tools.jackson.databind.JsonNode
import tools.jackson.databind.ObjectMapper
import tools.jackson.databind.node.ArrayNode
import tools.jackson.databind.node.ObjectNode
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import kotlin.io.path.exists

private const val EXPORT_SCHEMA_VERSION = 1
private val FILE_TIMESTAMP_FORMATTER: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")
private val DB_TIMESTAMP_FORMATTER: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS")

@Service
class BackupWorkflowService(
    private val jdbcTemplate: JdbcTemplate,
    private val objectMapper: ObjectMapper,
    @Value("\${spring.datasource.url}") private val datasourceUrl: String
) {
    private val workspacePath: Path = Path.of("").toAbsolutePath().normalize()
    private val exportsPath: Path = workspacePath.resolve("exports")
    private val markdownPath: Path = exportsPath.resolve("markdown")
    private val backupsPath: Path = workspacePath.resolve("backups")
    private val exportJsonPath: Path = exportsPath.resolve("study-flow-export.json")

    fun buscarConfig(): BackupConfigResponse {
        val config = systemConfig()
        return BackupConfigResponse(
            remoteUrl = config["backup.githubRemoteUrl"].orEmpty(),
            tokenConfigured = !config["backup.githubToken"].isNullOrBlank()
        )
    }

    fun salvarConfig(request: BackupConfigRequest): BackupConfigResponse {
        request.remoteUrl?.let { saveConfigValue("backup.githubRemoteUrl", it.trim()) }
        request.token?.takeIf { it.isNotBlank() }?.let { saveConfigValue("backup.githubToken", it.trim()) }
        return buscarConfig()
    }

    fun exportarJson(): BackupActionResponse {
        Files.createDirectories(exportsPath)
        val snapshot = buildSnapshot()
        objectMapper.writerWithDefaultPrettyPrinter().writeValue(exportJsonPath.toFile(), snapshot)

        return BackupActionResponse(
            status = "EXPORTED",
            message = "Snapshot JSON exportado.",
            path = workspacePath.relativize(exportJsonPath).toString(),
            cardsCount = snapshot.withArray("cards").size(),
            filesCount = 1
        )
    }

    fun exportarMarkdown(): BackupActionResponse {
        Files.createDirectories(markdownPath)
        val cards = queryForList("SELECT * FROM study_cards WHERE estagio = 'ABSORVIDO' ORDER BY titulo")
        var filesCount = 0

        cards.forEach { card ->
            val cardId = (card["id"] as Number).toLong()
            val file = markdownPath.resolve("${slugifyFileName(card["titulo"].toString())}.md")
            Files.writeString(file, markdownFor(card, cardId))
            filesCount += 1
        }

        return BackupActionResponse(
            status = "EXPORTED",
            message = "$filesCount arquivo(s) Markdown exportado(s).",
            path = workspacePath.relativize(markdownPath).toString(),
            cardsCount = cards.size,
            filesCount = filesCount
        )
    }

    fun gerarBackupSqlite(): BackupActionResponse {
        val dbPath = sqlitePath()
        require(dbPath.exists()) { "Banco SQLite nao encontrado em: $dbPath" }
        Files.createDirectories(backupsPath)

        val target = backupsPath.resolve("flow-study-${LocalDateTime.now().format(FILE_TIMESTAMP_FORMATTER)}.db")
        Files.copy(dbPath, target, StandardCopyOption.REPLACE_EXISTING)

        return BackupActionResponse(
            status = "BACKED_UP",
            message = "Backup SQLite criado.",
            path = workspacePath.relativize(target).toString(),
            filesCount = 1
        )
    }

    fun commitExports(): BackupActionResponse {
        if (!exportJsonPath.exists()) {
            exportarJson()
        }
        if (!markdownPath.exists()) {
            exportarMarkdown()
        }

        val git = openOrInitGit()
        git.add().addFilepattern("exports").call()
        val status = git.status().call()
        if (status.added.isEmpty() && status.changed.isEmpty() && status.modified.isEmpty() && status.untracked.isEmpty()) {
            return BackupActionResponse(status = "UNCHANGED", message = "Nenhuma alteracao de export para commitar.")
        }

        val cardsCount = countCards()
        val commit = git.commit()
            .setMessage("Backup Study Flow - $cardsCount cards")
            .setAuthor("Study Flow", "study-flow@local")
            .call()

        return BackupActionResponse(
            status = "COMMITTED",
            message = "Exports commitados no repositorio local.",
            cardsCount = cardsCount,
            commitId = commit.id.abbreviate(10).name()
        )
    }

    fun push(): BackupActionResponse {
        val config = systemConfig()
        val remoteUrl = config["backup.githubRemoteUrl"].orEmpty()
        val token = config["backup.githubToken"].orEmpty()
        require(remoteUrl.isNotBlank()) { "Configure o remote do GitHub antes do push." }
        require(token.isNotBlank()) { "Configure o token antes do push." }

        val git = openOrInitGit()
        val repository = git.repository
        val remoteConfig = repository.config
        if (remoteConfig.getString("remote", "origin", "url").isNullOrBlank()) {
            git.remoteAdd().setName("origin").setUri(URIish(remoteUrl)).call()
        } else {
            remoteConfig.setString("remote", "origin", "url", remoteUrl)
            remoteConfig.save()
        }

        git.push()
            .setRemote("origin")
            .setCredentialsProvider(UsernamePasswordCredentialsProvider(token, ""))
            .call()

        return BackupActionResponse(status = "PUSHED", message = "Backup enviado para o remote configurado.")
    }

    fun previewImport(request: ImportSnapshotRequest): ImportPreviewResponse {
        val root = readSnapshot(request)
        validateSchema(root)
        val cards = root.withArray("cards")
        val existing = cards.elements().count { findExistingCardId(it) != null }

        return ImportPreviewResponse(
            schemaVersion = root["schemaVersion"].asInt(),
            cardsCount = cards.size(),
            existingCardsCount = existing,
            newCardsCount = cards.size() - existing
        )
    }

    @Transactional
    fun importar(request: ImportSnapshotRequest): BackupActionResponse {
        val root = readSnapshot(request)
        validateSchema(root)
        val cards = root.withArray("cards")
        var imported = 0

        cards.elements().forEach { card ->
            val oldCardId = card["id"].asLong()
            val newCardId = upsertCard(card)
            replaceRelatedRows(root, oldCardId, newCardId)
            imported += 1
        }
        importConfigs(root)

        return BackupActionResponse(
            status = "IMPORTED",
            message = "$imported card(s) importado(s) ou atualizado(s).",
            cardsCount = imported
        )
    }

    private fun buildSnapshot(): ObjectNode {
        val root = objectMapper.createObjectNode()
        root.put("schemaVersion", EXPORT_SCHEMA_VERSION)
        root.put("exportedAt", LocalDateTime.now().toString())
        root.set("cards", objectMapper.valueToTree<ArrayNode>(queryForList("SELECT * FROM study_cards ORDER BY id")))
        root.set("tags", objectMapper.valueToTree<ArrayNode>(queryForList("SELECT card_id, categoria, valor, created_at FROM card_tags ORDER BY card_id, id")))
        root.set("stageHistory", objectMapper.valueToTree<ArrayNode>(queryForList("SELECT * FROM stage_history ORDER BY card_id, created_at")))
        root.set("resources", objectMapper.valueToTree<ArrayNode>(queryForList("SELECT * FROM recursos_estudo ORDER BY card_id, id")))
        root.set("evidence", objectMapper.valueToTree<ArrayNode>(queryForList("SELECT * FROM evidencias_ativas ORDER BY card_id, id")))
        root.set("ankiNotes", objectMapper.valueToTree<ArrayNode>(queryForList("SELECT * FROM anki_notes ORDER BY card_id, id")))
        root.set("ankiConfig", objectMapper.valueToTree<ArrayNode>(queryForList("SELECT * FROM anki_connect_config ORDER BY id")))
        root.set("systemConfig", objectMapper.valueToTree<ArrayNode>(queryForList("SELECT key, CASE WHEN key = 'backup.githubToken' THEN '' ELSE value END AS value, created_at, updated_at FROM system_config ORDER BY key")))
        return root
    }

    private fun markdownFor(card: Map<String, Any?>, cardId: Long): String {
        val resources = queryForList("SELECT * FROM recursos_estudo WHERE card_id = ? ORDER BY id", cardId)
        val evidence = queryForList("SELECT * FROM evidencias_ativas WHERE card_id = ? ORDER BY id", cardId)
        val history = queryForList("SELECT * FROM stage_history WHERE card_id = ? ORDER BY created_at", cardId)
        val tags = queryForList("SELECT categoria, valor FROM card_tags WHERE card_id = ? ORDER BY id", cardId)

        return buildString {
            appendLine("---")
            appendLine("id: ${card["id"]}")
            appendLine("titulo: \"${yamlEscape(card["titulo"])}\"")
            appendLine("contexto: \"${yamlEscape(card["contexto"])}\"")
            appendLine("prioridade: ${card["prioridade"]}")
            appendLine("estagio: ${card["estagio"]}")
            appendLine("created_at: ${card["created_at"]}")
            appendLine("updated_at: ${card["updated_at"]}")
            appendLine("---")
            appendLine()
            appendLine("# ${card["titulo"]}")
            appendLine()
            appendLine("## Problema")
            appendLine(card["descricao"]?.toString().orEmpty().ifBlank { "Sem descricao registrada." })
            appendLine()
            appendLine("## Metadados")
            appendLine("- Contexto: ${card["contexto"]}")
            appendLine("- Tags: ${tags.joinToString { "${it["categoria"]}:${it["valor"]}" }.ifBlank { "Sem tags" }}")
            appendLine()
            appendLine("## Recursos")
            appendRows(resources) { "- ${it["tipo"]}: ${it["titulo"]}${it["url"]?.let { url -> " ($url)" }.orEmpty()}" }
            appendLine()
            appendLine("## Evidencias")
            appendRows(evidence) { "- ${it["tipo"]}: ${it["titulo"]}\n\n${it["conteudo"]}" }
            appendLine()
            appendLine("## Aplicacao")
            appendLine(evidence.firstOrNull { it["tipo"] == "CODIGO" || it["tipo"] == "DECISAO_TECNICA" }?.get("conteudo")?.toString() ?: "Sem aplicacao registrada.")
            appendLine()
            appendLine("## Historico")
            appendRows(history) { "- ${it["created_at"]}: ${it["from_stage"]} -> ${it["to_stage"]}. ${it["razao"]}" }
        }
    }

    private fun StringBuilder.appendRows(rows: List<Map<String, Any?>>, mapper: (Map<String, Any?>) -> String) {
        if (rows.isEmpty()) {
            appendLine("- Nenhum registro.")
            return
        }
        rows.forEach { appendLine(mapper(it)) }
    }

    private fun readSnapshot(request: ImportSnapshotRequest): JsonNode {
        val requestedPath = request.path?.takeIf { it.isNotBlank() }?.let { Path.of(it) } ?: exportJsonPath
        val path = if (requestedPath.isAbsolute) requestedPath else workspacePath.resolve(requestedPath).normalize()
        require(path.startsWith(workspacePath)) { "Importacao deve usar arquivo dentro do workspace." }
        require(path.exists()) { "Snapshot nao encontrado em: $path" }
        return objectMapper.readTree(path.toFile())
    }

    private fun validateSchema(root: JsonNode) {
        require(root["schemaVersion"]?.asInt() == EXPORT_SCHEMA_VERSION) { "Versao de schema de export nao suportada." }
        require(root["cards"]?.isArray == true) { "Snapshot sem lista de cards." }
    }

    private fun findExistingCardId(card: JsonNode): Long? {
        val id = card["id"]?.asLong()
        if (id != null && (jdbcTemplate.queryForObject("SELECT COUNT(*) FROM study_cards WHERE id = ?", Int::class.java, id) ?: 0) > 0) {
            return id
        }
        val title = card["titulo"]?.asText().orEmpty()
        val context = card["contexto"]?.asText().orEmpty()
        return jdbcTemplate.query(
            "SELECT id FROM study_cards WHERE titulo = ? AND contexto = ? LIMIT 1",
            { rows, _ -> rows.getLong("id") },
            title,
            context
        ).firstOrNull()
    }

    private fun upsertCard(card: JsonNode): Long {
        val existingId = findExistingCardId(card)
        val now = databaseTimestamp()
        if (existingId == null) {
            jdbcTemplate.update(
                """
                INSERT INTO study_cards (titulo, descricao, contexto, prioridade, estagio, order_index, obsidian_path, manual_flashcards_count,
                    manual_flashcards_created_at, next_review_at, review_interval_days, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """.trimIndent(),
                card["titulo"].asText(),
                card["descricao"]?.takeUnless { it.isNull }?.asText(),
                card["contexto"].asText(),
                card["prioridade"].asText(),
                card["estagio"].asText(),
                card["order_index"]?.asInt() ?: card["orderIndex"]?.asInt() ?: 0,
                card["obsidian_path"]?.takeUnless { it.isNull }?.asText(),
                card["manual_flashcards_count"]?.takeUnless { it.isNull }?.asInt(),
                card["manual_flashcards_created_at"]?.takeUnless { it.isNull }?.asText(),
                card["next_review_at"]?.takeUnless { it.isNull }?.asText(),
                card["review_interval_days"]?.asInt() ?: 3,
                card["created_at"]?.asText() ?: now,
                now
            )
            return jdbcTemplate.queryForObject("SELECT last_insert_rowid()", Long::class.java) ?: 0
        } else {
            jdbcTemplate.update(
                """
                UPDATE study_cards
                SET titulo = ?, descricao = ?, contexto = ?, prioridade = ?, estagio = ?, order_index = ?, obsidian_path = ?, updated_at = ?
                WHERE id = ?
                """.trimIndent(),
                card["titulo"].asText(),
                card["descricao"]?.takeUnless { it.isNull }?.asText(),
                card["contexto"].asText(),
                card["prioridade"].asText(),
                card["estagio"].asText(),
                card["order_index"]?.asInt() ?: card["orderIndex"]?.asInt() ?: 0,
                card["obsidian_path"]?.takeUnless { it.isNull }?.asText(),
                now,
                existingId
            )
            return existingId
        }
    }

    private fun replaceRelatedRows(root: JsonNode, oldCardId: Long, newCardId: Long) {
        jdbcTemplate.update("DELETE FROM card_tags WHERE card_id = ?", newCardId)
        jdbcTemplate.update("DELETE FROM stage_history WHERE card_id = ?", newCardId)
        jdbcTemplate.update("DELETE FROM recursos_estudo WHERE card_id = ?", newCardId)
        jdbcTemplate.update("DELETE FROM evidencias_ativas WHERE card_id = ?", newCardId)
        jdbcTemplate.update("DELETE FROM anki_notes WHERE card_id = ?", newCardId)

        root.withArray("tags").elements()
            .filter { it["card_id"]?.asLong() == oldCardId }
            .forEach {
                jdbcTemplate.update(
                    "INSERT INTO card_tags (card_id, categoria, valor, created_at) VALUES (?, ?, ?, ?)",
                    newCardId,
                    it["categoria"].asText(),
                    it["valor"].asText(),
                    it["created_at"]?.asText() ?: databaseTimestamp()
                )
            }

        root.withArray("stageHistory").elements()
            .filter { it["card_id"]?.asLong() == oldCardId }
            .forEach {
                jdbcTemplate.update(
                    "INSERT INTO stage_history (card_id, from_stage, to_stage, razao, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                    newCardId,
                    it["from_stage"]?.takeUnless { value -> value.isNull }?.asText(),
                    it["to_stage"].asText(),
                    it["razao"]?.takeUnless { value -> value.isNull }?.asText().orEmpty(),
                    it["created_at"]?.asText() ?: databaseTimestamp(),
                    it["updated_at"]?.asText() ?: databaseTimestamp()
                )
            }

        root.withArray("resources").elements()
            .filter { it["card_id"]?.asLong() == oldCardId }
            .forEach {
                jdbcTemplate.update(
                    "INSERT INTO recursos_estudo (card_id, tipo, titulo, url, observacoes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    newCardId,
                    it["tipo"].asText(),
                    it["titulo"].asText(),
                    it["url"]?.takeUnless { value -> value.isNull }?.asText(),
                    it["observacoes"]?.takeUnless { value -> value.isNull }?.asText(),
                    it["created_at"]?.asText() ?: databaseTimestamp(),
                    it["updated_at"]?.asText() ?: databaseTimestamp()
                )
            }

        root.withArray("evidence").elements()
            .filter { it["card_id"]?.asLong() == oldCardId }
            .forEach {
                jdbcTemplate.update(
                    "INSERT INTO evidencias_ativas (card_id, tipo, titulo, conteudo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                    newCardId,
                    it["tipo"].asText(),
                    it["titulo"].asText(),
                    it["conteudo"].asText(),
                    it["created_at"]?.asText() ?: databaseTimestamp(),
                    it["updated_at"]?.asText() ?: databaseTimestamp()
                )
            }

        root.withArray("ankiNotes").elements()
            .filter { it["card_id"]?.asLong() == oldCardId }
            .forEach {
                jdbcTemplate.update(
                    """
                    INSERT OR IGNORE INTO anki_notes (card_id, note_id, card_ids, deck_name, model_name, front, back, last_known_interval_days, mature, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """.trimIndent(),
                    newCardId,
                    it["note_id"].asLong(),
                    it["card_ids"]?.takeUnless { value -> value.isNull }?.asText(),
                    it["deck_name"].asText(),
                    it["model_name"].asText(),
                    it["front"].asText(),
                    it["back"].asText(),
                    it["last_known_interval_days"]?.takeUnless { value -> value.isNull }?.asInt(),
                    it["mature"]?.asInt() ?: 0,
                    it["created_at"]?.asText() ?: databaseTimestamp(),
                    it["updated_at"]?.asText() ?: databaseTimestamp()
                )
            }
    }

    private fun importConfigs(root: JsonNode) {
        root.withArray("systemConfig").elements()
            .filter { it["key"]?.asText() != "backup.githubToken" }
            .forEach {
                saveConfigValue(it["key"].asText(), it["value"]?.asText().orEmpty())
            }

        root.withArray("ankiConfig").elements().firstOrNull()?.let {
            jdbcTemplate.update(
                """
                INSERT INTO anki_connect_config (id, deck_name, model_name, mature_threshold_days, auto_absorb_mature, daily_review_limit, created_at, updated_at)
                VALUES (1, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    deck_name = excluded.deck_name,
                    model_name = excluded.model_name,
                    mature_threshold_days = excluded.mature_threshold_days,
                    auto_absorb_mature = excluded.auto_absorb_mature,
                    daily_review_limit = excluded.daily_review_limit,
                    updated_at = excluded.updated_at
                """.trimIndent(),
                it["deck_name"].asText(),
                it["model_name"].asText(),
                it["mature_threshold_days"].asInt(),
                it["auto_absorb_mature"].asInt(),
                it["daily_review_limit"].asInt(),
                it["created_at"]?.asText() ?: databaseTimestamp(),
                databaseTimestamp()
            )
        }
    }

    private fun queryForList(sql: String, vararg args: Any): List<Map<String, Any?>> =
        jdbcTemplate.queryForList(sql, *args)

    private fun systemConfig(): Map<String, String> =
        jdbcTemplate.query("SELECT key, value FROM system_config", { rows, _ -> rows.getString("key") to rows.getString("value") }).toMap()

    private fun saveConfigValue(key: String, value: String) {
        val now = databaseTimestamp()
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

    private fun sqlitePath(): Path {
        val rawPath = datasourceUrl.removePrefix("jdbc:sqlite:")
        val path = Path.of(rawPath)
        return if (path.isAbsolute) path else workspacePath.resolve(path).normalize()
    }

    private fun openOrInitGit(): Git =
        if (workspacePath.resolve(".git").exists()) Git.open(workspacePath.toFile()) else Git.init().setDirectory(workspacePath.toFile()).call()

    private fun countCards(): Int =
        jdbcTemplate.queryForObject("SELECT COUNT(*) FROM study_cards", Int::class.java) ?: 0

    private fun yamlEscape(value: Any?): String =
        value?.toString()?.replace("\\", "\\\\")?.replace("\"", "\\\"").orEmpty()

    private fun databaseTimestamp(): String =
        LocalDateTime.now().format(DB_TIMESTAMP_FORMATTER)

    private fun slugifyFileName(value: String): String {
        val sanitized = value
            .replace(Regex("""[<>:"/\\|?*\u0000-\u001F]"""), " ")
            .replace(Regex("""\s+"""), " ")
            .trim()
            .trimEnd('.')

        return sanitized.ifBlank { "study-flow-card" }
    }
}

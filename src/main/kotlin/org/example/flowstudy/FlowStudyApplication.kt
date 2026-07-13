package org.example.flowstudy

import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import io.ktor.http.HttpStatusCode
import io.ktor.serialization.jackson.jackson
import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.application.install
import io.ktor.server.engine.embeddedServer
import io.ktor.server.http.content.staticResources
import io.ktor.server.netty.Netty
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.response.respondRedirect
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.put
import io.ktor.server.routing.routing
import org.flywaydb.core.Flyway
import java.sql.Connection
import java.sql.DriverManager
import java.sql.ResultSet
import java.sql.Statement
import java.time.LocalDateTime

private const val DEFAULT_PORT = 8732
private const val DEFAULT_DATABASE = "flow-study.db"

fun main() {
    val config = AppConfig.fromEnvironment()
    Database.migrate(config.databaseUrl)

    embeddedServer(Netty, port = config.port, host = "0.0.0.0") {
        flowStudyModule(StudyRepository(config.databaseUrl))
    }.start(wait = true)
}

fun Application.flowStudyModule(repository: StudyRepository) {
    install(ContentNegotiation) {
        jackson {
            registerModule(JavaTimeModule())
            disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
        }
    }

    routing {
        get("/") {
            call.respondRedirect("/index.html")
        }

        staticResources("/", "static") {
            default("index.html")
        }

        get("/api/study-card") {
            call.respond(repository.findCards())
        }

        post("/api/study-card") {
            val request = call.receive<StudyCardRequest>()
            call.respond(repository.createCard(request))
        }

        put("/api/study-card/{id}") {
            val id = call.parameters.requiredLong("id")
            val request = call.receive<StudyCardRequest>()
            call.respond(repository.updateCard(id, request))
        }

        delete("/api/study-card/{id}") {
            val id = call.parameters.requiredLong("id")
            repository.deleteCard(id)
            call.respond(HttpStatusCode.NoContent)
        }

        post("/api/stage-history") {
            val request = call.receive<StageHistoryRequest>()
            call.respond(repository.createStageHistory(request))
        }

        get("/api/cards/{cardId}/resources") {
            val cardId = call.parameters.requiredLong("cardId")
            call.respond(repository.findResources(cardId))
        }

        post("/api/cards/{cardId}/resources") {
            val cardId = call.parameters.requiredLong("cardId")
            val request = call.receive<RecursoEstudoRequest>()
            call.respond(repository.createResource(cardId, request))
        }

        put("/api/cards/{cardId}/resources/{id}") {
            val cardId = call.parameters.requiredLong("cardId")
            val id = call.parameters.requiredLong("id")
            val request = call.receive<RecursoEstudoRequest>()
            call.respond(repository.updateResource(cardId, id, request))
        }

        delete("/api/cards/{cardId}/resources/{id}") {
            val cardId = call.parameters.requiredLong("cardId")
            val id = call.parameters.requiredLong("id")
            repository.deleteResource(cardId, id)
            call.respond(HttpStatusCode.NoContent)
        }

        get("/api/cards/{cardId}/evidence") {
            val cardId = call.parameters.requiredLong("cardId")
            call.respond(repository.findEvidence(cardId))
        }

        post("/api/cards/{cardId}/evidence") {
            val cardId = call.parameters.requiredLong("cardId")
            val request = call.receive<EvidenciaAtivaRequest>()
            call.respond(repository.createEvidence(cardId, request))
        }

        put("/api/cards/{cardId}/evidence/{id}") {
            val cardId = call.parameters.requiredLong("cardId")
            val id = call.parameters.requiredLong("id")
            val request = call.receive<EvidenciaAtivaRequest>()
            call.respond(repository.updateEvidence(cardId, id, request))
        }

        delete("/api/cards/{cardId}/evidence/{id}") {
            val cardId = call.parameters.requiredLong("cardId")
            val id = call.parameters.requiredLong("id")
            repository.deleteEvidence(cardId, id)
            call.respond(HttpStatusCode.NoContent)
        }
    }
}

data class AppConfig(
    val port: Int,
    val databaseUrl: String
) {
    companion object {
        fun fromEnvironment(environment: Map<String, String> = System.getenv()): AppConfig {
            val port = environment["PORT"]?.toIntOrNull() ?: DEFAULT_PORT
            val databasePath = environment["FLOW_STUDY_DB"]?.takeIf { it.isNotBlank() } ?: DEFAULT_DATABASE
            val databaseUrl = if (databasePath.startsWith("jdbc:")) {
                databasePath
            } else {
                "jdbc:sqlite:$databasePath"
            }
            return AppConfig(port, databaseUrl)
        }
    }
}

object Database {
    fun migrate(databaseUrl: String) {
        Flyway.configure()
            .dataSource(databaseUrl, null, null)
            .locations("classpath:db/migration")
            .mixed(true)
            .load()
            .migrate()
    }
}

class StudyRepository(private val databaseUrl: String) {
    fun findCards(): List<StudyCardResponse> = connection().use { connection ->
        val cards = connection.prepareStatement(
            """
            SELECT id, titulo, descricao, contexto, prioridade, estagio, order_index, created_at, updated_at
            FROM study_cards
            ORDER BY updated_at DESC, id DESC
            """.trimIndent()
        ).use { statement ->
            statement.executeQuery().use { rows ->
                buildList {
                    while (rows.next()) {
                        add(rows.toStudyCardResponse(emptyList()))
                    }
                }
            }
        }

        val tags = findTags(connection)
        cards.map { card -> card.copy(tags = tags[card.id].orEmpty()) }
    }

    fun createCard(request: StudyCardRequest): StudyCardResponse = connection().use { connection ->
        connection.autoCommit = false
        val now = LocalDateTime.now()
        val id = connection.prepareStatement(
            """
            INSERT INTO study_cards (titulo, descricao, contexto, prioridade, estagio, order_index, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """.trimIndent(),
            Statement.RETURN_GENERATED_KEYS
        ).use { statement ->
            statement.setString(1, request.titulo)
            statement.setString(2, request.descricao)
            statement.setString(3, request.contexto)
            statement.setString(4, request.prioridade)
            statement.setString(5, request.estagio)
            statement.setInt(6, request.orderIndex)
            statement.setString(7, now.toDbValue())
            statement.setString(8, now.toDbValue())
            statement.executeUpdate()
            statement.generatedKeys.use { keys ->
                keys.next()
                keys.getLong(1)
            }
        }

        replaceTags(connection, id, request.tags)
        connection.commit()
        findCard(connection, id)
    }

    fun updateCard(id: Long, request: StudyCardRequest): StudyCardResponse = connection().use { connection ->
        connection.autoCommit = false
        val updated = connection.prepareStatement(
            """
            UPDATE study_cards
            SET titulo = ?, descricao = ?, contexto = ?, prioridade = ?, estagio = ?, order_index = ?, updated_at = ?
            WHERE id = ?
            """.trimIndent()
        ).use { statement ->
            statement.setString(1, request.titulo)
            statement.setString(2, request.descricao)
            statement.setString(3, request.contexto)
            statement.setString(4, request.prioridade)
            statement.setString(5, request.estagio)
            statement.setInt(6, request.orderIndex)
            statement.setString(7, LocalDateTime.now().toDbValue())
            statement.setLong(8, id)
            statement.executeUpdate()
        }
        require(updated == 1) { "Study card nao encontrado com id: $id" }
        replaceTags(connection, id, request.tags)
        connection.commit()
        findCard(connection, id)
    }

    fun deleteCard(id: Long) = connection().use { connection ->
        connection.prepareStatement("DELETE FROM study_cards WHERE id = ?").use { statement ->
            statement.setLong(1, id)
            statement.executeUpdate()
        }
    }

    fun createStageHistory(request: StageHistoryRequest): StageHistoryResponse = connection().use { connection ->
        connection.autoCommit = false
        val now = LocalDateTime.now()
        val id = connection.prepareStatement(
            """
            INSERT INTO stage_history (card_id, from_stage, to_stage, razao, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """.trimIndent(),
            Statement.RETURN_GENERATED_KEYS
        ).use { statement ->
            statement.setLong(1, request.cardId)
            statement.setString(2, request.fromEstage)
            statement.setString(3, request.toEstage)
            statement.setString(4, request.razao)
            statement.setString(5, now.toDbValue())
            statement.setString(6, now.toDbValue())
            statement.executeUpdate()
            statement.generatedKeys.use { keys ->
                keys.next()
                keys.getLong(1)
            }
        }

        connection.prepareStatement(
            "UPDATE study_cards SET estagio = ?, updated_at = ? WHERE id = ?"
        ).use { statement ->
            statement.setString(1, request.toEstage)
            statement.setString(2, now.toDbValue())
            statement.setLong(3, request.cardId)
            statement.executeUpdate()
        }

        connection.commit()
        findStageHistory(connection, id)
    }

    fun findResources(cardId: Long): List<RecursoEstudoResponse> = connection().use { connection ->
        connection.prepareStatement(
            """
            SELECT id, card_id, tipo, titulo, url, observacoes, created_at, updated_at
            FROM recursos_estudo
            WHERE card_id = ?
            ORDER BY created_at DESC, id DESC
            """.trimIndent()
        ).use { statement ->
            statement.setLong(1, cardId)
            statement.executeQuery().use { rows ->
                buildList {
                    while (rows.next()) {
                        add(rows.toResourceResponse())
                    }
                }
            }
        }
    }

    fun createResource(cardId: Long, request: RecursoEstudoRequest): RecursoEstudoResponse = connection().use { connection ->
        val now = LocalDateTime.now()
        val id = connection.prepareStatement(
            """
            INSERT INTO recursos_estudo (card_id, tipo, titulo, url, observacoes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """.trimIndent(),
            Statement.RETURN_GENERATED_KEYS
        ).use { statement ->
            statement.setLong(1, cardId)
            statement.setString(2, request.tipo)
            statement.setString(3, request.titulo)
            statement.setString(4, request.url)
            statement.setString(5, request.observacoes)
            statement.setString(6, now.toDbValue())
            statement.setString(7, now.toDbValue())
            statement.executeUpdate()
            statement.generatedKeys.use { keys ->
                keys.next()
                keys.getLong(1)
            }
        }
        findResource(connection, cardId, id)
    }

    fun updateResource(cardId: Long, id: Long, request: RecursoEstudoRequest): RecursoEstudoResponse = connection().use { connection ->
        connection.prepareStatement(
            """
            UPDATE recursos_estudo
            SET tipo = ?, titulo = ?, url = ?, observacoes = ?, updated_at = ?
            WHERE id = ? AND card_id = ?
            """.trimIndent()
        ).use { statement ->
            statement.setString(1, request.tipo)
            statement.setString(2, request.titulo)
            statement.setString(3, request.url)
            statement.setString(4, request.observacoes)
            statement.setString(5, LocalDateTime.now().toDbValue())
            statement.setLong(6, id)
            statement.setLong(7, cardId)
            statement.executeUpdate()
        }
        findResource(connection, cardId, id)
    }

    fun deleteResource(cardId: Long, id: Long) = connection().use { connection ->
        connection.prepareStatement("DELETE FROM recursos_estudo WHERE id = ? AND card_id = ?").use { statement ->
            statement.setLong(1, id)
            statement.setLong(2, cardId)
            statement.executeUpdate()
        }
    }

    fun findEvidence(cardId: Long): List<EvidenciaAtivaResponse> = connection().use { connection ->
        connection.prepareStatement(
            """
            SELECT id, card_id, tipo, titulo, conteudo, created_at, updated_at
            FROM evidencias_ativas
            WHERE card_id = ?
            ORDER BY created_at DESC, id DESC
            """.trimIndent()
        ).use { statement ->
            statement.setLong(1, cardId)
            statement.executeQuery().use { rows ->
                buildList {
                    while (rows.next()) {
                        add(rows.toEvidenceResponse())
                    }
                }
            }
        }
    }

    fun createEvidence(cardId: Long, request: EvidenciaAtivaRequest): EvidenciaAtivaResponse = connection().use { connection ->
        val now = LocalDateTime.now()
        val id = connection.prepareStatement(
            """
            INSERT INTO evidencias_ativas (card_id, tipo, titulo, conteudo, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """.trimIndent(),
            Statement.RETURN_GENERATED_KEYS
        ).use { statement ->
            statement.setLong(1, cardId)
            statement.setString(2, request.tipo)
            statement.setString(3, request.titulo)
            statement.setString(4, request.conteudo)
            statement.setString(5, now.toDbValue())
            statement.setString(6, now.toDbValue())
            statement.executeUpdate()
            statement.generatedKeys.use { keys ->
                keys.next()
                keys.getLong(1)
            }
        }
        findEvidence(connection, cardId, id)
    }

    fun updateEvidence(cardId: Long, id: Long, request: EvidenciaAtivaRequest): EvidenciaAtivaResponse = connection().use { connection ->
        connection.prepareStatement(
            """
            UPDATE evidencias_ativas
            SET tipo = ?, titulo = ?, conteudo = ?, updated_at = ?
            WHERE id = ? AND card_id = ?
            """.trimIndent()
        ).use { statement ->
            statement.setString(1, request.tipo)
            statement.setString(2, request.titulo)
            statement.setString(3, request.conteudo)
            statement.setString(4, LocalDateTime.now().toDbValue())
            statement.setLong(5, id)
            statement.setLong(6, cardId)
            statement.executeUpdate()
        }
        findEvidence(connection, cardId, id)
    }

    fun deleteEvidence(cardId: Long, id: Long) = connection().use { connection ->
        connection.prepareStatement("DELETE FROM evidencias_ativas WHERE id = ? AND card_id = ?").use { statement ->
            statement.setLong(1, id)
            statement.setLong(2, cardId)
            statement.executeUpdate()
        }
    }

    private fun findCard(connection: Connection, id: Long): StudyCardResponse {
        val card = connection.prepareStatement(
            """
            SELECT id, titulo, descricao, contexto, prioridade, estagio, order_index, created_at, updated_at
            FROM study_cards
            WHERE id = ?
            """.trimIndent()
        ).use { statement ->
            statement.setLong(1, id)
            statement.executeQuery().use { rows ->
                require(rows.next()) { "Study card nao encontrado com id: $id" }
                rows.toStudyCardResponse(findTags(connection, id))
            }
        }
        return card
    }

    private fun findStageHistory(connection: Connection, id: Long): StageHistoryResponse =
        connection.prepareStatement(
            """
            SELECT id, card_id, from_stage, to_stage, razao, created_at, updated_at
            FROM stage_history
            WHERE id = ?
            """.trimIndent()
        ).use { statement ->
            statement.setLong(1, id)
            statement.executeQuery().use { rows ->
                require(rows.next()) { "Historico nao encontrado com id: $id" }
                rows.toStageHistoryResponse()
            }
        }

    private fun findResource(connection: Connection, cardId: Long, id: Long): RecursoEstudoResponse =
        connection.prepareStatement(
            """
            SELECT id, card_id, tipo, titulo, url, observacoes, created_at, updated_at
            FROM recursos_estudo
            WHERE id = ? AND card_id = ?
            """.trimIndent()
        ).use { statement ->
            statement.setLong(1, id)
            statement.setLong(2, cardId)
            statement.executeQuery().use { rows ->
                require(rows.next()) { "Recurso nao encontrado com id: $id" }
                rows.toResourceResponse()
            }
        }

    private fun findEvidence(connection: Connection, cardId: Long, id: Long): EvidenciaAtivaResponse =
        connection.prepareStatement(
            """
            SELECT id, card_id, tipo, titulo, conteudo, created_at, updated_at
            FROM evidencias_ativas
            WHERE id = ? AND card_id = ?
            """.trimIndent()
        ).use { statement ->
            statement.setLong(1, id)
            statement.setLong(2, cardId)
            statement.executeQuery().use { rows ->
                require(rows.next()) { "Evidencia nao encontrada com id: $id" }
                rows.toEvidenceResponse()
            }
        }

    private fun findTags(connection: Connection): Map<Long, List<CardTagResponse>> =
        connection.prepareStatement(
            """
            SELECT id, card_id, categoria, valor, created_at
            FROM card_tags
            ORDER BY created_at ASC, id ASC
            """.trimIndent()
        ).use { statement ->
            statement.executeQuery().use { rows ->
                buildList {
                    while (rows.next()) {
                        add(rows.getLong("card_id") to rows.toCardTagResponse())
                    }
                }.groupBy({ it.first }, { it.second })
            }
        }

    private fun findTags(connection: Connection, cardId: Long): List<CardTagResponse> =
        connection.prepareStatement(
            """
            SELECT id, card_id, categoria, valor, created_at
            FROM card_tags
            WHERE card_id = ?
            ORDER BY created_at ASC, id ASC
            """.trimIndent()
        ).use { statement ->
            statement.setLong(1, cardId)
            statement.executeQuery().use { rows ->
                buildList {
                    while (rows.next()) {
                        add(rows.toCardTagResponse())
                    }
                }
            }
        }

    private fun replaceTags(connection: Connection, cardId: Long, tags: List<CardTagRequest>) {
        connection.prepareStatement("DELETE FROM card_tags WHERE card_id = ?").use { statement ->
            statement.setLong(1, cardId)
            statement.executeUpdate()
        }

        val now = LocalDateTime.now().toDbValue()
        connection.prepareStatement(
            """
            INSERT INTO card_tags (card_id, categoria, valor, created_at)
            VALUES (?, ?, ?, ?)
            """.trimIndent()
        ).use { statement ->
            tags.forEach { tag ->
                statement.setLong(1, cardId)
                statement.setString(2, tag.categoria)
                statement.setString(3, tag.valor)
                statement.setString(4, now)
                statement.addBatch()
            }
            statement.executeBatch()
        }
    }

    private fun connection(): Connection =
        DriverManager.getConnection(databaseUrl).also { connection ->
            connection.createStatement().use { statement ->
                statement.execute("PRAGMA foreign_keys = ON")
            }
        }
}

data class StudyCardRequest(
    val titulo: String,
    val descricao: String? = null,
    val contexto: String,
    val prioridade: String = "MEDIA",
    val estagio: String = "TRIAGEM",
    val orderIndex: Int = 0,
    val tags: List<CardTagRequest> = emptyList()
)

data class StudyCardResponse(
    val id: Long,
    val titulo: String,
    val descricao: String?,
    val contexto: String,
    val prioridade: String,
    val estagio: String,
    val orderIndex: Int,
    val tags: List<CardTagResponse>,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)

data class CardTagRequest(
    val categoria: String,
    val valor: String
)

data class CardTagResponse(
    val id: Long,
    val categoria: String,
    val valor: String,
    val createdAt: LocalDateTime
)

data class StageHistoryRequest(
    val cardId: Long,
    val fromEstage: String,
    val toEstage: String,
    val razao: String? = null
)

data class StageHistoryResponse(
    val id: Long,
    val cardId: Long,
    val fromEstage: String?,
    val toEstage: String,
    val razao: String?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)

data class RecursoEstudoRequest(
    val cardId: Long = 0,
    val tipo: String,
    val titulo: String,
    val url: String? = null,
    val observacoes: String? = null
)

data class RecursoEstudoResponse(
    val id: Long,
    val cardId: Long,
    val tipo: String,
    val titulo: String,
    val url: String?,
    val observacoes: String?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)

data class EvidenciaAtivaRequest(
    val cardId: Long = 0,
    val tipo: String,
    val titulo: String,
    val conteudo: String
)

data class EvidenciaAtivaResponse(
    val id: Long,
    val cardId: Long,
    val tipo: String,
    val titulo: String,
    val conteudo: String,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)

private fun ResultSet.toStudyCardResponse(tags: List<CardTagResponse>): StudyCardResponse =
    StudyCardResponse(
        id = getLong("id"),
        titulo = getString("titulo"),
        descricao = getString("descricao"),
        contexto = getString("contexto"),
        prioridade = getString("prioridade"),
        estagio = getString("estagio"),
        orderIndex = getInt("order_index"),
        tags = tags,
        createdAt = getString("created_at").toLocalDateTime(),
        updatedAt = getString("updated_at").toLocalDateTime()
    )

private fun ResultSet.toCardTagResponse(): CardTagResponse =
    CardTagResponse(
        id = getLong("id"),
        categoria = getString("categoria"),
        valor = getString("valor"),
        createdAt = getString("created_at").toLocalDateTime()
    )

private fun ResultSet.toStageHistoryResponse(): StageHistoryResponse =
    StageHistoryResponse(
        id = getLong("id"),
        cardId = getLong("card_id"),
        fromEstage = getString("from_stage"),
        toEstage = getString("to_stage"),
        razao = getString("razao"),
        createdAt = getString("created_at").toLocalDateTime(),
        updatedAt = getString("updated_at").toLocalDateTime()
    )

private fun ResultSet.toResourceResponse(): RecursoEstudoResponse =
    RecursoEstudoResponse(
        id = getLong("id"),
        cardId = getLong("card_id"),
        tipo = getString("tipo"),
        titulo = getString("titulo"),
        url = getString("url"),
        observacoes = getString("observacoes"),
        createdAt = getString("created_at").toLocalDateTime(),
        updatedAt = getString("updated_at").toLocalDateTime()
    )

private fun ResultSet.toEvidenceResponse(): EvidenciaAtivaResponse =
    EvidenciaAtivaResponse(
        id = getLong("id"),
        cardId = getLong("card_id"),
        tipo = getString("tipo"),
        titulo = getString("titulo"),
        conteudo = getString("conteudo"),
        createdAt = getString("created_at").toLocalDateTime(),
        updatedAt = getString("updated_at").toLocalDateTime()
    )

private fun LocalDateTime.toDbValue(): String = toString()

private fun String.toLocalDateTime(): LocalDateTime = LocalDateTime.parse(this.replace(' ', 'T'))

private fun io.ktor.http.Parameters.requiredLong(name: String): Long =
    requireNotNull(this[name]) { "Parametro obrigatorio ausente: $name" }.toLong()

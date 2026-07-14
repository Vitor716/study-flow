package org.example.flowstudy

import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.stereotype.Component
import java.awt.Desktop
import java.net.URI
import java.nio.file.Files
import java.nio.file.Path

private const val DEFAULT_PORT = 8732
private const val APP_NAME = "StudyFlow"

fun main(args: Array<String>) {
    val config = AppConfig.fromEnvironment(args = args)
    ensureSqliteParentDirectory(config.databaseUrl)

    System.setProperty("server.port", config.port.toString())
    System.setProperty("spring.datasource.url", config.databaseUrl)
    System.setProperty("flow-study.open-browser", config.openBrowser.toString())

    runApplication<FlowStudyApplication>(*args)
}

@SpringBootApplication
class FlowStudyApplication

data class AppConfig(
    val port: Int,
    val databaseUrl: String,
    val openBrowser: Boolean
) {
    companion object {
        fun fromEnvironment(
            environment: Map<String, String> = System.getenv(),
            args: Array<String> = emptyArray()
        ): AppConfig {
            val port = environment["PORT"]?.toIntOrNull() ?: DEFAULT_PORT
            val databasePath = environment["FLOW_STUDY_DB"]?.takeIf { it.isNotBlank() }
                ?: defaultDatabasePath(environment)
            val databaseUrl = if (databasePath.startsWith("jdbc:")) {
                databasePath
            } else {
                "jdbc:sqlite:$databasePath"
            }
            val openBrowser = args.contains("--open-browser") ||
                environment["FLOW_STUDY_OPEN_BROWSER"].equals("true", ignoreCase = true)
            return AppConfig(port, databaseUrl, openBrowser)
        }

        private fun defaultDatabasePath(environment: Map<String, String>): String {
            val basePath = environment["APPDATA"]?.takeIf { it.isNotBlank() }
                ?: Path.of(System.getProperty("user.home"), ".local", "share").toString()

            return Path.of(basePath, APP_NAME, "flow-study.db").toString()
        }
    }
}

@Component
class BrowserLauncher(
    @Value("\${flow-study.open-browser:false}") private val openBrowser: Boolean,
    @Value("\${server.port:$DEFAULT_PORT}") private val port: Int
) : ApplicationRunner {
    override fun run(args: ApplicationArguments) {
        if (openBrowser) {
            Browser.open("http://localhost:$port")
        }
    }
}

object Browser {
    fun open(url: String) {
        runCatching {
            if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                Desktop.getDesktop().browse(URI(url))
            }
        }
    }
}

private fun ensureSqliteParentDirectory(databaseUrl: String) {
    val pathValue = databaseUrl.removePrefix("jdbc:sqlite:")
    if (pathValue.isBlank() || pathValue == ":memory:" || pathValue.startsWith("file:")) {
        return
    }

    val parent = Path.of(pathValue).toAbsolutePath().parent ?: return
    Files.createDirectories(parent)
}

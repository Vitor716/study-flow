package org.example.flowstudy

import kotlin.test.Test
import kotlin.test.assertEquals

class FlowStudyApplicationTests {
    @Test
    fun defaultConfigurationUsesLocalPortAndDatabase() {
        val config = AppConfig.fromEnvironment(mapOf("APPDATA" to "C:\\Users\\dev\\AppData\\Roaming"))

        assertEquals(8732, config.port)
        assertEquals("jdbc:sqlite:C:\\Users\\dev\\AppData\\Roaming\\StudyFlow\\flow-study.db", config.databaseUrl)
        assertEquals(false, config.openBrowser)
    }

    @Test
    fun browserCanBeOpenedByArgument() {
        val config = AppConfig.fromEnvironment(
            environment = mapOf("APPDATA" to "C:\\Users\\dev\\AppData\\Roaming"),
            args = arrayOf("--open-browser")
        )

        assertEquals(true, config.openBrowser)
    }
}

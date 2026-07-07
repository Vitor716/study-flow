package org.example.flowstudy

import kotlin.test.Test
import kotlin.test.assertEquals

class FlowStudyApplicationTests {
    @Test
    fun defaultConfigurationUsesLocalPortAndDatabase() {
        val config = AppConfig.fromEnvironment(emptyMap())

        assertEquals(8732, config.port)
        assertEquals("jdbc:sqlite:flow-study.db", config.databaseUrl)
    }
}

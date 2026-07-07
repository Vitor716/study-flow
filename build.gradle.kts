plugins {
    kotlin("jvm") version "2.2.21"
    application
}

group = "org.example"
version = "0.0.1-SNAPSHOT"
description = "flow-study"

val ktorVersion = "3.3.0"
val flywayVersion = "12.4.0"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("io.ktor:ktor-server-core-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-netty-jvm:$ktorVersion")
    implementation("io.ktor:ktor-server-content-negotiation-jvm:$ktorVersion")
    implementation("io.ktor:ktor-serialization-jackson-jvm:$ktorVersion")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310:2.20.1")
    implementation("ch.qos.logback:logback-classic:1.5.22")
    implementation("org.flywaydb:flyway-core:$flywayVersion")
    implementation("org.xerial:sqlite-jdbc:3.53.2.0")

    testImplementation("io.ktor:ktor-server-test-host-jvm:$ktorVersion")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

application {
    mainClass = "org.example.flowstudy.FlowStudyApplicationKt"
}

kotlin {
    sourceSets {
        main {
            kotlin.exclude("org/example/flowstudy/studycard/**")
        }
    }
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

tasks.jar {
    archiveFileName = "study-flow.jar"
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
    manifest {
        attributes["Main-Class"] = application.mainClass.get()
    }
    from({
        configurations.runtimeClasspath.get()
            .filter { it.name.endsWith(".jar") }
            .map { zipTree(it) }
    })
}

tasks.withType<Test> {
    useJUnitPlatform()
}

tasks.register("localBuild") {
    group = "build"
    description = "Builds the runnable local jar at build/libs/study-flow.jar."
    dependsOn("build")
}

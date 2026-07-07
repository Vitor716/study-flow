# Study Flow

Aplicacao local em Kotlin/Ktor para acompanhar estudos em um fluxo visual.

## Requisitos

- Java 21
- Windows, Linux ou macOS com acesso ao terminal

## Build

No Windows:

```powershell
.\gradlew.bat build
```

No Linux/macOS:

```bash
./gradlew build
```

O build gera a aplicacao executavel em:

```text
build/libs/study-flow.jar
```

## Rodar localmente

```bash
java -jar build/libs/study-flow.jar
```

A aplicacao abre em:

```text
http://localhost:8732
```

Na primeira execucao o SQLite cria o arquivo `flow-study.db` automaticamente e o Flyway roda as migrations em `src/main/resources/db/migration`.

## Rodar com poucos cliques no Windows

Use duplo clique em:

```text
run-local.bat
```

O script compila a aplicacao e deixa o servidor aberto em `http://localhost:8732`.

Para uso diario, sem recompilar toda vez, use:

```text
start-study-flow.bat
```

Para abrir apenas o navegador no endereco local, use:

```text
open-study-flow.bat
```

## Iniciar junto com o Windows

Execute uma vez no PowerShell:

```powershell
.\install-startup.ps1
```

Esse comando compila a aplicacao e cria um atalho `Study Flow` na pasta de inicializacao do Windows. Depois disso, ao ligar o PC e entrar no Windows, o servidor local inicia automaticamente.

Para acessar, abra:

```text
http://localhost:8732
```

Para remover da inicializacao:

```powershell
.\uninstall-startup.ps1
```

## Banco separado para producao

Defina `FLOW_STUDY_DB` antes de iniciar a aplicacao. Pode ser um caminho de arquivo ou uma URL JDBC SQLite.

PowerShell:

```powershell
$env:FLOW_STUDY_DB = "data\flow-study-prod.db"
java -jar build/libs/study-flow.jar
```

Bash:

```bash
FLOW_STUDY_DB=data/flow-study-prod.db java -jar build/libs/study-flow.jar
```

Tambem e possivel mudar a porta com `PORT`.

## Alterar frontend estatico

Edite os arquivos em:

```text
src/main/resources/static
```

Depois rode novamente:

```bash
./gradlew build
java -jar build/libs/study-flow.jar
```

A nova JAR inclui a versao recompilada dos arquivos estaticos.

# ADR 0001: Estrutura arquitetural, dependencias e regras de organizacao

## Status

Aceita

## Data

2026-07-06

## Contexto

O projeto `flow-study` e uma API Kotlin com Spring Boot para organizar cards de estudo. A primeira parte do dominio modela `StudyCard` e suas `CardTag`, persistidas em SQLite com schema versionado pelo Flyway.

Como o projeto ainda esta no inicio, a organizacao deve ser simples, mas ja precisa evitar pacotes globais por tipo tecnico, como `entity`, `dto` e `enums`, porque essa abordagem tende a misturar dominios diferentes quando a aplicacao cresce.

Esta ADR tambem serve como manual de consulta para decidir onde colocar controllers, services, regras de negocio, repositories, interfaces e implementacoes de infraestrutura.

## Decisao

Organizar o codigo por contexto de negocio. O contexto atual e `studycard`.

Estrutura recomendada:

```text
src/main/kotlin/org/example/flowstudy
|-- FlowStudyApplication.kt
`-- studycard
    |-- api
    |   |-- controller
    |   `-- dto
    |       |-- CardTagRequest.kt
    |       |-- CardTagResponse.kt
    |       |-- StudyCardRequest.kt
    |       `-- StudyCardResponse.kt
    |-- application
    |   |-- port
    |   |   `-- StudyCardRepository.kt
    |   |-- service
    |   `-- usecase
    |-- domain
    |   `-- model
    |       |-- CardTag.kt
    |       |-- CategoriaTag.kt
    |       |-- Estagio.kt
    |       |-- Prioridade.kt
    |       `-- StudyCard.kt
    `-- infrastructure
        `-- persistence
            |-- JpaStudyCardRepository.kt
            `-- SpringDataStudyCardRepository.kt
```

A estrutura atual ainda nao precisa ter todos esses arquivos. Diretorios como `controller`, `port`, `service`, `usecase` e `infrastructure` devem ser criados conforme a funcionalidade surgir.

## Responsabilidades por camada

- `studycard/api/controller`: controllers HTTP. Recebem requests, chamam casos de uso e devolvem responses.
- `studycard/api/dto`: contratos de entrada e saida da API, como requests e responses.
- `studycard/application/usecase`: interfaces ou contratos de operacoes da aplicacao.
- `studycard/application/service`: implementacoes dos casos de uso e coordenacao de fluxo.
- `studycard/application/port`: interfaces que a aplicacao precisa para persistencia ou integracoes externas.
- `studycard/domain/model`: modelo central do dominio, entities, enums e regras do negocio.
- `studycard/infrastructure/persistence`: implementacoes concretas de persistencia, Spring Data JPA, adapters e queries.
- `FlowStudyApplication.kt`: ponto de entrada da aplicacao Spring Boot.

Por enquanto, as entities tambem sao entities JPA. Isso e aceitavel no estagio atual do projeto, mas deve ser reavaliado se o dominio ganhar regras mais complexas ou se a persistencia comecar a influenciar demais o desenho do modelo.

## Fluxo padrao

O fluxo recomendado para uma chamada HTTP e:

```text
Controller -> Use case/Application service -> Domain -> Port -> Infrastructure
```

Exemplo:

```text
api/controller/StudyCardController
    chama
application/usecase/CriarStudyCardUseCase
    implementado por
application/service/CriarStudyCardService
    usa
application/port/StudyCardRepository
    implementado por
infrastructure/persistence/JpaStudyCardRepository
    delega para
infrastructure/persistence/SpringDataStudyCardRepository
```

O controller deve depender de um caso de uso da camada `application`, nao de repository JPA diretamente.

## API

Use `studycard/api` para tudo que pertence a borda HTTP da aplicacao.

Coloque em `api/controller`:

- controllers REST;
- anotacoes como `@RestController`, `@RequestMapping`, `@GetMapping`, `@PostMapping`;
- validacao de entrada ligada ao protocolo HTTP;
- conversao de requests para chamadas de caso de uso;
- conversao de resultados para responses.

O controller deve ser fino. Ele nao deve conter regra de negocio, acesso direto ao banco ou decisao de fluxo complexa.

Exemplo de dependencia esperada:

```kotlin
@RestController
class StudyCardController(
    private val criarStudyCard: CriarStudyCardUseCase
)
```

Coloque em `api/dto`:

- classes `Request`;
- classes `Response`;
- payloads especificos da API;
- objetos que representam exatamente o contrato HTTP.

DTOs nao devem carregar regra de negocio. Eles podem ter validacoes simples de formato, mas nao devem decidir comportamento do dominio.

## Application

Use `studycard/application` para coordenar casos de uso. Essa camada representa o que a aplicacao faz.

Coloque em `application/usecase`:

- interfaces de casos de uso;
- contratos orientados a acao, como `CriarStudyCardUseCase`, `ListarStudyCardsUseCase`, `MoverStudyCardUseCase`.

Coloque em `application/service`:

- implementacoes dos casos de uso;
- coordenacao de transacao;
- busca e persistencia por meio de interfaces em `application/port`;
- chamada para metodos do dominio;
- montagem do resultado que volta para a API.

Application service nao deve conter detalhes de HTTP, como `ResponseEntity`, status code ou anotacoes de controller.

Application service tambem nao deve depender diretamente de implementacoes de infraestrutura. Ele deve depender de interfaces.

Coloque em `application/port`:

- interfaces de repository usadas pelos casos de uso;
- interfaces de gateways externos;
- interfaces de clientes externos;
- contratos que permitem a aplicacao nao conhecer detalhes de infraestrutura.

Exemplo:

```kotlin
interface StudyCardRepository {
    fun save(studyCard: StudyCard): StudyCard
    fun findById(id: Long): StudyCard?
}
```

## Domain

Use `studycard/domain` para regras e conceitos centrais do negocio.

Coloque em `domain/model`:

- entidades do dominio;
- value objects, quando surgirem;
- enums que fazem parte da linguagem do negocio;
- metodos que protegem invariantes do dominio.

Exemplos de regras que pertencem ao dominio:

- validar se um card pode mudar para determinado `Estagio`;
- adicionar uma tag evitando duplicidade;
- remover uma tag;
- alterar prioridade;
- garantir que `titulo` e `contexto` facam sentido para um card valido;
- manter consistencia entre estado interno e comportamento.

Evite deixar o dominio como um conjunto de objetos anemicos com apenas getters e setters quando houver regra real. Prefira metodos com intencao de negocio:

```kotlin
studyCard.moverPara(Estagio.ESTUDO_ATIVO)
studyCard.adicionarTag(CategoriaTag.LINGUAGEM, "kotlin")
studyCard.alterarPrioridade(Prioridade.ALTA)
```

Regra pratica:

- Se a regra sempre deve valer para o objeto, ela pertence ao dominio.
- Se a regra coordena varias operacoes, transacao ou acesso a dados, ela pertence a aplicacao.
- Se a regra existe por causa de HTTP, ela pertence a API.
- Se a regra existe por causa do banco ou framework, ela pertence a infraestrutura.

## Infrastructure

Use `studycard/infrastructure` para detalhes tecnicos.

Coloque em `infrastructure/persistence`:

- repositories Spring Data JPA;
- adapters que implementam interfaces de `application/port`;
- queries especificas de banco;
- conversores entre modelo de persistencia e dominio, caso sejam separados no futuro.

Convencao recomendada para repositories:

```text
application/port/StudyCardRepository.kt
infrastructure/persistence/SpringDataStudyCardRepository.kt
infrastructure/persistence/JpaStudyCardRepository.kt
```

Onde:

- `StudyCardRepository` e a interface que a aplicacao conhece.
- `SpringDataStudyCardRepository` e a interface do Spring Data, como `JpaRepository`.
- `JpaStudyCardRepository` e o adapter que implementa a porta e delega para o Spring Data.

Essa separacao evita que a camada de aplicacao dependa diretamente de Spring Data.

Para funcionalidades pequenas, pode ser aceitavel usar o repository Spring Data diretamente no service de aplicacao. Porem, se a intencao for manter a arquitetura mais proxima de DDD/ports and adapters, prefira a interface em `application/port`.

## Regras de dependencia entre camadas

As dependencias devem apontar para dentro do dominio e para contratos, nao para detalhes externos.

Permitido:

```text
api -> application
application -> domain
application -> application/port
infrastructure -> application/port
infrastructure -> domain
```

Evitar:

```text
domain -> application
domain -> api
domain -> infrastructure
application -> api
application -> infrastructure
api -> infrastructure
```

Em termos praticos:

- Controller nao acessa repository diretamente.
- Controller nao implementa regra de negocio.
- Service de aplicacao nao retorna `ResponseEntity`.
- Dominio nao conhece DTO de request/response.
- Dominio nao deve depender de classes de controller, repository Spring Data ou configuracao de framework.
- Repository concreto fica em infraestrutura.
- Interfaces de repository usadas pela aplicacao ficam em `application/port`.

## Guia para novas funcionalidades

Ao criar uma nova funcionalidade dentro de `studycard`, siga este roteiro:

1. Crie ou ajuste o modelo em `domain/model` se houver novo conceito de negocio.
2. Coloque a regra no dominio quando ela proteger a consistencia do proprio objeto.
3. Crie um caso de uso em `application/usecase` quando a funcionalidade representar uma acao da aplicacao.
4. Implemente o caso de uso em `application/service`.
5. Crie portas em `application/port` para persistencia ou integracoes externas.
6. Implemente as portas em `infrastructure`.
7. Exponha a funcionalidade em `api/controller`.
8. Crie DTOs em `api/dto` para entrada e saida HTTP.
9. Se houver mudanca de banco, crie uma nova migration Flyway.

Exemplo para "criar card":

```text
api/dto/StudyCardRequest.kt
api/dto/StudyCardResponse.kt
api/controller/StudyCardController.kt
application/usecase/CriarStudyCardUseCase.kt
application/service/CriarStudyCardService.kt
application/port/StudyCardRepository.kt
infrastructure/persistence/JpaStudyCardRepository.kt
domain/model/StudyCard.kt
```

## Onde colocar testes

Testes devem seguir a mesma intencao das camadas:

- Testes de dominio: validam regras em `domain/model` sem subir Spring.
- Testes de application service: validam casos de uso usando fakes/mocks das portas.
- Testes de API: validam contrato HTTP, serializacao, status code e integracao com controllers.
- Testes de persistencia: validam queries, mappings JPA e migrations.

Evite depender de `@SpringBootTest` para toda regra simples. Regras de dominio devem ser testadas com testes unitarios comuns.

## Persistencia e migrations

O schema do banco e controlado pelo Flyway em:

```text
src/main/resources/db/migration/V1__criar_study.sql
```

A migration cria:

- `study_cards`: tabela principal dos cards de estudo.
- `card_tags`: tags associadas aos cards.
- indices para consultas por `estagio`, `contexto`, `prioridade`, ordenacao por estagio e busca por categoria/valor de tag.

Configuracao atual de banco:

```properties
spring.datasource.url=jdbc:sqlite:flow-study.db
spring.datasource.driver-class-name=org.sqlite.JDBC
spring.jpa.database-platform=org.hibernate.community.dialect.SQLiteDialect
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
```

O Hibernate valida o schema existente contra as entities, mas nao cria nem altera tabelas automaticamente. Essa responsabilidade fica com o Flyway.

## Dependencias principais

As dependencias sao declaradas em `build.gradle.kts`.

- `org.springframework.boot:spring-boot-starter-webmvc`: suporte para API HTTP com Spring MVC.
- `org.springframework.boot:spring-boot-starter-data-jpa`: persistencia com JPA/Hibernate.
- `org.springframework.boot:spring-boot-starter-flyway`: execucao e validacao das migrations.
- `org.hibernate.orm:hibernate-community-dialects`: dialeto SQLite para Hibernate.
- `org.xerial:sqlite-jdbc`: driver JDBC do SQLite.
- `org.jetbrains.kotlin:kotlin-reflect`: reflexao necessaria para integracao Kotlin/Spring.
- `tools.jackson.module:jackson-module-kotlin`: serializacao e desserializacao JSON com tipos Kotlin.
- `org.springframework.boot:spring-boot-devtools`: apoio ao desenvolvimento local.

Dependencias de teste:

- `spring-boot-starter-data-jpa-test`
- `spring-boot-starter-flyway-test`
- `spring-boot-starter-webmvc-test`
- `kotlin-test-junit5`
- `junit-platform-launcher`

## Convencoes

- Novos contextos devem ficar em pacotes proprios abaixo de `org.example.flowstudy`, seguindo a mesma ideia de `studycard`.
- Evitar recriar pacotes globais como `dto`, `entity`, `service`, `repository` ou `enums` para codigo de dominio especifico.
- Requests e responses pertencem a camada `api`.
- Regras de negocio devem ficar no `domain` ou ser coordenadas pela camada `application`, nao diretamente em controllers.
- A camada `application` deve expor casos de uso e nao detalhes de infraestrutura.
- Alteracoes de schema devem ser feitas por novas migrations, nao por `ddl-auto=create` ou `ddl-auto=update`.

## Consequencias

Beneficios:

- O codigo fica organizado por capacidade de negocio, nao por tipo tecnico.
- O crescimento do projeto tende a ser mais controlado, porque cada contexto tem sua propria API, aplicacao e dominio.
- A fronteira do contexto `studycard` fica explicita.
- O Flyway se torna a fonte de verdade para estrutura do banco.

Custos:

- Para funcionalidades pequenas, a estrutura tem mais diretorios do que uma organizacao simples por camada.
- Enquanto entities JPA ficarem dentro do dominio, anotacoes de persistencia continuam acopladas ao modelo.
- Se o dominio crescer, pode ser necessario separar modelo de dominio puro e modelo de persistencia.

## Alternativas consideradas

### Pacotes globais por camada tecnica

Exemplo:

```text
controller
service
repository
entity
dto
enums
```

Essa abordagem e simples no inicio, mas mistura conceitos de dominios diferentes conforme o projeto cresce. Foi evitada para manter o projeto mais proximo de uma organizacao por contexto.

### DDD com dominio totalmente puro

Outra opcao seria criar entities de dominio sem anotacoes JPA e manter models de persistencia separados. Essa alternativa reduz acoplamento com infraestrutura, mas adiciona mapeamento e complexidade antes de existir necessidade concreta.

No momento, foi escolhida uma abordagem intermediaria: organizacao por contexto com entities JPA no dominio.

## Criterios para revisao futura

Esta decisao deve ser revisada se:

- O projeto ganhar mais contextos alem de `studycard`.
- As regras de negocio ficarem complexas dentro das entities.
- A API precisar de casos de uso transacionais mais claros.
- A persistencia SQLite for substituida por outro banco.
- O acoplamento entre JPA e dominio comecar a dificultar testes ou evolucao do modelo.

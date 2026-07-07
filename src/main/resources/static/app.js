const API = {
    cards: "/api/study-card",
    stageHistory: "/api/stage-history",
    resources: (cardId) => `/api/cards/${cardId}/resources`,
    resource: (cardId, resourceId) => `/api/cards/${cardId}/resources/${resourceId}`,
    evidence: (cardId) => `/api/cards/${cardId}/evidence`,
    evidenceItem: (cardId, evidenceId) => `/api/cards/${cardId}/evidence/${evidenceId}`
};

const STAGES = [
    { key: "GATILHO", label: "Gatilho", hint: "Problema percebido", detail: "Capture o gatilho: bug, duvida, requisito ou lacuna que iniciou o estudo.", color: "#ff8d7a" },
    { key: "CAPTURA", label: "Captura", hint: "Escopo e materiais", detail: "Defina o recorte e junte links, docs, cursos ou referencias para estudar.", color: "#f0b65d" },
    { key: "ESTUDO_ATIVO", label: "Estudo ativo", hint: "Entendimento guiado", detail: "Leia, compare, teste hipoteses e produza explicacoes com suas palavras.", color: "#8fb5ff" },
    { key: "APLICACAO", label: "Aplicacao", hint: "Codigo ou entrega", detail: "Transforme o estudo em snippet, endpoint, teste, refatoracao ou decisao tecnica.", color: "#9a8cff" },
    { key: "REFINAMENTO", label: "Refinamento", hint: "Nota e ajuste fino", detail: "Revise a saida, remova ruido e registre evidencias ativas antes de consolidar.", color: "#e184c5" },
    { key: "CONSOLIDACAO", label: "Consolidacao", hint: "Flashcards e revisao", detail: "Converta o aprendizado em revisao, flashcards ou criterio de uso futuro.", color: "#78d6a3" },
    { key: "ABSORVIDO", label: "Absorvido", hint: "Retencao validada", detail: "Marque quando conseguir recuperar e transferir o conhecimento sem consulta direta.", color: "#8fd7d2" }
];

const state = {
    cards: [],
    draggedCardId: null,
    pendingMove: null,
    activeCard: null,
    editingCardId: null,
    editingResourceId: null,
    editingEvidenceId: null,
    resources: [],
    evidence: [],
    filters: {
        context: "",
        priority: ""
    }
};

const elements = {
    board: document.querySelector("#board"),
    boardStatus: document.querySelector("#boardStatus"),
    totalCards: document.querySelector("#totalCards"),
    highPriorityCards: document.querySelector("#highPriorityCards"),
    visibleCardsLabel: document.querySelector("#visibleCardsLabel"),
    contextFilter: document.querySelector("#contextFilter"),
    priorityFilter: document.querySelector("#priorityFilter"),
    refreshButton: document.querySelector("#refreshButton"),
    openCreateModalButton: document.querySelector("#openCreateModalButton"),
    modalBackdrop: document.querySelector("#modalBackdrop"),
    modalTitle: document.querySelector("#modalTitle"),
    modalSubtitle: document.querySelector("#modalSubtitle"),
    closeModalButton: document.querySelector("#closeModalButton"),
    cancelCreateButton: document.querySelector("#cancelCreateButton"),
    createCardForm: document.querySelector("#createCardForm"),
    saveCardButton: document.querySelector("#saveCardButton"),
    titleInput: document.querySelector("#titleInput"),
    contextInput: document.querySelector("#contextInput"),
    priorityInput: document.querySelector("#priorityInput"),
    descriptionInput: document.querySelector("#descriptionInput"),
    languagesInput: document.querySelector("#languagesInput"),
    typesInput: document.querySelector("#typesInput"),
    formFeedback: document.querySelector("#formFeedback"),
    moveModalBackdrop: document.querySelector("#moveModalBackdrop"),
    closeMoveModalButton: document.querySelector("#closeMoveModalButton"),
    cancelMoveButton: document.querySelector("#cancelMoveButton"),
    moveCardForm: document.querySelector("#moveCardForm"),
    moveModalSubtitle: document.querySelector("#moveModalSubtitle"),
    moveFromStage: document.querySelector("#moveFromStage"),
    moveToStage: document.querySelector("#moveToStage"),
    moveEvidenceWarning: document.querySelector("#moveEvidenceWarning"),
    moveReasonInput: document.querySelector("#moveReasonInput"),
    moveFormFeedback: document.querySelector("#moveFormFeedback"),
    detailModalBackdrop: document.querySelector("#detailModalBackdrop"),
    deleteCardButton: document.querySelector("#deleteCardButton"),
    editCardButton: document.querySelector("#editCardButton"),
    closeDetailModalButton: document.querySelector("#closeDetailModalButton"),
    detailModalContext: document.querySelector("#detailModalContext"),
    detailModalTitle: document.querySelector("#detailModalTitle"),
    detailModalSubtitle: document.querySelector("#detailModalSubtitle"),
    detailProgressLabel: document.querySelector("#detailProgressLabel"),
    detailProgressValue: document.querySelector("#detailProgressValue"),
    detailProgressBar: document.querySelector("#detailProgressBar"),
    resourcesCount: document.querySelector("#resourcesCount"),
    resourcesList: document.querySelector("#resourcesList"),
    resourceForm: document.querySelector("#resourceForm"),
    resourceTypeInput: document.querySelector("#resourceTypeInput"),
    resourceTitleInput: document.querySelector("#resourceTitleInput"),
    resourceUrlInput: document.querySelector("#resourceUrlInput"),
    resourceNotesInput: document.querySelector("#resourceNotesInput"),
    resourceFormTitle: document.querySelector("#resourceFormTitle"),
    cancelResourceEditButton: document.querySelector("#cancelResourceEditButton"),
    saveResourceButton: document.querySelector("#saveResourceButton"),
    evidenceCount: document.querySelector("#evidenceCount"),
    evidenceList: document.querySelector("#evidenceList"),
    evidenceForm: document.querySelector("#evidenceForm"),
    evidenceTypeInput: document.querySelector("#evidenceTypeInput"),
    evidenceTitleInput: document.querySelector("#evidenceTitleInput"),
    evidenceContentInput: document.querySelector("#evidenceContentInput"),
    evidenceFormTitle: document.querySelector("#evidenceFormTitle"),
    cancelEvidenceEditButton: document.querySelector("#cancelEvidenceEditButton"),
    saveEvidenceButton: document.querySelector("#saveEvidenceButton"),
    detailFormFeedback: document.querySelector("#detailFormFeedback")
};

document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    renderBoard();
    loadCards();
});

function bindEvents() {
    elements.refreshButton.addEventListener("click", loadCards);
    elements.openCreateModalButton.addEventListener("click", openModal);
    elements.closeModalButton.addEventListener("click", closeModal);
    elements.cancelCreateButton.addEventListener("click", closeModal);
    elements.closeMoveModalButton.addEventListener("click", closeMoveModal);
    elements.cancelMoveButton.addEventListener("click", closeMoveModal);
    elements.editCardButton.addEventListener("click", openEditCardModal);
    elements.deleteCardButton.addEventListener("click", deleteActiveCard);
    elements.closeDetailModalButton.addEventListener("click", closeDetailModal);
    elements.modalBackdrop.addEventListener("click", (event) => {
        if (event.target === elements.modalBackdrop) {
            closeModal();
        }
    });
    elements.moveModalBackdrop.addEventListener("click", (event) => {
        if (event.target === elements.moveModalBackdrop) {
            closeMoveModal();
        }
    });
    elements.detailModalBackdrop.addEventListener("click", (event) => {
        if (event.target === elements.detailModalBackdrop) {
            closeDetailModal();
        }
    });

    elements.contextFilter.addEventListener("input", (event) => {
        state.filters.context = event.target.value.trim().toLowerCase();
        renderBoard();
    });

    elements.priorityFilter.addEventListener("change", (event) => {
        state.filters.priority = event.target.value;
        renderBoard();
    });

    elements.createCardForm.addEventListener("submit", saveCard);
    elements.moveCardForm.addEventListener("submit", confirmPendingMove);
    elements.resourceForm.addEventListener("submit", saveResource);
    elements.evidenceForm.addEventListener("submit", saveEvidence);
    elements.cancelResourceEditButton.addEventListener("click", resetResourceForm);
    elements.cancelEvidenceEditButton.addEventListener("click", resetEvidenceForm);
    elements.resourcesList.addEventListener("click", handleResourceAction);
    elements.evidenceList.addEventListener("click", handleEvidenceAction);
    elements.board.addEventListener("click", handleBoardClick);
    elements.board.addEventListener("dragstart", handleDragStart);
    elements.board.addEventListener("dragend", handleDragEnd);
    elements.board.addEventListener("dragover", handleDragOver);
    elements.board.addEventListener("dragleave", handleDragLeave);
    elements.board.addEventListener("drop", handleDrop);

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") {
            return;
        }

        if (!elements.modalBackdrop.hidden) {
            closeModal();
        }

        if (!elements.moveModalBackdrop.hidden) {
            closeMoveModal();
        }

        if (!elements.detailModalBackdrop.hidden) {
            closeDetailModal();
        }
    });
}

async function moveCard(card, targetStage, reason) {
    setBoardStatus(`Movendo "${card.titulo}" para ${stageLabel(targetStage)}...`);

    try {
        const response = await fetch(API.stageHistory, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({
                cardId: card.id,
                fromEstage: card.estagio,
                toEstage: targetStage,
                razao: reason
            })
        });

        if (!response.ok) {
            throw new Error("Tente mover novamente em alguns instantes.");
        }

        await loadCards();
        setBoardStatus(`"${card.titulo}" movido para ${stageLabel(targetStage)}.`);
    } catch (error) {
        setBoardStatus(`Nao foi possivel mover o card. ${error.message}`);
        throw error;
    }
}

async function loadCards() {
    setBoardStatus("Carregando estudos...");

    try {
        const response = await fetch(API.cards, { headers: { Accept: "application/json" } });

        if (!response.ok) {
            throw new Error("Tente atualizar novamente em alguns instantes.");
        }

        state.cards = await response.json();
        setBoardStatus("");
        renderBoard();
    } catch (error) {
        state.cards = [];
        setBoardStatus(`Nao foi possivel carregar seus estudos. ${error.message}`);
        renderBoard();
    }
}

async function saveCard(event) {
    event.preventDefault();
    clearFormErrors();

    const payload = buildPayload();
    const validationErrors = validatePayload(payload);

    if (validationErrors.length > 0) {
        showValidationErrors(validationErrors);
        return;
    }

    elements.formFeedback.textContent = "";

    try {
        const isEditing = state.editingCardId !== null;
        const response = await fetch(isEditing ? `${API.cards}/${state.editingCardId}` : API.cards, {
            method: isEditing ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Revise os dados e tente ${isEditing ? "salvar" : "criar"} novamente.`);
        }

        const savedCard = await response.json();
        if (isEditing) {
            state.cards = state.cards.map((card) => card.id === savedCard.id ? savedCard : card);
            state.activeCard = savedCard;
            setBoardStatus(`"${savedCard.titulo}" atualizado.`);
        } else {
            state.cards = [savedCard, ...state.cards];
        }
        closeModal();
        renderBoard();
    } catch (error) {
        elements.formFeedback.textContent = `Nao foi possivel salvar o estudo. ${error.message}`;
    }
}

function buildPayload() {
    const editingCard = state.editingCardId !== null
        ? state.cards.find((card) => card.id === state.editingCardId)
        : null;

    return {
        titulo: elements.titleInput.value.trim(),
        contexto: elements.contextInput.value.trim(),
        prioridade: elements.priorityInput.value,
        descricao: emptyToNull(elements.descriptionInput.value),
        estagio: editingCard?.estagio || "GATILHO",
        orderIndex: editingCard?.orderIndex || 0,
        tags: [
            ...parseTags(elements.languagesInput.value, "LINGUAGEM"),
            ...parseTags(elements.typesInput.value, "TIPO")
        ]
    };
}

function validatePayload(payload) {
    const errors = [];

    if (!payload.titulo) {
        errors.push({ field: "titulo", message: "Informe um titulo." });
    }

    if (!payload.contexto) {
        errors.push({ field: "contexto", message: "Informe um contexto." });
    }

    if (!payload.prioridade) {
        errors.push({ field: "prioridade", message: "Selecione a prioridade." });
    }

    return errors;
}

function showValidationErrors(errors) {
    errors.forEach((error) => {
        const fieldError = document.querySelector(`[data-error-for="${error.field}"]`);
        if (fieldError) {
            fieldError.textContent = error.message;
        }
    });

    const firstInvalidField = errors[0]?.field;
    const field = elements.createCardForm.querySelector(`[name="${firstInvalidField}"]`);
    field?.focus();
}

function clearFormErrors() {
    document.querySelectorAll(".field-error").forEach((element) => {
        element.textContent = "";
    });
    elements.formFeedback.textContent = "";
}

function parseTags(value, categoria) {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((valor) => ({ categoria, valor }));
}

function emptyToNull(value) {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function renderBoard() {
    const visibleCards = getVisibleCards();
    const cardsByStage = groupCardsByStage(visibleCards);

    elements.totalCards.textContent = state.cards.length;
    elements.highPriorityCards.textContent = state.cards.filter((card) => card.prioridade === "ALTA").length;
    elements.visibleCardsLabel.textContent = visibleCards.length;

    elements.board.innerHTML = "";

    STAGES.forEach((stage) => {
        const cards = cardsByStage[stage.key] || [];
        const column = document.createElement("article");
        column.className = "stage-column";
        column.dataset.stage = stage.key;
        column.style.setProperty("--stage-color", stage.color);
        column.innerHTML = `
            <header class="stage-header">
                <div>
                    <h3 class="stage-title">
                        <span>${stage.label}</span>
                        <button class="tooltip-button" type="button" aria-label="${escapeHtml(stage.detail)}">?</button>
                        <span class="stage-tooltip" role="tooltip">${escapeHtml(stage.detail)}</span>
                    </h3>
                    <p class="stage-hint">${stage.hint}</p>
                </div>
                <span class="stage-count">${cards.length}</span>
            </header>
            <div class="card-list" data-stage="${stage.key}"></div>
        `;

        const list = column.querySelector(".card-list");

        if (cards.length === 0) {
            const empty = document.createElement("div");
            empty.className = "empty-stage";
            empty.textContent = "Sem estudos";
            list.appendChild(empty);
        } else {
            cards
                .sort(sortCards)
                .forEach((card) => list.appendChild(renderCard(card)));
        }

        elements.board.appendChild(column);
    });
}

function renderCard(card) {
    const article = document.createElement("article");
    article.className = "study-card";
    article.dataset.priority = card.prioridade;
    article.dataset.cardId = card.id;
    article.draggable = true;
    article.tabIndex = 0;
    article.setAttribute("aria-label", `${card.titulo}. Arraste para outro stage para movimentar.`);

    const description = card.descricao
        ? `<p class="card-description">${escapeHtml(card.descricao)}</p>`
        : "";
    const progress = cardProgress(card.estagio);

    article.innerHTML = `
        <div class="card-topline">
            <span class="priority-dot" aria-hidden="true"></span>
            <span class="card-context">${escapeHtml(card.contexto)}</span>
        </div>
        <h3 class="card-title">${escapeHtml(card.titulo)}</h3>
        ${description}
        <div class="card-meta">
            <span class="pill priority-${card.prioridade.toLowerCase()}">${priorityLabel(card.prioridade)}</span>
            ${renderTagPills(card.tags)}
        </div>
        <div class="card-progress" aria-label="Progresso ${progress.percent}%">
            <div class="progress-label-row">
                <span>${stageLabel(card.estagio)}</span>
                <strong>${progress.percent}%</strong>
            </div>
            <div class="progress-track"><span style="width: ${progress.percent}%"></span></div>
        </div>
        <button class="card-detail-button icon-action" type="button" aria-label="Abrir detalhes" data-tooltip="Detalhes">
            <span class="icon detail-icon" aria-hidden="true"></span>
        </button>
    `;

    return article;
}

function handleBoardClick(event) {
    const button = event.target.closest(".card-detail-button");
    if (!button) {
        return;
    }

    const cardElement = button.closest(".study-card");
    const card = state.cards.find((item) => item.id === Number(cardElement?.dataset.cardId));

    if (card) {
        openCardDetail(card);
    }
}

function handleDragStart(event) {
    const cardElement = event.target.closest(".study-card");
    if (!cardElement) {
        return;
    }

    state.draggedCardId = Number(cardElement.dataset.cardId);
    cardElement.classList.add("is-dragging");
    elements.board.classList.add("is-drag-active");

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(state.draggedCardId));
}

function handleDragEnd() {
    state.draggedCardId = null;
    elements.board.classList.remove("is-drag-active");
    document.querySelectorAll(".stage-column.is-drop-target").forEach((column) => {
        column.classList.remove("is-drop-target");
    });
    document.querySelectorAll(".study-card.is-dragging").forEach((card) => {
        card.classList.remove("is-dragging");
    });
}

function handleDragOver(event) {
    const column = event.target.closest(".stage-column");
    if (!column || !state.draggedCardId) {
        return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    document.querySelectorAll(".stage-column.is-drop-target").forEach((item) => {
        if (item !== column) {
            item.classList.remove("is-drop-target");
        }
    });
    column.classList.add("is-drop-target");
}

function handleDragLeave(event) {
    const column = event.target.closest(".stage-column");
    if (!column || column.contains(event.relatedTarget)) {
        return;
    }

    column.classList.remove("is-drop-target");
}

async function handleDrop(event) {
    const column = event.target.closest(".stage-column");
    if (!column) {
        return;
    }

    event.preventDefault();
    column.classList.remove("is-drop-target");

    const cardId = Number(event.dataTransfer.getData("text/plain") || state.draggedCardId);
    const card = state.cards.find((item) => item.id === cardId);
    const targetStage = column.dataset.stage;

    if (!card || !targetStage || targetStage === card.estagio) {
        return;
    }

    await openMoveModal(card, targetStage);
}

async function openMoveModal(card, targetStage) {
    state.pendingMove = { card, targetStage };
    elements.moveModalSubtitle.textContent = card.titulo;
    elements.moveFromStage.textContent = stageLabel(card.estagio);
    elements.moveToStage.textContent = stageLabel(targetStage);
    elements.moveReasonInput.value = "";
    elements.moveFormFeedback.textContent = "";
    elements.moveEvidenceWarning.hidden = true;

    if (targetStage === "REFINAMENTO") {
        const evidence = await fetchEvidence(card.id);
        elements.moveEvidenceWarning.hidden = evidence.length > 0;
    }

    elements.moveModalBackdrop.hidden = false;
    elements.moveReasonInput.focus();
}

function closeMoveModal() {
    elements.moveModalBackdrop.hidden = true;
    elements.moveCardForm.reset();
    elements.moveFormFeedback.textContent = "";
    elements.moveEvidenceWarning.hidden = true;
    state.pendingMove = null;
}

async function openCardDetail(card) {
    state.activeCard = card;
    elements.detailModalContext.textContent = card.contexto;
    elements.detailModalTitle.textContent = card.titulo;
    elements.detailModalSubtitle.textContent = card.descricao || "Registre recursos consultados e evidencias produzidas.";
    elements.detailFormFeedback.textContent = "";
    resetResourceForm();
    resetEvidenceForm();
    renderDetailProgress(card);
    elements.detailModalBackdrop.hidden = false;
    await loadCardArtifacts(card.id);
}

function closeDetailModal() {
    elements.detailModalBackdrop.hidden = true;
    resetResourceForm();
    resetEvidenceForm();
    elements.detailFormFeedback.textContent = "";
    state.activeCard = null;
    state.resources = [];
    state.evidence = [];
}

async function deleteActiveCard() {
    if (!state.activeCard) {
        return;
    }

    const card = state.activeCard;
    const confirmed = confirm(`Apagar o card "${card.titulo}" e todos os recursos, evidencias e historico vinculados?`);
    if (!confirmed) {
        return;
    }

    elements.detailFormFeedback.textContent = "";

    const response = await fetch(`${API.cards}/${card.id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" }
    });

    if (!response.ok) {
        elements.detailFormFeedback.textContent = "Nao foi possivel apagar o card. Tente novamente.";
        return;
    }

    state.cards = state.cards.filter((item) => item.id !== card.id);
    closeDetailModal();
    renderBoard();
    setBoardStatus(`"${card.titulo}" apagado.`);
}

async function loadCardArtifacts(cardId) {
    elements.resourcesList.innerHTML = `<div class="empty-stage">Carregando recursos...</div>`;
    elements.evidenceList.innerHTML = `<div class="empty-stage">Carregando evidencias...</div>`;

    try {
        const [resources, evidence] = await Promise.all([
            fetchResources(cardId),
            fetchEvidence(cardId)
        ]);

        state.resources = resources;
        state.evidence = evidence;
        renderResources();
        renderEvidence();
    } catch (error) {
        elements.detailFormFeedback.textContent = `Nao foi possivel carregar o detalhe. ${error.message}`;
    }
}

async function fetchResources(cardId) {
    const response = await fetch(API.resources(cardId), { headers: { Accept: "application/json" } });

    if (!response.ok) {
        throw new Error("Tente abrir o detalhe novamente.");
    }

    return response.json();
}

async function fetchEvidence(cardId) {
    const response = await fetch(API.evidence(cardId), { headers: { Accept: "application/json" } });

    if (!response.ok) {
        throw new Error("Tente consultar as evidencias novamente.");
    }

    return response.json();
}

async function saveResource(event) {
    event.preventDefault();

    if (!state.activeCard) {
        return;
    }

    const payload = {
        cardId: state.activeCard.id,
        tipo: elements.resourceTypeInput.value,
        titulo: elements.resourceTitleInput.value.trim(),
        url: emptyToNull(elements.resourceUrlInput.value),
        observacoes: emptyToNull(elements.resourceNotesInput.value)
    };

    if (!payload.titulo) {
        elements.detailFormFeedback.textContent = "Informe o titulo do recurso.";
        elements.resourceTitleInput.focus();
        return;
    }

    const isEditing = state.editingResourceId !== null;
    const saved = await saveArtifact(
        isEditing ? API.resource(state.activeCard.id, state.editingResourceId) : API.resources(state.activeCard.id),
        payload,
        isEditing ? "PUT" : "POST"
    );
    if (!saved) {
        return;
    }

    state.resources = await fetchResources(state.activeCard.id);
    renderResources();
    resetResourceForm();
}

async function saveEvidence(event) {
    event.preventDefault();

    if (!state.activeCard) {
        return;
    }

    const payload = {
        cardId: state.activeCard.id,
        tipo: elements.evidenceTypeInput.value,
        titulo: elements.evidenceTitleInput.value.trim(),
        conteudo: elements.evidenceContentInput.value.trim()
    };

    if (!payload.titulo || !payload.conteudo) {
        elements.detailFormFeedback.textContent = "Informe titulo e conteudo da evidencia.";
        (!payload.titulo ? elements.evidenceTitleInput : elements.evidenceContentInput).focus();
        return;
    }

    const isEditing = state.editingEvidenceId !== null;
    const saved = await saveArtifact(
        isEditing ? API.evidenceItem(state.activeCard.id, state.editingEvidenceId) : API.evidence(state.activeCard.id),
        payload,
        isEditing ? "PUT" : "POST"
    );
    if (!saved) {
        return;
    }

    state.evidence = await fetchEvidence(state.activeCard.id);
    renderEvidence();
    resetEvidenceForm();
}

async function saveArtifact(url, payload, method) {
    elements.detailFormFeedback.textContent = "";

    const response = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        elements.detailFormFeedback.textContent = "Nao foi possivel salvar. Revise os dados e tente novamente.";
        return false;
    }

    return true;
}

function renderResources() {
    elements.resourcesCount.textContent = state.resources.length;

    if (state.resources.length === 0) {
        elements.resourcesList.innerHTML = `<div class="empty-stage">Nenhum recurso registrado. Comece pelos links e materiais que vao guiar o estudo.</div>`;
        return;
    }

    elements.resourcesList.innerHTML = state.resources
        .map((resource) => `
            <article class="resource-card">
                <div class="artifact-card-main">
                    <div>
                        <span class="artifact-type">${resourceTypeLabel(resource.tipo)}</span>
                        <h4>${escapeHtml(resource.titulo)}</h4>
                    </div>
                    <div class="artifact-actions">
                        ${resource.url ? `<a class="small-icon-button" href="${escapeHtml(resource.url)}" target="_blank" rel="noreferrer" aria-label="Abrir recurso" title="Abrir recurso"><span class="icon external-icon" aria-hidden="true"></span></a>` : ""}
                        <button class="small-icon-button" type="button" data-resource-action="edit" data-resource-id="${resource.id}" aria-label="Editar recurso" title="Editar recurso"><span class="icon edit-icon" aria-hidden="true"></span></button>
                        <button class="small-icon-button danger-icon-button" type="button" data-resource-action="delete" data-resource-id="${resource.id}" aria-label="Apagar recurso" title="Apagar recurso"><span class="icon trash-icon" aria-hidden="true"></span></button>
                    </div>
                </div>
                ${resource.url ? `<a class="resource-url" href="${escapeHtml(resource.url)}" target="_blank" rel="noreferrer">${escapeHtml(resource.url)}</a>` : ""}
                ${resource.observacoes ? `<p>${escapeHtml(resource.observacoes)}</p>` : ""}
            </article>
        `)
        .join("");
}

function renderEvidence() {
    elements.evidenceCount.textContent = state.evidence.length;

    if (state.evidence.length === 0) {
        elements.evidenceList.innerHTML = `<div class="empty-stage">Nenhuma evidencia registrada</div>`;
        return;
    }

    elements.evidenceList.innerHTML = state.evidence
        .map((evidence) => `
            <article class="artifact-item">
                <div class="artifact-card-main">
                    <div>
                        <span class="artifact-type">${evidenceTypeLabel(evidence.tipo)}</span>
                        <h4>${escapeHtml(evidence.titulo)}</h4>
                    </div>
                    <div class="artifact-actions">
                        <button class="small-icon-button" type="button" data-evidence-action="edit" data-evidence-id="${evidence.id}" aria-label="Editar evidencia" title="Editar evidencia"><span class="icon edit-icon" aria-hidden="true"></span></button>
                        <button class="small-icon-button danger-icon-button" type="button" data-evidence-action="delete" data-evidence-id="${evidence.id}" aria-label="Apagar evidencia" title="Apagar evidencia"><span class="icon trash-icon" aria-hidden="true"></span></button>
                    </div>
                </div>
                <div>
                    <p class="${evidence.tipo === "CODIGO" ? "code-evidence" : ""}">${formatTextWithLinks(evidence.conteudo)}</p>
                </div>
            </article>
        `)
        .join("");
}

function resetResourceForm() {
    state.editingResourceId = null;
    elements.resourceForm.reset();
    elements.resourceFormTitle.textContent = "Adicionar recurso";
    elements.saveResourceButton.textContent = "Adicionar recurso";
    elements.cancelResourceEditButton.hidden = true;
}

function resetEvidenceForm() {
    state.editingEvidenceId = null;
    elements.evidenceForm.reset();
    elements.evidenceFormTitle.textContent = "Adicionar evidencia";
    elements.saveEvidenceButton.textContent = "Adicionar evidencia";
    elements.cancelEvidenceEditButton.hidden = true;
}

function handleResourceAction(event) {
    const button = event.target.closest("[data-resource-action]");
    if (!button) {
        return;
    }

    const resourceId = Number(button.dataset.resourceId);
    const resource = state.resources.find((item) => item.id === resourceId);
    if (!resource) {
        return;
    }

    if (button.dataset.resourceAction === "edit") {
        editResource(resource);
        return;
    }

    deleteResource(resource);
}

function editResource(resource) {
    state.editingResourceId = resource.id;
    elements.resourceTypeInput.value = resource.tipo;
    elements.resourceTitleInput.value = resource.titulo;
    elements.resourceUrlInput.value = resource.url || "";
    elements.resourceNotesInput.value = resource.observacoes || "";
    elements.resourceFormTitle.textContent = "Editar recurso";
    elements.saveResourceButton.textContent = "Salvar recurso";
    elements.cancelResourceEditButton.hidden = false;
    elements.resourceTitleInput.focus();
}

async function deleteResource(resource) {
    if (!state.activeCard || !confirm(`Apagar o recurso "${resource.titulo}"?`)) {
        return;
    }

    const deleted = await deleteArtifact(API.resource(state.activeCard.id, resource.id), "Nao foi possivel apagar o recurso.");
    if (!deleted) {
        return;
    }

    state.resources = await fetchResources(state.activeCard.id);
    renderResources();
    if (state.editingResourceId === resource.id) {
        resetResourceForm();
    }
}

function handleEvidenceAction(event) {
    const button = event.target.closest("[data-evidence-action]");
    if (!button) {
        return;
    }

    const evidenceId = Number(button.dataset.evidenceId);
    const evidence = state.evidence.find((item) => item.id === evidenceId);
    if (!evidence) {
        return;
    }

    if (button.dataset.evidenceAction === "edit") {
        editEvidence(evidence);
        return;
    }

    deleteEvidence(evidence);
}

function editEvidence(evidence) {
    state.editingEvidenceId = evidence.id;
    elements.evidenceTypeInput.value = evidence.tipo;
    elements.evidenceTitleInput.value = evidence.titulo;
    elements.evidenceContentInput.value = evidence.conteudo;
    elements.evidenceFormTitle.textContent = "Editar evidencia";
    elements.saveEvidenceButton.textContent = "Salvar evidencia";
    elements.cancelEvidenceEditButton.hidden = false;
    elements.evidenceTitleInput.focus();
}

async function deleteEvidence(evidence) {
    if (!state.activeCard || !confirm(`Apagar a evidencia "${evidence.titulo}"?`)) {
        return;
    }

    const deleted = await deleteArtifact(API.evidenceItem(state.activeCard.id, evidence.id), "Nao foi possivel apagar a evidencia.");
    if (!deleted) {
        return;
    }

    state.evidence = await fetchEvidence(state.activeCard.id);
    renderEvidence();
    if (state.editingEvidenceId === evidence.id) {
        resetEvidenceForm();
    }
}

async function deleteArtifact(url, errorMessage) {
    elements.detailFormFeedback.textContent = "";

    const response = await fetch(url, {
        method: "DELETE",
        headers: { Accept: "application/json" }
    });

    if (!response.ok) {
        elements.detailFormFeedback.textContent = errorMessage;
        return false;
    }

    return true;
}

function renderDetailProgress(card) {
    const progress = cardProgress(card.estagio);
    elements.detailProgressLabel.textContent = stageLabel(card.estagio);
    elements.detailProgressValue.textContent = `${progress.percent}%`;
    elements.detailProgressBar.style.width = `${progress.percent}%`;
}

async function confirmPendingMove(event) {
    event.preventDefault();

    if (!state.pendingMove) {
        closeMoveModal();
        return;
    }

    const { card, targetStage } = state.pendingMove;
    const reason = elements.moveReasonInput.value.trim();

    try {
        await moveCard(card, targetStage, reason);
        closeMoveModal();
    } catch (error) {
        elements.moveFormFeedback.textContent = error.message;
    }
}

function renderTagPills(tags = []) {
    return tags
        .slice(0, 4)
        .map((tag) => `<span class="pill tag-${tag.categoria.toLowerCase()}">${escapeHtml(tag.valor)}</span>`)
        .join("");
}

function getVisibleCards() {
    return state.cards.filter((card) => {
        const matchesContext = !state.filters.context ||
            card.contexto.toLowerCase().includes(state.filters.context);
        const matchesPriority = !state.filters.priority ||
            card.prioridade === state.filters.priority;

        return matchesContext && matchesPriority;
    });
}

function groupCardsByStage(cards) {
    return cards.reduce((accumulator, card) => {
        const stage = card.estagio || "GATILHO";
        accumulator[stage] = accumulator[stage] || [];
        accumulator[stage].push(card);
        return accumulator;
    }, {});
}

function sortCards(first, second) {
    const firstOrder = Number.isFinite(first.orderIndex) ? first.orderIndex : 0;
    const secondOrder = Number.isFinite(second.orderIndex) ? second.orderIndex : 0;

    if (firstOrder !== secondOrder) {
        return firstOrder - secondOrder;
    }

    return String(second.createdAt).localeCompare(String(first.createdAt));
}

function stageLabel(stageKey) {
    return STAGES.find((stage) => stage.key === stageKey)?.label || stageKey;
}

function cardProgress(stageKey) {
    const stageIndex = STAGES.findIndex((stage) => stage.key === stageKey);
    const safeIndex = stageIndex >= 0 ? stageIndex : 0;
    const percent = Math.round(((safeIndex + 1) / STAGES.length) * 100);

    return { index: safeIndex, percent };
}

function priorityLabel(priority) {
    const labels = {
        ALTA: "Alta",
        MEDIA: "Media",
        BAIXA: "Baixa"
    };

    return labels[priority] || priority;
}

function resourceTypeLabel(type) {
    const labels = {
        VIDEO: "Video",
        ARTIGO: "Artigo",
        CURSO: "Curso",
        LIVRO: "Livro",
        DOCUMENTACAO: "Documentacao",
        BUG: "Bug",
        TAREFA: "Tarefa",
        OUTRO: "Outro"
    };

    return labels[type] || type;
}

function evidenceTypeLabel(type) {
    const labels = {
        TEXTO: "Texto",
        CODIGO: "Codigo",
        PERGUNTA_RESPOSTA: "Pergunta e resposta",
        DECISAO_TECNICA: "Decisao tecnica",
        RESUMO_ATIVO: "Resumo ativo",
        CHECKLIST: "Checklist"
    };

    return labels[type] || type;
}

function setBoardStatus(message) {
    elements.boardStatus.textContent = message;
}

function openModal() {
    state.editingCardId = null;
    elements.modalTitle.textContent = "Novo estudo";
    elements.modalSubtitle.textContent = "Registre o problema que iniciou o estudo.";
    elements.saveCardButton.textContent = "Criar estudo";
    elements.createCardForm.reset();
    elements.priorityInput.value = "MEDIA";
    clearFormErrors();
    elements.modalBackdrop.hidden = false;
    elements.titleInput.focus();
}

function openEditCardModal() {
    if (!state.activeCard) {
        return;
    }

    const card = state.activeCard;
    state.editingCardId = card.id;
    elements.modalTitle.textContent = "Editar estudo";
    elements.modalSubtitle.textContent = "Ajuste titulo, contexto, prioridade, descricao e tags.";
    elements.saveCardButton.textContent = "Salvar alteracoes";
    elements.titleInput.value = card.titulo;
    elements.contextInput.value = card.contexto;
    elements.priorityInput.value = card.prioridade;
    elements.descriptionInput.value = card.descricao || "";
    elements.languagesInput.value = tagsByCategory(card.tags, "LINGUAGEM");
    elements.typesInput.value = tagsByCategory(card.tags, "TIPO");
    clearFormErrors();
    closeDetailModal();
    elements.modalBackdrop.hidden = false;
    elements.titleInput.focus();
}

function closeModal() {
    elements.modalBackdrop.hidden = true;
    elements.createCardForm.reset();
    elements.priorityInput.value = "MEDIA";
    state.editingCardId = null;
    elements.modalTitle.textContent = "Novo estudo";
    elements.modalSubtitle.textContent = "Registre o problema que iniciou o estudo.";
    elements.saveCardButton.textContent = "Criar estudo";
    clearFormErrors();
}

function tagsByCategory(tags = [], category) {
    return tags
        .filter((tag) => tag.categoria === category)
        .map((tag) => tag.valor)
        .join(", ");
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatTextWithLinks(value) {
    const urlPattern = /(https?:\/\/[^\s<>"']+)/g;

    return escapeHtml(value).replace(urlPattern, (url) => {
        const cleanUrl = url.replace(/[.,;:!?)]$/, "");
        const trailing = url.slice(cleanUrl.length);

        return `<a class="inline-link" href="${cleanUrl}" target="_blank" rel="noreferrer">${cleanUrl}</a>${trailing}`;
    });
}

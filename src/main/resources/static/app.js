const API = {
    cards: "/api/study-card",
    stageHistory: "/api/stage-history",
    resources: (cardId) => `/api/cards/${cardId}/resources`,
    resource: (cardId, resourceId) => `/api/cards/${cardId}/resources/${resourceId}`,
    evidence: (cardId) => `/api/cards/${cardId}/evidence`,
    evidenceItem: (cardId, evidenceId) => `/api/cards/${cardId}/evidence/${evidenceId}`
};

const STAGES = [
    { key: "TRIAGEM", label: "Capturar", hint: "Defina o card e os materiais", detail: "Transforme o gatilho em um card de estudo acionavel.", color: "#ffb067" },
    { key: "ESTUDO_ATIVO", label: "Estudar", hint: "Entenda e explique", detail: "Leia, compare e explique com suas palavras.", color: "#8fb5ff" },
    { key: "APLICACAO", label: "Praticar", hint: "Teste no projeto", detail: "Aplique em codigo, teste ou entrega concreta.", color: "#9a8cff" },
    { key: "REFINAMENTO", label: "Registrar", hint: "Anote o que aprendeu", detail: "Registre conclusoes e evidencias ativas.", color: "#e184c5" },
    { key: "CONSOLIDACAO", label: "Revisar", hint: "Recupere sem consulta", detail: "Converta em revisao ou flashcards.", color: "#78d6a3" },
    { key: "ABSORVIDO", label: "Consolidado", hint: "Use com autonomia", detail: "Voce consegue recuperar e transferir o conhecimento.", color: "#8fd7d2" }
];

const CARD_DESCRIPTION_LIMIT = 90;

const state = {
    cards: [],
    draggedCardId: null,
    pendingMove: null,
    activeCard: null,
    editingCardId: null,
    creatingStage: "TRIAGEM",
    editingResourceId: null,
    editingEvidenceId: null,
    resources: [],
    evidence: [],
    filters: {
        context: "",
        priority: "",
        stage: ""
    },
    expandedGroups: new Set()
};

const elements = {
    board: document.querySelector("#board"),
    consolidatedBoard: document.querySelector("#consolidatedBoard"),
    consolidatedSection: document.querySelector("#consolidatedSection"),
    studyTimeline: document.querySelector("#studyTimeline"),
    clearStageFilterButton: document.querySelector("#clearStageFilterButton"),
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
    evidencePanel: document.querySelector("#evidencePanel"),
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
    elements.openCreateModalButton.addEventListener("click", () => openModal());
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

    elements.clearStageFilterButton.addEventListener("click", () => {
        state.filters.stage = "";
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
    elements.consolidatedBoard.addEventListener("click", handleBoardClick);
    elements.studyTimeline.addEventListener("click", handleBoardClick);
    elements.board.addEventListener("keydown", handleBoardKeyDown);
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
        estagio: editingCard?.estagio || state.creatingStage,
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
    const activeCards = visibleCards.filter((card) => normalizeStage(card.estagio) !== "ABSORVIDO");
    const consolidatedCards = visibleCards.filter((card) => normalizeStage(card.estagio) === "ABSORVIDO");
    const cardsByGroup = groupCardsByType(activeCards);

    elements.totalCards.textContent = state.cards.length;
    elements.highPriorityCards.textContent = state.cards.filter((card) => card.prioridade === "ALTA").length;
    elements.visibleCardsLabel.textContent = visibleCards.length;
    renderStudyTimeline(visibleCards);
    elements.clearStageFilterButton.hidden = !state.filters.stage;
    elements.clearStageFilterButton.textContent = state.filters.stage
        ? `Mostrando: ${stageLabel(state.filters.stage)}`
        : "Ver todas as etapas";

    renderGroups(elements.board, cardsByGroup, "active");
    elements.consolidatedSection.hidden = consolidatedCards.length === 0;
    if (consolidatedCards.length > 0) {
        renderGroups(elements.consolidatedBoard, groupCardsByType(consolidatedCards), "consolidated");
    } else {
        elements.consolidatedBoard.innerHTML = "";
    }
}

function renderGroups(container, cardsByGroup, groupKind) {
    container.innerHTML = "";
    const groups = Object.entries(cardsByGroup).sort(([first], [second]) => first.localeCompare(second, "pt-BR"));
    if (groups.length === 0) {
        container.innerHTML = `<div class="empty-board">${groupKind === "consolidated" ? "Nenhum card consolidado neste filtro." : "Nenhum card encontrado com estes filtros."}</div>`;
        return;
    }

    groups.forEach(([groupName, cards]) => {
        const groupKey = `${groupKind}:${groupName}`;
        const orderedCards = cards.sort(sortStudyPlanCards);
        const visibleCards = state.expandedGroups.has(groupKey) ? orderedCards : orderedCards.slice(0, 6);
        const hiddenCount = orderedCards.length - visibleCards.length;
        const group = document.createElement("section");
        group.className = "study-group";
        group.dataset.studyType = groupName;
        group.innerHTML = `
            <header class="study-group-header">
                <div>
                    <p class="group-kicker">Gatilho / assunto</p>
                    <h3>${escapeHtml(groupName)}</h3>
                </div>
                <div class="group-actions">
                    <span class="group-count">${orderedCards.length}</span>
                    ${groupKind === "active" ? `<button class="group-add-button" type="button" data-study-type="${escapeHtml(groupName)}" aria-label="Adicionar card em ${escapeHtml(groupName)}" title="Adicionar card">+</button>` : ""}
                </div>
            </header>
            <div class="study-row"></div>
            ${hiddenCount > 0 ? `<button class="show-more-button" type="button" data-group-key="${escapeHtml(groupKey)}">Ver mais ${hiddenCount} cards</button>` : ""}
        `;
        const row = group.querySelector(".study-row");
        visibleCards.forEach((card) => row.appendChild(renderCard(card)));
        container.appendChild(group);
    });
}

function renderCard(card) {
    const article = document.createElement("article");
    article.className = "study-card";
    article.dataset.priority = card.prioridade;
    article.dataset.cardId = card.id;
    article.draggable = false;
    article.tabIndex = 0;
    article.setAttribute("aria-label", `${card.titulo}. Etapa atual: ${stageLabel(card.estagio)}.`);

    const description = card.descricao
        ? renderCardDescription(card.descricao)
        : "";
    const progress = cardProgress(normalizeStage(card.estagio));

    article.innerHTML = `
        <div class="card-topline">
            <span class="priority-dot" aria-hidden="true"></span>
            <span class="card-context">${escapeHtml(card.contexto)}</span>
            <span class="card-stage">${stageLabel(card.estagio)} · ${progress.index + 1}/6</span>
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
        <div class="card-actions">
            ${renderOrderControls(card)}
            <button class="card-detail-button" type="button">Abrir</button>
            ${nextStageButton(card)}
        </div>
    `;

    return article;
}

function handleBoardClick(event) {
    const timelineStep = event.target.closest(".timeline-step");
    if (timelineStep) {
        const stage = timelineStep.dataset.stage;
        state.filters.stage = state.filters.stage === stage ? "" : stage;
        renderBoard();
        return;
    }

    const showMoreButton = event.target.closest(".show-more-button");
    if (showMoreButton) {
        state.expandedGroups.add(showMoreButton.dataset.groupKey);
        renderBoard();
        return;
    }

    const orderButton = event.target.closest(".card-order-button");
    if (orderButton) {
        const cardElement = orderButton.closest(".study-card");
        const card = state.cards.find((item) => item.id === Number(cardElement?.dataset.cardId));
        if (card) {
            reorderCard(card, orderButton.dataset.direction);
        }
        return;
    }
    const groupAddButton = event.target.closest(".group-add-button");
    if (groupAddButton) {
        openModal("TRIAGEM", groupAddButton.dataset.studyType);
        return;
    }

    const moveButton = event.target.closest(".card-next-button");
    if (moveButton) {
        const cardElement = moveButton.closest(".study-card");
        const card = state.cards.find((item) => item.id === Number(cardElement?.dataset.cardId));
        if (card) {
            openMoveModal(card, moveButton.dataset.nextStage);
        }
        return;
    }

    const button = event.target.closest(".card-detail-button");
    if (button) {
        const cardElement = button.closest(".study-card");
        const card = state.cards.find((item) => item.id === Number(cardElement?.dataset.cardId));

        if (card) {
            openCardDetail(card);
        }

        return;
    }

    const cardElement = event.target.closest(".study-card");
    if (cardElement) {
        const card = state.cards.find((item) => item.id === Number(cardElement.dataset.cardId));
        if (card) {
            openCardDetail(card);
        }
        return;
    }

    if (shouldIgnoreColumnCreateClick(event.target)) {
        return;
    }

    const column = event.target.closest(".stage-column");
    if (column?.dataset.stage) {
        openModal(column.dataset.stage);
    }
}

function handleBoardKeyDown(event) {
    if (event.key !== "Enter" && event.key !== " ") {
        return;
    }

    const column = event.target.closest(".stage-column");
    if (!column || event.target !== column || !column.dataset.stage) {
        return;
    }

    event.preventDefault();
    openModal(column.dataset.stage);
}

function shouldIgnoreColumnCreateClick(target) {
    return Boolean(target.closest(".study-card, button, a, input, select, textarea, label"));
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

    if (isEvidenceStage(card.estagio) && targetStage === "CONSOLIDACAO") {
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
    renderEvidenceAvailability(card);
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
    elements.evidencePanel.hidden = false;
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
    const shouldLoadEvidence = shouldShowEvidencePanel();
    if (shouldLoadEvidence) {
        elements.evidenceList.innerHTML = `<div class="empty-stage">Carregando evidencias...</div>`;
    }

    try {
        const [resources, evidence] = await Promise.all([
            fetchResources(cardId),
            shouldLoadEvidence ? fetchEvidence(cardId) : Promise.resolve([])
        ]);

        state.resources = resources;
        state.evidence = evidence;
        renderResources();
        if (shouldLoadEvidence) {
            renderEvidence();
        }
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

    if (!state.activeCard || !shouldShowEvidencePanel()) {
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

function renderEvidenceAvailability(card) {
    const isAvailable = isEvidenceStage(card.estagio);
    elements.evidencePanel.hidden = !isAvailable;

    if (!isAvailable) {
        state.evidence = [];
        elements.evidenceCount.textContent = "0";
        elements.evidenceList.innerHTML = "";
    }
}

function shouldShowEvidencePanel() {
    return Boolean(state.activeCard && isEvidenceStage(state.activeCard.estagio));
}

function isEvidenceStage(stageKey) {
    return normalizeStage(stageKey) === "REFINAMENTO";
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
    const progress = cardProgress(normalizeStage(card.estagio));
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

function renderCardDescription(description) {
    const normalizedDescription = normalizeWhitespace(description);
    const shouldTruncate = normalizedDescription.length > CARD_DESCRIPTION_LIMIT;
    const visibleDescription = shouldTruncate
        ? `${normalizedDescription.slice(0, CARD_DESCRIPTION_LIMIT).trimEnd()}...`
        : normalizedDescription;

    return `
        <p class="card-description" title="${escapeHtml(normalizedDescription)}" aria-label="${escapeHtml(normalizedDescription)}">
            ${escapeHtml(visibleDescription)}
        </p>
    `;
}

function getVisibleCards() {
    return state.cards.filter((card) => {
        const searchableText = [card.titulo, card.contexto, card.descricao, ...(card.tags || []).map((tag) => tag.valor)]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
        const matchesContext = !state.filters.context || searchableText.includes(state.filters.context);
        const matchesPriority = !state.filters.priority ||
            card.prioridade === state.filters.priority;
        const matchesStage = !state.filters.stage || normalizeStage(card.estagio) === state.filters.stage;

        return matchesContext && matchesPriority && matchesStage;
    });
}

function groupCardsByType(cards) {
    return cards.reduce((accumulator, card) => {
        const type = card.tags?.find((tag) => tag.categoria === "TIPO")?.valor || card.contexto || "Sem tipo";
        accumulator[type] = accumulator[type] || [];
        accumulator[type].push(card);
        return accumulator;
    }, {});
}

function renderStudyTimeline(cards) {
    if (!elements.studyTimeline) {
        return;
    }

    const counts = cards.reduce((result, card) => {
        const stage = normalizeStage(card.estagio);
        result[stage] = (result[stage] || 0) + 1;
        return result;
    }, {});
    const activeStageIndex = STAGES.findIndex((stage) => counts[stage.key] > 0);

    elements.studyTimeline.innerHTML = STAGES.map((stage, index) => `
        <button class="timeline-step ${state.filters.stage === stage.key ? "is-selected" : ""} ${index === activeStageIndex ? "is-current" : ""}" type="button" data-stage="${stage.key}" style="--stage-color: ${stage.color}" aria-pressed="${state.filters.stage === stage.key}">
            <span class="timeline-marker">${index + 1}</span>
            <div>
                <strong>${stage.label}</strong>
                <span>${stage.hint}</span>
            </div>
        </button>
    `).join("");
}

function renderOrderControls(card) {
    if (normalizeStage(card.estagio) === "ABSORVIDO") {
        return "";
    }

    const groupCards = groupCardsByType(state.cards.filter((item) =>
        normalizeStage(item.estagio) === normalizeStage(card.estagio) &&
        normalizeStage(item.estagio) !== "ABSORVIDO"
    ));
    const groupName = card.tags?.find((tag) => tag.categoria === "TIPO")?.valor || card.contexto || "Sem tipo";
    const siblings = (groupCards[groupName] || []).sort(sortCards);
    const index = siblings.findIndex((item) => item.id === card.id);

    return `<div class="card-order-controls" aria-label="Ordenar card">
        <button class="card-order-button" type="button" data-direction="up" aria-label="Mover card para cima" ${index <= 0 ? "disabled" : ""}>&#8593;</button>
        <button class="card-order-button" type="button" data-direction="down" aria-label="Mover card para baixo" ${index < 0 || index === siblings.length - 1 ? "disabled" : ""}>&#8595;</button>
    </div>`;
}

async function reorderCard(card, direction) {
    const groupName = card.tags?.find((tag) => tag.categoria === "TIPO")?.valor || card.contexto || "Sem tipo";
    const stage = normalizeStage(card.estagio);
    const siblings = (groupCardsByType(state.cards.filter((item) =>
        normalizeStage(item.estagio) === stage &&
        (item.tags?.find((tag) => tag.categoria === "TIPO")?.valor || item.contexto || "Sem tipo") === groupName
    ))[groupName] || []).sort(sortCards);
    const currentIndex = siblings.findIndex((item) => item.id === card.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= siblings.length) {
        return;
    }

    [siblings[currentIndex], siblings[targetIndex]] = [siblings[targetIndex], siblings[currentIndex]];
    setBoardStatus("Salvando nova ordem...");

    try {
        const savedCards = await Promise.all(siblings.map(async (item, index) => {
            const response = await fetch(`${API.cards}/${item.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(cardPayload(item, index))
            });
            if (!response.ok) {
                throw new Error("Nao foi possivel salvar a nova ordem.");
            }
            return response.json();
        }));

        state.cards = state.cards.map((item) => savedCards.find((saved) => saved.id === item.id) || item);
        setBoardStatus("Ordem atualizada.");
        renderBoard();
    } catch (error) {
        setBoardStatus(error.message);
    }
}

function cardPayload(card, orderIndex) {
    return {
        titulo: card.titulo,
        contexto: card.contexto,
        prioridade: card.prioridade,
        descricao: card.descricao,
        estagio: card.estagio,
        orderIndex,
        tags: card.tags.map((tag) => ({ categoria: tag.categoria, valor: tag.valor }))
    };
}

function nextStageButton(card) {
    const currentIndex = STAGES.findIndex((stage) => stage.key === normalizeStage(card.estagio));
    const nextStage = STAGES[currentIndex + 1];
    if (!nextStage) {
        return "";
    }

    return `<button class="card-next-button" type="button" data-next-stage="${nextStage.key}">Avancar</button>`;
}

function sortCards(first, second) {
    const firstOrder = Number.isFinite(first.orderIndex) ? first.orderIndex : 0;
    const secondOrder = Number.isFinite(second.orderIndex) ? second.orderIndex : 0;

    if (firstOrder !== secondOrder) {
        return firstOrder - secondOrder;
    }

    return String(second.createdAt).localeCompare(String(first.createdAt));
}

function sortStudyPlanCards(first, second) {
    const firstStage = STAGES.findIndex((stage) => stage.key === normalizeStage(first.estagio));
    const secondStage = STAGES.findIndex((stage) => stage.key === normalizeStage(second.estagio));

    if (firstStage !== secondStage) {
        return firstStage - secondStage;
    }

    return sortCards(first, second);
}

function stageLabel(stageKey) {
    return STAGES.find((stage) => stage.key === normalizeStage(stageKey))?.label || stageKey;
}

function cardProgress(stageKey) {
    const stageIndex = STAGES.findIndex((stage) => stage.key === normalizeStage(stageKey));
    const safeIndex = stageIndex >= 0 ? stageIndex : 0;
    const percent = Math.round(((safeIndex + 1) / STAGES.length) * 100);

    return { index: safeIndex, percent };
}

function normalizeStage(stageKey) {
    if (stageKey === "GATILHO" || stageKey === "CAPTURA" || !stageKey) {
        return "TRIAGEM";
    }

    return stageKey;
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

function openModal(targetStage = "TRIAGEM", suggestedType = "") {
    const normalizedStage = normalizeStage(targetStage);
    state.editingCardId = null;
    state.creatingStage = normalizedStage;
    elements.modalTitle.textContent = "Novo card de estudo";
    elements.modalSubtitle.textContent = `Comece em ${stageLabel(normalizedStage)} e avance o card conforme praticar e registrar o que aprendeu.`;
    elements.saveCardButton.textContent = "Criar card";
    elements.createCardForm.reset();
    elements.priorityInput.value = "MEDIA";
    elements.contextInput.value = "Geral";
    elements.typesInput.value = suggestedType;
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
    elements.modalTitle.textContent = "Editar card";
    elements.modalSubtitle.textContent = "Ajuste o card e mantenha-o no assunto certo.";
    elements.saveCardButton.textContent = "Salvar alteracoes";
    elements.titleInput.value = card.titulo;
    elements.contextInput.value = card.contexto;
    elements.priorityInput.value = card.prioridade;
    elements.descriptionInput.value = card.descricao || "";
    elements.languagesInput.value = tagsByCategory(card.tags, "LINGUAGEM");
    elements.typesInput.value = tagsByCategory(card.tags, "TIPO");
    elements.createCardForm.querySelector(".form-details").open = true;
    clearFormErrors();
    closeDetailModal();
    elements.modalBackdrop.hidden = false;
    elements.titleInput.focus();
}

function closeModal() {
    elements.modalBackdrop.hidden = true;
    elements.createCardForm.reset();
    elements.priorityInput.value = "MEDIA";
    elements.contextInput.value = "Geral";
    elements.createCardForm.querySelector(".form-details").open = false;
    state.creatingStage = "TRIAGEM";
    state.editingCardId = null;
    elements.modalTitle.textContent = "Novo card de estudo";
    elements.modalSubtitle.textContent = "Registre o proximo ponto que voce quer estudar.";
    elements.saveCardButton.textContent = "Criar card";
    clearFormErrors();
}

function tagsByCategory(tags = [], category) {
    return tags
        .filter((tag) => tag.categoria === category)
        .map((tag) => tag.valor)
        .join(", ");
}

function normalizeWhitespace(value) {
    return String(value).replace(/\s+/g, " ").trim();
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

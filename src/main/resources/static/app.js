const API = {
    cards: "/api/study-card"
};

const STAGES = [
    { key: "GATILHO", label: "Gatilho", hint: "Problema percebido" },
    { key: "CAPTURA", label: "Captura", hint: "Escopo e materiais" },
    { key: "ESTUDO_ATIVO", label: "Estudo ativo", hint: "Entendimento guiado" },
    { key: "APLICACAO", label: "Aplicacao", hint: "Codigo ou entrega" },
    { key: "REFINAMENTO", label: "Refinamento", hint: "Nota e ajuste fino" },
    { key: "CONSOLIDACAO", label: "Consolidacao", hint: "Flashcards e revisao" },
    { key: "ABSORVIDO", label: "Absorvido", hint: "Retencao validada" }
];

const state = {
    cards: [],
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
    closeModalButton: document.querySelector("#closeModalButton"),
    cancelCreateButton: document.querySelector("#cancelCreateButton"),
    createCardForm: document.querySelector("#createCardForm"),
    titleInput: document.querySelector("#titleInput"),
    contextInput: document.querySelector("#contextInput"),
    priorityInput: document.querySelector("#priorityInput"),
    descriptionInput: document.querySelector("#descriptionInput"),
    languagesInput: document.querySelector("#languagesInput"),
    typesInput: document.querySelector("#typesInput"),
    formFeedback: document.querySelector("#formFeedback")
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
    elements.modalBackdrop.addEventListener("click", (event) => {
        if (event.target === elements.modalBackdrop) {
            closeModal();
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

    elements.createCardForm.addEventListener("submit", createCard);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !elements.modalBackdrop.hidden) {
            closeModal();
        }
    });
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

async function createCard(event) {
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
        const response = await fetch(API.cards, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error("Revise os dados e tente novamente.");
        }

        const createdCard = await response.json();
        state.cards = [createdCard, ...state.cards];
        closeModal();
        renderBoard();
    } catch (error) {
        elements.formFeedback.textContent = `Nao foi possivel criar o estudo. ${error.message}`;
    }
}

function buildPayload() {
    return {
        titulo: elements.titleInput.value.trim(),
        contexto: elements.contextInput.value.trim(),
        prioridade: elements.priorityInput.value,
        descricao: emptyToNull(elements.descriptionInput.value),
        estagio: "GATILHO",
        orderIndex: 0,
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
        column.innerHTML = `
            <header class="stage-header">
                <div>
                    <h3 class="stage-title">${stage.label}</h3>
                    <p class="stage-hint">${stage.hint}</p>
                </div>
                <span class="stage-count">${cards.length}</span>
            </header>
            <div class="card-list"></div>
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

    const description = card.descricao
        ? `<p class="card-description">${escapeHtml(card.descricao)}</p>`
        : "";

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
    `;

    return article;
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

function priorityLabel(priority) {
    const labels = {
        ALTA: "Alta",
        MEDIA: "Media",
        BAIXA: "Baixa"
    };

    return labels[priority] || priority;
}

function setBoardStatus(message) {
    elements.boardStatus.textContent = message;
}

function openModal() {
    elements.modalBackdrop.hidden = false;
    elements.titleInput.focus();
}

function closeModal() {
    elements.modalBackdrop.hidden = true;
    elements.createCardForm.reset();
    elements.priorityInput.value = "MEDIA";
    clearFormErrors();
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

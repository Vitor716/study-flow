const API = {
    cards: "/api/study-card",
    cardImport: "/api/study-card/import",
    cardDeleteBatch: "/api/study-card/delete-batch",
    obsidianConfig: "/api/obsidian/config",
    ankiConfig: "/api/anki/config",
    ankiStatus: "/api/anki/status",
    backupConfig: "/api/backup/config",
    exportJson: "/api/backup/export-json",
    exportMarkdown: "/api/backup/export-markdown",
    backupSqlite: "/api/backup/sqlite",
    commitExports: "/api/backup/commit",
    pushBackup: "/api/backup/push",
    importPreview: "/api/backup/import/preview",
    importSnapshot: "/api/backup/import",
    obsidianNote: (cardId) => `/api/cards/${cardId}/obsidian-note`,
    openObsidian: (cardId) => `/api/cards/${cardId}/open-obsidian`,
    stageHistory: "/api/stage-history",
    resources: (cardId) => `/api/cards/${cardId}/resources`,
    resource: (cardId, resourceId) => `/api/cards/${cardId}/resources/${resourceId}`,
    evidence: (cardId) => `/api/cards/${cardId}/evidence`,
    evidenceItem: (cardId, evidenceId) => `/api/cards/${cardId}/evidence/${evidenceId}`,
    manualFlashcards: (cardId) => `/api/cards/${cardId}/manual-flashcards`,
    checklist: (cardId) => `/api/cards/${cardId}/consolidation-checklist`,
    ankiNotes: (cardId) => `/api/cards/${cardId}/anki-notes`,
    ankiMature: (cardId) => `/api/cards/${cardId}/anki-notes/sync-mature`,
    reviewDone: (cardId) => `/api/cards/${cardId}/review/done`,
    reviewSkip: (cardId) => `/api/cards/${cardId}/review/skip`,
    reviewSuggestions: "/api/reviews/suggestions"
};

const STAGES = [
    { key: "TRIAGEM", label: "Capturar", hint: "Defina o card e os materiais", detail: "Transforme o gatilho em um card de estudo acionavel.", color: "#ffb067" },
    { key: "ESTUDO_ATIVO", label: "Estudar", hint: "Entenda e explique", detail: "Leia, compare e explique com suas palavras.", color: "#8fb5ff" },
    { key: "APLICACAO", label: "Praticar", hint: "Teste no projeto", detail: "Aplique em codigo, teste ou entrega concreta.", color: "#9a8cff" },
    { key: "REFINAMENTO", label: "Registrar", hint: "Anote o que aprendeu", detail: "Registre conclusoes e evidencias ativas.", color: "#e184c5" },
    { key: "CONSOLIDACAO", label: "Revisar", hint: "Recupere sem consulta", detail: "Converta em revisao ou flashcards.", color: "#78d6a3" },
    { key: "ABSORVIDO", label: "Consolidado", hint: "Use com autonomia", detail: "Voce consegue recuperar e transferir o conhecimento.", color: "#8fd7d2" }
];

const STAGE_GUIDANCE = {
    TRIAGEM: { title: "Defina um ponto de partida", description: "Escolha um objetivo pequeno e os materiais que vao orientar seu estudo.", next: "Comecar a estudar", checklist: ["Escreva o objetivo em uma frase.", "Adicione ao menos um material ou tarefa."] },
    ESTUDO_ATIVO: { title: "Estude com uma saida em mente", description: "Consuma o material para responder ou explicar algo com suas proprias palavras.", next: "Levar para pratica", checklist: ["Use os materiais selecionados.", "Defina uma pratica pequena para testar o entendimento."] },
    APLICACAO: { title: "Transforme entendimento em pratica", description: "Teste a ideia em codigo, exemplo, decisao ou comparacao concreta.", next: "Registrar resultado", checklist: ["Produza um resultado observavel.", "Registre uma evidencia ativa antes de seguir."] },
    REFINAMENTO: { title: "Registre o que voce aprendeu", description: "Sintetize a conclusao para recuperar a ideia sem consultar a fonte.", next: "Preparar revisao", checklist: ["Salve uma evidencia ativa.", "Opcional: crie uma nota de estudo no Obsidian."] },
    CONSOLIDACAO: { title: "Prepare a recuperacao", description: "Converta o essencial em flashcards e acompanhe a proxima revisao sem criar divida.", next: "Marcar como consolidado", checklist: ["Crie ou registre seus flashcards.", "Revise quando o card entrar na fila sugerida."] },
    ABSORVIDO: { title: "Conhecimento consolidado", description: "Voce consegue recuperar e aplicar esta ideia em um contexto novo.", next: "Consolidado", checklist: ["Mantenha este card como referencia.", "Volte ao fluxo se precisar aprofundar."] }
};

const CARD_DESCRIPTION_LIMIT = 90;

const state = {
    cards: [],
    reorderingCardId: null,
    collapsedGroups: new Set(),
    bulkDeleteMode: false,
    selectedCardIds: new Set(),
    draggedCardId: null,
    pendingMove: null,
    activeCard: null,
    editingCardId: null,
    creatingStage: "TRIAGEM",
    editingResourceId: null,
    editingEvidenceId: null,
    resources: [],
    evidence: [],
    obsidianConfig: null,
    ankiConfig: null,
    backupConfig: null,
    checklist: null,
    ankiNotes: [],
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
    nextActionTitle: document.querySelector("#nextActionTitle"),
    nextActionDescription: document.querySelector("#nextActionDescription"),
    nextActionButton: document.querySelector("#nextActionButton"),
    contextFilter: document.querySelector("#contextFilter"),
    priorityFilter: document.querySelector("#priorityFilter"),
    refreshButton: document.querySelector("#refreshButton"),
    openCreateModalButton: document.querySelector("#openCreateModalButton"),
    openImportJsonButton: document.querySelector("#openImportJsonButton"),
    openTagsButton: document.querySelector("#openTagsButton"),
    toggleBulkDeleteButton: document.querySelector("#toggleBulkDeleteButton"),
    deleteSelectedCardsButton: document.querySelector("#deleteSelectedCardsButton"),
    importJsonBackdrop: document.querySelector("#importJsonBackdrop"),
    closeImportJsonButton: document.querySelector("#closeImportJsonButton"),
    cancelImportJsonButton: document.querySelector("#cancelImportJsonButton"),
    fillImportJsonExampleButton: document.querySelector("#fillImportJsonExampleButton"),
    importJsonForm: document.querySelector("#importJsonForm"),
    importJsonFileInput: document.querySelector("#importJsonFileInput"),
    importJsonInput: document.querySelector("#importJsonInput"),
    importJsonFeedback: document.querySelector("#importJsonFeedback"),
    submitImportJsonButton: document.querySelector("#submitImportJsonButton"),
    tagsBackdrop: document.querySelector("#tagsBackdrop"),
    closeTagsButton: document.querySelector("#closeTagsButton"),
    tagsSummary: document.querySelector("#tagsSummary"),
    tagsFilterInput: document.querySelector("#tagsFilterInput"),
    tagsList: document.querySelector("#tagsList"),
    openAnkiConfigButton: document.querySelector("#openAnkiConfigButton"),
    openBackupConfigButton: document.querySelector("#openBackupConfigButton"),
    backupConfigBackdrop: document.querySelector("#backupConfigBackdrop"),
    closeBackupConfigButton: document.querySelector("#closeBackupConfigButton"),
    cancelBackupConfigButton: document.querySelector("#cancelBackupConfigButton"),
    backupConfigForm: document.querySelector("#backupConfigForm"),
    backupConfigStatus: document.querySelector("#backupConfigStatus"),
    backupRemoteInput: document.querySelector("#backupRemoteInput"),
    backupTokenInput: document.querySelector("#backupTokenInput"),
    backupConfigFeedback: document.querySelector("#backupConfigFeedback"),
    exportJsonButton: document.querySelector("#exportJsonButton"),
    exportMarkdownButton: document.querySelector("#exportMarkdownButton"),
    backupSqliteButton: document.querySelector("#backupSqliteButton"),
    commitExportsButton: document.querySelector("#commitExportsButton"),
    pushBackupButton: document.querySelector("#pushBackupButton"),
    previewImportButton: document.querySelector("#previewImportButton"),
    importSnapshotButton: document.querySelector("#importSnapshotButton"),
    ankiConfigBackdrop: document.querySelector("#ankiConfigBackdrop"),
    closeAnkiConfigButton: document.querySelector("#closeAnkiConfigButton"),
    cancelAnkiConfigButton: document.querySelector("#cancelAnkiConfigButton"),
    testAnkiConnectionButton: document.querySelector("#testAnkiConnectionButton"),
    ankiConfigForm: document.querySelector("#ankiConfigForm"),
    ankiConfigStatus: document.querySelector("#ankiConfigStatus"),
    ankiDeckNameInput: document.querySelector("#ankiDeckNameInput"),
    ankiModelNameInput: document.querySelector("#ankiModelNameInput"),
    ankiMatureThresholdInput: document.querySelector("#ankiMatureThresholdInput"),
    ankiDailyLimitInput: document.querySelector("#ankiDailyLimitInput"),
    ankiAutoAbsorbInput: document.querySelector("#ankiAutoAbsorbInput"),
    ankiConfigFeedback: document.querySelector("#ankiConfigFeedback"),
    openObsidianConfigButton: document.querySelector("#openObsidianConfigButton"),
    obsidianConfigBackdrop: document.querySelector("#obsidianConfigBackdrop"),
    closeObsidianConfigButton: document.querySelector("#closeObsidianConfigButton"),
    cancelObsidianConfigButton: document.querySelector("#cancelObsidianConfigButton"),
    obsidianConfigForm: document.querySelector("#obsidianConfigForm"),
    obsidianConfigStatus: document.querySelector("#obsidianConfigStatus"),
    obsidianVaultNameInput: document.querySelector("#obsidianVaultNameInput"),
    obsidianVaultPathInput: document.querySelector("#obsidianVaultPathInput"),
    obsidianNotesFolderInput: document.querySelector("#obsidianNotesFolderInput"),
    obsidianConfigFeedback: document.querySelector("#obsidianConfigFeedback"),
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
    detailCurrent: document.querySelector("#detailCurrent"),
    detailCurrentKicker: document.querySelector("#detailCurrentKicker"),
    detailCurrentTitle: document.querySelector("#detailCurrentTitle"),
    detailCurrentDescription: document.querySelector("#detailCurrentDescription"),
    detailCurrentStatus: document.querySelector("#detailCurrentStatus"),
    detailCurrentChecklist: document.querySelector("#detailCurrentChecklist"),
    advanceCardButton: document.querySelector("#advanceCardButton"),
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
    obsidianCardStatus: document.querySelector("#obsidianCardStatus"),
    obsidianCardBadge: document.querySelector("#obsidianCardBadge"),
    obsidianCardPath: document.querySelector("#obsidianCardPath"),
    createObsidianNoteButton: document.querySelector("#createObsidianNoteButton"),
    createObsidianAlternativeButton: document.querySelector("#createObsidianAlternativeButton"),
    openObsidianNoteButton: document.querySelector("#openObsidianNoteButton"),
    manualFlashcardsForm: document.querySelector("#manualFlashcardsForm"),
    manualFlashcardsStatus: document.querySelector("#manualFlashcardsStatus"),
    manualFlashcardsBadge: document.querySelector("#manualFlashcardsBadge"),
    manualFlashcardsCountInput: document.querySelector("#manualFlashcardsCountInput"),
    manualFlashcardsDateInput: document.querySelector("#manualFlashcardsDateInput"),
    reviewStatus: document.querySelector("#reviewStatus"),
    markReviewDoneButton: document.querySelector("#markReviewDoneButton"),
    skipReviewButton: document.querySelector("#skipReviewButton"),
    checklistPanel: document.querySelector("#checklistPanel"),
    checklistStatus: document.querySelector("#checklistStatus"),
    checklistCount: document.querySelector("#checklistCount"),
    qualityChecklist: document.querySelector("#qualityChecklist"),
    ankiCardStatus: document.querySelector("#ankiCardStatus"),
    ankiCardBadge: document.querySelector("#ankiCardBadge"),
    ankiNoteForm: document.querySelector("#ankiNoteForm"),
    ankiFrontInput: document.querySelector("#ankiFrontInput"),
    ankiBackInput: document.querySelector("#ankiBackInput"),
    syncAnkiMatureButton: document.querySelector("#syncAnkiMatureButton"),
    ankiNotesList: document.querySelector("#ankiNotesList"),
    detailFormFeedback: document.querySelector("#detailFormFeedback")
};

document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    renderBoard();
    loadObsidianConfig();
    loadAnkiConfig();
    loadBackupConfig();
    loadCards();
});

function bindEvents() {
    elements.refreshButton.addEventListener("click", loadCards);
    elements.openCreateModalButton.addEventListener("click", () => openModal());
    elements.openImportJsonButton.addEventListener("click", openImportJsonModal);
    elements.openTagsButton.addEventListener("click", openTagsModal);
    elements.toggleBulkDeleteButton.addEventListener("click", toggleBulkDeleteMode);
    elements.deleteSelectedCardsButton.addEventListener("click", deleteSelectedCards);
    elements.closeImportJsonButton.addEventListener("click", closeImportJsonModal);
    elements.cancelImportJsonButton.addEventListener("click", closeImportJsonModal);
    elements.fillImportJsonExampleButton.addEventListener("click", fillImportJsonExample);
    elements.importJsonForm.addEventListener("submit", importCardsFromJson);
    elements.importJsonFileInput.addEventListener("change", loadImportJsonFile);
    elements.closeTagsButton.addEventListener("click", closeTagsModal);
    elements.tagsFilterInput.addEventListener("input", renderTagsModal);
    elements.openAnkiConfigButton.addEventListener("click", openAnkiConfigModal);
    elements.openBackupConfigButton.addEventListener("click", openBackupConfigModal);
    elements.closeBackupConfigButton.addEventListener("click", closeBackupConfigModal);
    elements.cancelBackupConfigButton.addEventListener("click", closeBackupConfigModal);
    elements.backupConfigForm.addEventListener("submit", saveBackupConfig);
    elements.exportJsonButton.addEventListener("click", () => runBackupAction(API.exportJson));
    elements.exportMarkdownButton.addEventListener("click", () => runBackupAction(API.exportMarkdown));
    elements.backupSqliteButton.addEventListener("click", () => runBackupAction(API.backupSqlite));
    elements.commitExportsButton.addEventListener("click", () => runBackupAction(API.commitExports));
    elements.pushBackupButton.addEventListener("click", () => runBackupAction(API.pushBackup));
    elements.previewImportButton.addEventListener("click", previewImport);
    elements.importSnapshotButton.addEventListener("click", importSnapshot);
    elements.closeAnkiConfigButton.addEventListener("click", closeAnkiConfigModal);
    elements.cancelAnkiConfigButton.addEventListener("click", closeAnkiConfigModal);
    elements.testAnkiConnectionButton.addEventListener("click", testAnkiConnection);
    elements.openObsidianConfigButton.addEventListener("click", openObsidianConfigModal);
    elements.closeObsidianConfigButton.addEventListener("click", closeObsidianConfigModal);
    elements.cancelObsidianConfigButton.addEventListener("click", closeObsidianConfigModal);
    elements.closeModalButton.addEventListener("click", closeModal);
    elements.cancelCreateButton.addEventListener("click", closeModal);
    elements.closeMoveModalButton.addEventListener("click", closeMoveModal);
    elements.cancelMoveButton.addEventListener("click", closeMoveModal);
    elements.editCardButton.addEventListener("click", openEditCardModal);
    elements.deleteCardButton.addEventListener("click", deleteActiveCard);
    elements.advanceCardButton.addEventListener("click", advanceActiveCard);
    elements.nextActionButton.addEventListener("click", openNextActionCard);
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
    elements.obsidianConfigBackdrop.addEventListener("click", (event) => {
        if (event.target === elements.obsidianConfigBackdrop) {
            closeObsidianConfigModal();
        }
    });
    elements.backupConfigBackdrop.addEventListener("click", (event) => {
        if (event.target === elements.backupConfigBackdrop) {
            closeBackupConfigModal();
        }
    });
    elements.importJsonBackdrop.addEventListener("click", (event) => {
        if (event.target === elements.importJsonBackdrop) {
            closeImportJsonModal();
        }
    });
    elements.tagsBackdrop.addEventListener("click", (event) => {
        if (event.target === elements.tagsBackdrop) {
            closeTagsModal();
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
    elements.ankiConfigForm.addEventListener("submit", saveAnkiConfig);
    elements.obsidianConfigForm.addEventListener("submit", saveObsidianConfig);
    elements.moveCardForm.addEventListener("submit", confirmPendingMove);
    elements.resourceForm.addEventListener("submit", saveResource);
    elements.evidenceForm.addEventListener("submit", saveEvidence);
    elements.cancelResourceEditButton.addEventListener("click", resetResourceForm);
    elements.cancelEvidenceEditButton.addEventListener("click", resetEvidenceForm);
    elements.resourcesList.addEventListener("click", handleResourceAction);
    elements.evidenceList.addEventListener("click", handleEvidenceAction);
    elements.createObsidianNoteButton.addEventListener("click", () => createObsidianNote(false));
    elements.createObsidianAlternativeButton.addEventListener("click", () => createObsidianNote(true));
    elements.openObsidianNoteButton.addEventListener("click", openObsidianNote);
    elements.manualFlashcardsForm.addEventListener("submit", saveManualFlashcards);
    elements.qualityChecklist.addEventListener("change", saveChecklist);
    elements.ankiNoteForm.addEventListener("submit", createAnkiNote);
    elements.syncAnkiMatureButton.addEventListener("click", syncAnkiMature);
    elements.markReviewDoneButton.addEventListener("click", () => applyReviewAction("done"));
    elements.skipReviewButton.addEventListener("click", () => applyReviewAction("skip"));
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

        if (!elements.obsidianConfigBackdrop.hidden) {
            closeObsidianConfigModal();
        }

        if (!elements.ankiConfigBackdrop.hidden) {
            closeAnkiConfigModal();
        }

        if (!elements.backupConfigBackdrop.hidden) {
            closeBackupConfigModal();
        }

        if (!elements.importJsonBackdrop.hidden) {
            closeImportJsonModal();
        }

        if (!elements.tagsBackdrop.hidden) {
            closeTagsModal();
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

async function loadBackupConfig() {
    try {
        const response = await fetch(API.backupConfig, { headers: { Accept: "application/json" } });
        if (!response.ok) {
            throw new Error("Nao foi possivel carregar a configuracao de backup.");
        }
        state.backupConfig = await response.json();
        renderBackupConfigStatus();
    } catch (error) {
        state.backupConfig = null;
        elements.backupConfigStatus.textContent = error.message;
    }
}

async function saveBackupConfig(event) {
    event.preventDefault();
    elements.backupConfigFeedback.textContent = "";

    const payload = {
        remoteUrl: elements.backupRemoteInput.value.trim(),
        token: elements.backupTokenInput.value.trim()
    };

    try {
        const response = await fetch(API.backupConfig, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error("Revise o remote e o token.");
        }

        state.backupConfig = await response.json();
        elements.backupTokenInput.value = "";
        renderBackupConfigStatus();
        elements.backupConfigFeedback.textContent = "Configuracao de GitHub salva.";
    } catch (error) {
        elements.backupConfigFeedback.textContent = `Nao foi possivel salvar. ${error.message}`;
    }
}

function openBackupConfigModal() {
    const config = state.backupConfig || {};
    elements.backupRemoteInput.value = config.remoteUrl || "";
    elements.backupTokenInput.value = "";
    elements.backupConfigFeedback.textContent = "";
    renderBackupConfigStatus();
    elements.backupConfigBackdrop.hidden = false;
    elements.backupRemoteInput.focus();
}

function closeBackupConfigModal() {
    elements.backupConfigBackdrop.hidden = true;
    elements.backupConfigForm.reset();
    elements.backupConfigFeedback.textContent = "";
}

function renderBackupConfigStatus() {
    const config = state.backupConfig;
    if (!config) {
        elements.backupConfigStatus.textContent = "Configuracao de backup indisponivel.";
        return;
    }

    const remoteStatus = config.remoteUrl ? "Remote configurado" : "Remote nao configurado";
    const tokenStatus = config.tokenConfigured ? "token configurado" : "token ausente";
    elements.backupConfigStatus.textContent = `${remoteStatus}; ${tokenStatus}. Push so roda pelo botao.`;
}

async function runBackupAction(url) {
    elements.backupConfigFeedback.textContent = "Executando...";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { Accept: "application/json" }
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(body.message || "Acao nao concluida.");
        }

        const pathInfo = body.path ? ` Caminho: ${body.path}.` : "";
        const commitInfo = body.commitId ? ` Commit: ${body.commitId}.` : "";
        elements.backupConfigFeedback.textContent = `${body.message}${pathInfo}${commitInfo}`;
    } catch (error) {
        elements.backupConfigFeedback.textContent = `Falha no backup. ${error.message}`;
    }
}

async function previewImport() {
    elements.backupConfigFeedback.textContent = "Validando snapshot...";

    try {
        const response = await fetch(API.importPreview, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({})
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(body.message || "Snapshot invalido.");
        }

        elements.backupConfigFeedback.textContent = `${body.cardsCount} cards no snapshot: ${body.newCardsCount} novos, ${body.existingCardsCount} existentes. Schema ${body.schemaVersion}.`;
    } catch (error) {
        elements.backupConfigFeedback.textContent = `Nao foi possivel validar. ${error.message}`;
    }
}

async function importSnapshot() {
    if (!confirm("Importar exports/study-flow-export.json e atualizar cards existentes quando encontrados?")) {
        return;
    }

    elements.backupConfigFeedback.textContent = "Importando snapshot...";

    try {
        const response = await fetch(API.importSnapshot, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({})
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(body.message || "Importacao nao concluida.");
        }

        elements.backupConfigFeedback.textContent = body.message;
        await loadCards();
    } catch (error) {
        elements.backupConfigFeedback.textContent = `Nao foi possivel importar. ${error.message}`;
    }
}

async function loadObsidianConfig() {
    try {
        const response = await fetch(API.obsidianConfig, { headers: { Accept: "application/json" } });
        if (!response.ok) {
            throw new Error("Nao foi possivel carregar a configuracao.");
        }
        state.obsidianConfig = await response.json();
        renderObsidianConfigStatus();
    } catch (error) {
        state.obsidianConfig = null;
        elements.obsidianConfigStatus.textContent = error.message;
    }
}

async function saveObsidianConfig(event) {
    event.preventDefault();
    elements.obsidianConfigFeedback.textContent = "";

    const payload = {
        vaultName: elements.obsidianVaultNameInput.value.trim(),
        vaultPath: elements.obsidianVaultPathInput.value.trim(),
        notesFolder: elements.obsidianNotesFolderInput.value.trim() || "04 - CEREBRO"
    };

    try {
        const response = await fetch(API.obsidianConfig, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error("Revise os dados do vault e tente novamente.");
        }

        state.obsidianConfig = await response.json();
        renderObsidianConfigStatus();
        renderObsidianPanel();
        elements.obsidianConfigFeedback.textContent = state.obsidianConfig.status;
    } catch (error) {
        elements.obsidianConfigFeedback.textContent = `Nao foi possivel salvar. ${error.message}`;
    }
}

function openObsidianConfigModal() {
    const config = state.obsidianConfig || {};
    elements.obsidianVaultNameInput.value = config.vaultName || "";
    elements.obsidianVaultPathInput.value = config.vaultPath || "";
    elements.obsidianNotesFolderInput.value = config.notesFolder || "04 - CEREBRO";
    elements.obsidianConfigFeedback.textContent = "";
    renderObsidianConfigStatus();
    elements.obsidianConfigBackdrop.hidden = false;
    elements.obsidianVaultNameInput.focus();
}

function closeObsidianConfigModal() {
    elements.obsidianConfigBackdrop.hidden = true;
    elements.obsidianConfigForm.reset();
    elements.obsidianConfigFeedback.textContent = "";
}

function renderObsidianConfigStatus() {
    const config = state.obsidianConfig;
    elements.obsidianConfigStatus.textContent = config?.status || "Configuracao do Obsidian indisponivel.";
}

async function loadAnkiConfig() {
    try {
        const response = await fetch(API.ankiConfig, { headers: { Accept: "application/json" } });
        if (!response.ok) {
            throw new Error("Nao foi possivel carregar a configuracao do Anki.");
        }
        state.ankiConfig = await response.json();
        renderAnkiConfigStatus();
    } catch (error) {
        state.ankiConfig = null;
        elements.ankiConfigStatus.textContent = error.message;
    }
}

function openAnkiConfigModal() {
    const config = state.ankiConfig || {};
    elements.ankiDeckNameInput.value = config.deckName || "Study Flow";
    elements.ankiModelNameInput.value = config.modelName || "Basic";
    elements.ankiMatureThresholdInput.value = config.matureThresholdDays || 21;
    elements.ankiDailyLimitInput.value = config.dailyReviewLimit || 8;
    elements.ankiAutoAbsorbInput.checked = Boolean(config.autoAbsorbMature);
    elements.ankiConfigFeedback.textContent = "";
    renderAnkiConfigStatus();
    elements.ankiConfigBackdrop.hidden = false;
    elements.ankiDeckNameInput.focus();
}

function closeAnkiConfigModal() {
    elements.ankiConfigBackdrop.hidden = true;
    elements.ankiConfigForm.reset();
    elements.ankiConfigFeedback.textContent = "";
}

function renderAnkiConfigStatus(message = "") {
    const config = state.ankiConfig;
    elements.ankiConfigStatus.textContent = message || (config
        ? `Deck ${config.deckName} - mature em ${config.matureThresholdDays} dias - limite ${config.dailyReviewLimit}/dia.`
        : "Configuracao do Anki indisponivel.");
}

async function saveAnkiConfig(event) {
    event.preventDefault();
    elements.ankiConfigFeedback.textContent = "";
    const payload = {
        deckName: elements.ankiDeckNameInput.value.trim(),
        modelName: elements.ankiModelNameInput.value.trim() || "Basic",
        matureThresholdDays: Number(elements.ankiMatureThresholdInput.value || 21),
        dailyReviewLimit: Number(elements.ankiDailyLimitInput.value || 8),
        autoAbsorbMature: elements.ankiAutoAbsorbInput.checked
    };

    try {
        const response = await fetch(API.ankiConfig, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error("Revise deck, modelo e limites.");
        }
        state.ankiConfig = await response.json();
        renderAnkiConfigStatus("Configuracao salva.");
        elements.ankiConfigFeedback.textContent = "Configuracao salva.";
    } catch (error) {
        elements.ankiConfigFeedback.textContent = `Nao foi possivel salvar. ${error.message}`;
    }
}

async function testAnkiConnection() {
    elements.ankiConfigFeedback.textContent = "Testando localhost:8765...";
    try {
        const response = await fetch(API.ankiStatus, { headers: { Accept: "application/json" } });
        if (!response.ok) {
            throw new Error("Falha ao testar o AnkiConnect.");
        }
        const status = await response.json();
        elements.ankiConfigFeedback.textContent = status.message + (status.version ? ` Versao ${status.version}.` : "");
        renderAnkiConfigStatus(status.message);
    } catch (error) {
        elements.ankiConfigFeedback.textContent = `AnkiConnect indisponivel. ${error.message}`;
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
        const currentIds = new Set(state.cards.map((card) => card.id));
        state.selectedCardIds = new Set(Array.from(state.selectedCardIds).filter((id) => currentIds.has(id)));
        updateBulkDeleteControls();
        setBoardStatus("");
        renderBoard();
    } catch (error) {
        state.cards = [];
        setBoardStatus(`Nao foi possivel carregar seus estudos. ${error.message}`);
        renderBoard();
    }
}

function openImportJsonModal() {
    elements.importJsonFeedback.textContent = "";
    if (!elements.importJsonInput.value.trim()) {
        fillImportJsonExample();
    }
    elements.importJsonBackdrop.hidden = false;
    elements.importJsonInput.focus();
}

function closeImportJsonModal() {
    elements.importJsonBackdrop.hidden = true;
    elements.importJsonFeedback.textContent = "";
    elements.importJsonFileInput.value = "";
}

function fillImportJsonExample() {
    elements.importJsonInput.value = JSON.stringify([
        {
            titulo: "Retry + Idempotencia",
            contexto: "Padroes de resiliencia",
            descricao: "Estudar como evitar efeitos duplicados quando uma operacao e executada mais de uma vez.",
            prioridade: "ALTA",
            estagio: "TRIAGEM",
            orderIndex: 0,
            tags: [
                { categoria: "TIPO", valor: "Backend" },
                { categoria: "LINGUAGEM", valor: "Kotlin" }
            ],
            recursos: [
                {
                    tipo: "DOCUMENTACAO",
                    titulo: "Spring Retry",
                    url: "https://docs.spring.io/spring-retry/docs/current/reference/html/",
                    observacoes: "Referencia para comparar retries com idempotencia."
                },
                {
                    tipo: "TAREFA",
                    titulo: "Criar endpoint POST /payments idempotente",
                    observacoes: "Usar header Idempotency-Key e constraint unica."
                }
            ]
        }
    ], null, 2);
}

async function loadImportJsonFile(event) {
    const file = event.target.files?.[0];
    if (!file) {
        return;
    }

    if (!file.name.toLowerCase().endsWith(".json")) {
        elements.importJsonFeedback.textContent = "Selecione um arquivo .json.";
        event.target.value = "";
        return;
    }

    try {
        elements.importJsonInput.value = await file.text();
        elements.importJsonFeedback.textContent = `Arquivo ${file.name} carregado para revisao.`;
    } catch (error) {
        elements.importJsonFeedback.textContent = `Nao foi possivel ler o arquivo. ${error.message}`;
    }
}

async function importCardsFromJson(event) {
    event.preventDefault();
    elements.importJsonFeedback.textContent = "";

    let payload;
    try {
        payload = buildImportPayload(elements.importJsonInput.value);
    } catch (error) {
        elements.importJsonFeedback.textContent = error.message;
        return;
    }

    elements.submitImportJsonButton.disabled = true;
    elements.importJsonFeedback.textContent = "Importando cards...";

    try {
        const response = await fetch(API.cardImport, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload)
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(body.message || "Revise o JSON e tente novamente.");
        }

        const errorSummary = body.errorCount > 0
            ? ` ${body.errorCount} erro(s): ${formatImportErrors(body.errors)}`
            : "";
        const resourceSummary = body.resourcesCreatedCount ? ` ${body.resourcesCreatedCount} recurso(s) criado(s).` : "";
        elements.importJsonFeedback.textContent = `${body.createdCount} de ${body.requestedCount} card(s) importado(s).${resourceSummary}${errorSummary}`;

        if (body.createdCount > 0) {
            await loadCards();
        }
    } catch (error) {
        elements.importJsonFeedback.textContent = `Nao foi possivel importar. ${error.message}`;
    } finally {
        elements.submitImportJsonButton.disabled = false;
    }
}

function buildImportPayload(rawJson) {
    const trimmed = rawJson.trim();
    if (!trimmed) {
        throw new Error("Cole o JSON com os cards para importar.");
    }

    const parsed = JSON.parse(trimmed);
    const cards = Array.isArray(parsed) ? parsed : parsed.cards;

    if (!Array.isArray(cards)) {
        throw new Error('Use um array de cards ou um objeto no formato { "cards": [...] }.');
    }

    if (cards.length === 0) {
        throw new Error("Inclua pelo menos um card no JSON.");
    }

    return { cards };
}

function formatImportErrors(errors = []) {
    return errors
        .slice(0, 3)
        .map((error) => `card ${error.index + 1} (${error.field}: ${error.message})`)
        .join("; ");
}

function openTagsModal() {
    elements.tagsFilterInput.value = "";
    renderTagsModal();
    elements.tagsBackdrop.hidden = false;
    elements.tagsFilterInput.focus();
}

function closeTagsModal() {
    elements.tagsBackdrop.hidden = true;
}

function renderTagsModal() {
    const tags = getDistinctTags();
    const filter = elements.tagsFilterInput.value.trim().toLowerCase();
    const filteredTags = tags.filter((tag) =>
        [tag.categoria, tag.valor, tag.cards.map((card) => card.titulo).join(" ")]
            .join(" ")
            .toLowerCase()
            .includes(filter)
    );

    elements.tagsSummary.textContent = `${tags.length} tag(s) unica(s), ${state.cards.length} card(s) no sistema.`;
    if (filteredTags.length === 0) {
        elements.tagsList.innerHTML = `<div class="empty-stage">Nenhuma tag encontrada.</div>`;
        return;
    }

    elements.tagsList.innerHTML = filteredTags.map((tag) => `
        <article class="tag-row">
            <div>
                <span class="artifact-type">${tagCategoryLabel(tag.categoria)}</span>
                <h3>${escapeHtml(tag.valor)}</h3>
                <p>${tag.cards.map((card) => escapeHtml(card.titulo)).join(", ")}</p>
            </div>
            <span class="tag-count">${tag.cards.length}</span>
        </article>
    `).join("");
}

function getDistinctTags() {
    const tagsByKey = new Map();

    state.cards.forEach((card) => {
        (card.tags || []).forEach((tag) => {
            const value = normalizeWhitespace(tag.valor || "");
            if (!value) {
                return;
            }

            const key = `${tag.categoria}:${value.toLowerCase()}`;
            const existing = tagsByKey.get(key) || {
                categoria: tag.categoria,
                valor: value,
                cards: []
            };

            if (!existing.cards.some((item) => item.id === card.id)) {
                existing.cards.push(card);
            }

            tagsByKey.set(key, existing);
        });
    });

    return Array.from(tagsByKey.values())
        .sort((first, second) =>
            first.categoria.localeCompare(second.categoria, "pt-BR") ||
            first.valor.localeCompare(second.valor, "pt-BR")
        );
}

function tagCategoryLabel(category) {
    const labels = {
        LINGUAGEM: "Linguagem",
        TIPO: "Tipo"
    };
    return labels[category] || category;
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
        tags: distinctTags([
            ...parseTags(elements.languagesInput.value, "LINGUAGEM"),
            ...parseTags(elements.typesInput.value, "TIPO")
        ])
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

function distinctTags(tags = []) {
    const seen = new Set();
    return tags.filter((tag) => {
        const key = `${tag.categoria}:${tag.valor.trim().toLowerCase()}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
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
    renderNextAction(visibleCards);
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
    const canCollapseGroups = groups.length > 1;
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
        const collapsed = canCollapseGroups && state.collapsedGroups.has(groupKey);
        group.classList.toggle("is-collapsed", collapsed);
        group.innerHTML = `
            <header class="study-group-header">
                <button class="group-collapse-button" type="button" data-group-key="${escapeHtml(groupKey)}" aria-expanded="${!collapsed}" ${canCollapseGroups ? "" : "disabled"}>
                    <span class="group-collapse-icon" aria-hidden="true"></span>
                </button>
                <div class="group-title">
                    <p class="group-kicker">Contexto de estudo</p>
                    <h3>${escapeHtml(groupName)}</h3>
                </div>
                <div class="group-actions">
                    ${groupKind === "active" ? `<span class="group-order-label">Ordem manual</span>` : ""}
                    <span class="group-count">${orderedCards.length}</span>
                    ${groupKind === "active" ? `<button class="group-add-button" type="button" data-study-type="${escapeHtml(groupName)}" aria-label="Adicionar card em ${escapeHtml(groupName)}" title="Adicionar card">+</button>` : ""}
                </div>
            </header>
            <div class="study-row" ${collapsed ? "hidden" : ""}></div>
            ${hiddenCount > 0 && !collapsed ? `<button class="show-more-button" type="button" data-group-key="${escapeHtml(groupKey)}">Ver mais ${hiddenCount} cards</button>` : ""}
        `;
        const row = group.querySelector(".study-row");
        if (!collapsed) {
            visibleCards.forEach((card) => row.appendChild(renderCard(card)));
        }
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
    const order = getCardOrderInfo(card);
    const orderBadge = order
        ? `<span class="card-order-badge" title="Posicao ${order.position} de ${order.total} neste contexto">#${order.position}</span>`
        : "";
    const selected = state.selectedCardIds.has(card.id);
    article.classList.toggle("is-selected", selected);
    const selectionControl = state.bulkDeleteMode
        ? `<label class="card-select-control" aria-label="Selecionar ${escapeHtml(card.titulo)}">
            <input class="card-select-input" type="checkbox" data-card-id="${card.id}" ${selected ? "checked" : ""}>
            <span></span>
        </label>`
        : "";

    article.innerHTML = `
        ${selectionControl}
        <div class="card-topline">
            <span class="priority-dot" aria-hidden="true"></span>
            <span class="card-context">${escapeHtml(card.contexto)}</span>
            <span class="card-stage">${stageLabel(card.estagio)} - ${progress.index + 1}/6</span>
            ${orderBadge}
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
            ${nextStageButton(card)}
        </div>
    `;

    return article;
}

function handleBoardClick(event) {
    const selectInput = event.target.closest(".card-select-input");
    if (selectInput) {
        const cardId = Number(selectInput.dataset.cardId);
        if (selectInput.checked) {
            state.selectedCardIds.add(cardId);
        } else {
            state.selectedCardIds.delete(cardId);
        }
        updateBulkDeleteControls();
        renderBoard();
        return;
    }

    const selectControl = event.target.closest(".card-select-control");
    if (selectControl) {
        return;
    }

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

    const groupCollapseButton = event.target.closest(".group-collapse-button");
    if (groupCollapseButton && !groupCollapseButton.disabled) {
        const groupKey = groupCollapseButton.dataset.groupKey;
        if (state.collapsedGroups.has(groupKey)) {
            state.collapsedGroups.delete(groupKey);
        } else {
            state.collapsedGroups.add(groupKey);
        }
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
            if (state.bulkDeleteMode) {
                if (state.selectedCardIds.has(card.id)) {
                    state.selectedCardIds.delete(card.id);
                } else {
                    state.selectedCardIds.add(card.id);
                }
                updateBulkDeleteControls();
                renderBoard();
                return;
            }
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

    if (["REFINAMENTO", "CONSOLIDACAO"].includes(targetStage)) {
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
    renderObsidianPanel();
    renderMvp2Panels();
    renderDetailProgress(card);
    renderDetailFocus(card);
    elements.detailModalBackdrop.hidden = false;
    await loadCardArtifacts(card.id);
}

function renderDetailFocus(card) {
    if (!card) {
        return;
    }
    const stage = normalizeStage(card.estagio);
    const guidance = STAGE_GUIDANCE[stage];
    const nextStage = STAGES[STAGES.findIndex((item) => item.key === stage) + 1];
    const resourceCount = state.resources.length;
    const evidenceCount = state.evidence.length;
    const ankiCount = state.ankiNotes.length;

    elements.detailCurrentKicker.textContent = `Etapa atual: ${stageLabel(stage)}`;
    elements.detailCurrentTitle.textContent = guidance.title;
    elements.detailCurrentDescription.textContent = guidance.description;
    elements.detailCurrentStatus.textContent = stage === "ABSORVIDO" ? "Concluido" : "Em andamento";
    elements.detailCurrentChecklist.innerHTML = guidance.checklist.map((item) => `<div class="current-check-item"><span aria-hidden="true">-</span>${escapeHtml(item)}</div>`).join("");
    elements.advanceCardButton.textContent = nextStage ? guidance.next : "Consolidado";
    elements.advanceCardButton.disabled = !nextStage;

    document.querySelectorAll("[data-detail-stages]").forEach((panel) => {
        panel.hidden = !panel.dataset.detailStages.split(" ").includes(stage);
    });

    if (stage === "TRIAGEM" || stage === "ESTUDO_ATIVO") {
        elements.detailCurrentStatus.textContent = resourceCount ? `${resourceCount} material(is)` : "Sem materiais";
    } else if (stage === "APLICACAO" || stage === "REFINAMENTO") {
        elements.detailCurrentStatus.textContent = evidenceCount ? `${evidenceCount} evidencia(s)` : "Evidencia pendente";
    } else if (stage === "CONSOLIDACAO") {
        elements.detailCurrentStatus.textContent = ankiCount ? `${ankiCount} flashcard(s)` : "Flashcard pendente";
    }
}

function advanceActiveCard() {
    if (!state.activeCard) {
        return;
    }
    const stageIndex = STAGES.findIndex((stage) => stage.key === normalizeStage(state.activeCard.estagio));
    const nextStage = STAGES[stageIndex + 1];
    if (nextStage) {
        openMoveModal(state.activeCard, nextStage.key);
    }
}

function renderNextAction(cards) {
    const candidates = cards.filter((card) => normalizeStage(card.estagio) !== "ABSORVIDO");
    const dueReview = candidates.find((card) => normalizeStage(card.estagio) === "CONSOLIDACAO" && card.nextReviewAt && card.nextReviewAt <= new Date().toISOString().slice(0, 10));
    const nextCard = dueReview || candidates.sort(sortStudyPlanCards)[0];

    if (!nextCard) {
        elements.nextActionTitle.textContent = "Nenhum estudo pendente";
        elements.nextActionDescription.textContent = "Crie um card quando surgir o proximo assunto que voce quer aprender.";
        elements.nextActionButton.textContent = "Novo estudo";
        elements.nextActionButton.disabled = false;
        elements.nextActionButton.dataset.cardId = "";
        return;
    }

    const stage = normalizeStage(nextCard.estagio);
    elements.nextActionTitle.textContent = nextCard.titulo;
    elements.nextActionDescription.textContent = `${stageLabel(stage)}: ${STAGE_GUIDANCE[stage].description}`;
    elements.nextActionButton.textContent = dueReview ? "Revisar agora" : "Continuar";
    elements.nextActionButton.disabled = false;
    elements.nextActionButton.dataset.cardId = String(nextCard.id);
}

function openNextActionCard() {
    const cardId = Number(elements.nextActionButton.dataset.cardId);
    if (!cardId) {
        openModal();
        return;
    }
    const card = state.cards.find((item) => item.id === cardId);
    if (card) {
        openCardDetail(card);
    }
}

function closeDetailModal() {
    elements.detailModalBackdrop.hidden = true;
    resetResourceForm();
    resetEvidenceForm();
    elements.detailFormFeedback.textContent = "";
    state.activeCard = null;
    state.resources = [];
    state.evidence = [];
    state.checklist = null;
    state.ankiNotes = [];
    elements.evidencePanel.hidden = false;
}

function renderObsidianPanel(message = "") {
    if (!elements.obsidianCardStatus || !state.activeCard) {
        return;
    }

    const config = state.obsidianConfig;
    const card = state.activeCard;
    const hasNote = Boolean(card.obsidianPath);
    const canUseObsidian = Boolean(config?.configured && config?.vaultPathExists);

    elements.obsidianCardPath.textContent = card.obsidianPath || "Sem nota vinculada";
    elements.obsidianCardBadge.textContent = hasNote ? "Vinculada" : (canUseObsidian ? "Pronta" : "Off");
    elements.openObsidianNoteButton.hidden = !hasNote;
    elements.createObsidianNoteButton.hidden = hasNote;
    elements.createObsidianAlternativeButton.hidden = !hasNote;
    elements.createObsidianNoteButton.textContent = "Criar ou vincular";
    elements.createObsidianAlternativeButton.disabled = !canUseObsidian;
    elements.createObsidianNoteButton.disabled = !canUseObsidian || hasNote;
    elements.openObsidianNoteButton.disabled = !canUseObsidian;

    if (message) {
        elements.obsidianCardStatus.textContent = message;
    } else if (!config?.configured) {
        elements.obsidianCardStatus.textContent = "Configure o vault para criar e abrir notas Markdown.";
    } else if (!config.vaultPathExists) {
        elements.obsidianCardStatus.textContent = "O caminho do vault configurado nao existe.";
    } else if (hasNote) {
        elements.obsidianCardStatus.textContent = "Nota sincronizada. Use abrir para continuar no Obsidian.";
    } else {
        elements.obsidianCardStatus.textContent = "Crie uma nota para registrar o refinamento deste card.";
    }
}

async function createObsidianNote(createAlternative) {
    if (!state.activeCard) {
        return;
    }

    elements.detailFormFeedback.textContent = "";
    renderObsidianPanel(createAlternative ? "Criando copia da nota..." : "Criando ou vinculando nota...");

    try {
        const response = await fetch(API.obsidianNote(state.activeCard.id), {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ createAlternative })
        });
        const result = await response.json();

        if (response.status === 409) {
            state.activeCard = { ...state.activeCard, obsidianPath: result.obsidianPath };
            state.cards = state.cards.map((card) => card.id === state.activeCard.id ? state.activeCard : card);
            renderBoard();
            renderObsidianPanel("Nota existente vinculada ao card.");
            return;
        }

        if (!response.ok) {
            throw new Error(result.message || "Nao foi possivel gerar a nota.");
        }

        state.activeCard = {
            ...state.activeCard,
            obsidianPath: result.obsidianPath,
            obsidianNoteCreatedAt: new Date().toISOString()
        };
        state.cards = state.cards.map((card) => card.id === state.activeCard.id ? state.activeCard : card);
        renderBoard();
        renderObsidianPanel(result.message);
    } catch (error) {
        renderObsidianPanel(error.message);
    }
}

async function openObsidianNote() {
    if (!state.activeCard) {
        return;
    }

    elements.detailFormFeedback.textContent = "";

    try {
        const response = await fetch(API.openObsidian(state.activeCard.id), {
            method: "POST",
            headers: { Accept: "application/json" }
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || "Nao foi possivel abrir a nota.");
        }

        state.activeCard = {
            ...state.activeCard,
            obsidianPath: result.obsidianPath,
            obsidianLastOpenedAt: new Date().toISOString()
        };
        state.cards = state.cards.map((card) => card.id === state.activeCard.id ? state.activeCard : card);
        renderObsidianPanel(result.message);
        window.location.href = result.deepLink;
    } catch (error) {
        renderObsidianPanel(error.message);
    }
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

function toggleBulkDeleteMode() {
    state.bulkDeleteMode = !state.bulkDeleteMode;
    state.selectedCardIds.clear();
    updateBulkDeleteControls();
    renderBoard();
}

function updateBulkDeleteControls() {
    const count = state.selectedCardIds.size;
    elements.deleteSelectedCardsButton.hidden = !state.bulkDeleteMode;
    elements.deleteSelectedCardsButton.disabled = count === 0;
    elements.deleteSelectedCardsButton.dataset.tooltip = count > 0 ? `Apagar ${count}` : "Apagar selecionados";
    elements.toggleBulkDeleteButton.classList.toggle("is-active", state.bulkDeleteMode);
    elements.toggleBulkDeleteButton.dataset.tooltip = state.bulkDeleteMode ? "Cancelar selecao" : "Selecionar";
}

async function deleteSelectedCards() {
    const ids = Array.from(state.selectedCardIds);
    if (ids.length === 0) {
        return;
    }

    const confirmed = confirm(`Apagar ${ids.length} card(s) selecionado(s) e todos os dados vinculados?`);
    if (!confirmed) {
        return;
    }

    setBoardStatus("Apagando cards selecionados...");
    elements.deleteSelectedCardsButton.disabled = true;

    try {
        const response = await fetch(API.cardDeleteBatch, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ ids })
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(body.message || "Nao foi possivel apagar os cards.");
        }

        const deletedIds = new Set(ids.filter((id) => !(body.notFoundIds || []).includes(id)));
        state.cards = state.cards.filter((card) => !deletedIds.has(card.id));
        state.selectedCardIds.clear();
        state.bulkDeleteMode = false;
        updateBulkDeleteControls();
        renderBoard();
        setBoardStatus(`${body.deletedCount} card(s) apagado(s).`);
    } catch (error) {
        setBoardStatus(error.message);
        updateBulkDeleteControls();
    }
}

async function loadCardArtifacts(cardId) {
    elements.resourcesList.innerHTML = `<div class="empty-stage">Carregando recursos...</div>`;
    elements.qualityChecklist.innerHTML = `<div class="empty-stage">Carregando checklist...</div>`;
    elements.ankiNotesList.innerHTML = `<div class="empty-stage">Carregando notas...</div>`;
    const shouldLoadEvidence = shouldShowEvidencePanel();
    if (shouldLoadEvidence) {
        elements.evidenceList.innerHTML = `<div class="empty-stage">Carregando evidencias...</div>`;
    }

    try {
        const [resources, evidence, checklist, ankiNotes] = await Promise.all([
            fetchResources(cardId),
            shouldLoadEvidence ? fetchEvidence(cardId) : Promise.resolve([]),
            fetchChecklist(cardId),
            fetchAnkiNotes(cardId)
        ]);

        state.resources = resources;
        state.evidence = evidence;
        state.checklist = checklist;
        state.ankiNotes = ankiNotes;
        renderResources();
        if (shouldLoadEvidence) {
            renderEvidence();
        }
        renderChecklist();
        renderAnkiNotes();
        renderMvp2Panels();
        renderDetailFocus(state.activeCard);
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

async function fetchChecklist(cardId) {
    const response = await fetch(API.checklist(cardId), { headers: { Accept: "application/json" } });
    if (!response.ok) {
        throw new Error("Tente consultar a checklist novamente.");
    }
    return response.json();
}

async function fetchAnkiNotes(cardId) {
    const response = await fetch(API.ankiNotes(cardId), { headers: { Accept: "application/json" } });
    if (!response.ok) {
        throw new Error("Tente consultar as notas do Anki novamente.");
    }
    return response.json();
}

function renderMvp2Panels() {
    if (!state.activeCard) {
        return;
    }
    const card = state.activeCard;
    elements.manualFlashcardsCountInput.value = card.manualFlashcardsCount || "";
    elements.manualFlashcardsDateInput.value = card.manualFlashcardsCreatedAt || new Date().toISOString().slice(0, 10);
    elements.manualFlashcardsBadge.textContent = card.manualFlashcardsCount ? `${card.manualFlashcardsCount} cards` : "Manual";
    elements.manualFlashcardsStatus.textContent = card.manualFlashcardsCount
        ? `Flashcards criados em ${formatDate(card.manualFlashcardsCreatedAt)}.`
        : "Use este registro apenas se voce criou flashcards fora do AnkiConnect.";
    elements.ankiFrontInput.value = card.titulo || "";
    elements.ankiBackInput.value = card.descricao || card.contexto || "";
    renderReviewStatus(card);
}

function renderReviewStatus(card) {
    if (normalizeStage(card.estagio) !== "CONSOLIDACAO") {
        elements.reviewStatus.textContent = "A revisao elastica aparece quando o card entra em consolidacao.";
        elements.markReviewDoneButton.disabled = true;
        elements.skipReviewButton.disabled = true;
        return;
    }

    const due = card.nextReviewAt && card.nextReviewAt <= new Date().toISOString().slice(0, 10);
    elements.reviewStatus.innerHTML = `
        <span>Proxima revisao: <strong>${card.nextReviewAt ? formatDate(card.nextReviewAt) : "sem data"}</strong></span>
        <span>Intervalo: <strong>${card.reviewIntervalDays || 3} dias</strong></span>
        <span class="${due ? "review-due" : ""}">${due ? "Sugerida agora" : "Fila leve"}</span>
    `;
    elements.markReviewDoneButton.disabled = false;
    elements.skipReviewButton.disabled = false;
}

function renderChecklist() {
    if (!state.checklist) {
        elements.qualityChecklist.innerHTML = `<div class="empty-stage">Checklist indisponivel.</div>`;
        return;
    }
    elements.checklistCount.textContent = `${state.checklist.checkedCount}/${state.checklist.totalCount}`;
    elements.checklistStatus.textContent = state.checklist.complete
        ? "Checklist completa para uma consolidacao mais forte."
        : "Checklist incompleta. Voce pode consolidar, mas revise a qualidade dos flashcards.";
    elements.checklistStatus.classList.toggle("warning-text", !state.checklist.complete);
    elements.qualityChecklist.innerHTML = state.checklist.items.map((item) => `
        <label class="check-row">
            <input type="checkbox" data-checklist-key="${escapeHtml(item.key)}" ${item.checked ? "checked" : ""}>
            <span>${escapeHtml(item.label)}</span>
        </label>
    `).join("");
}

function renderAnkiNotes(message = "") {
    const config = state.ankiConfig;
    const connection = config ? `Deck: ${config.deckName}. ` : "Configure o AnkiConnect para salvar no Anki. ";
    elements.ankiCardStatus.textContent = message || (state.ankiNotes.length > 0
        ? `${connection}${state.ankiNotes.length} flashcard(s) enviado(s). Atualize o status para consultar a revisao.`
        : `${connection}Preencha pergunta e resposta para criar o primeiro flashcard.`);
    elements.ankiCardBadge.textContent = state.ankiNotes.some((note) => note.mature) ? "Maduro" : (state.ankiNotes.length ? "Enviado" : "Pendente");
    if (state.ankiNotes.length === 0) {
        elements.ankiNotesList.innerHTML = `<div class="empty-stage">Nenhum flashcard enviado ainda.</div>`;
        return;
    }
    elements.ankiNotesList.innerHTML = state.ankiNotes.map((note) => `
        <article class="artifact-item">
            <div class="artifact-card-main">
                <div>
                    <span class="artifact-type">Flashcard ${note.noteId}</span>
                    <h4>${escapeHtml(note.front)}</h4>
                </div>
                <span class="mature-badge ${note.mature ? "is-mature" : ""}">${note.mature ? "Maduro" : "Em aprendizado"}</span>
            </div>
            <p>${formatTextWithLinks(note.back)}</p>
            <p class="muted-line">Intervalo conhecido: ${note.lastKnownIntervalDays ?? "atualize o status"} dias</p>
        </article>
    `).join("");
}

async function saveManualFlashcards(event) {
    event.preventDefault();
    if (!state.activeCard) {
        return;
    }
    const payload = {
        quantidade: Number(elements.manualFlashcardsCountInput.value),
        dataCriacao: elements.manualFlashcardsDateInput.value
    };
    try {
        const response = await fetch(API.manualFlashcards(state.activeCard.id), {
            method: "PUT",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error("Informe quantidade e data validas.");
        }
        const savedCard = await response.json();
        updateActiveCard(savedCard);
        renderMvp2Panels();
        renderBoard();
    } catch (error) {
        elements.detailFormFeedback.textContent = `Nao foi possivel registrar flashcards. ${error.message}`;
    }
}

async function saveChecklist() {
    if (!state.activeCard) {
        return;
    }
    const items = Array.from(elements.qualityChecklist.querySelectorAll("[data-checklist-key]"))
        .map((input) => ({ key: input.dataset.checklistKey, checked: input.checked }));
    try {
        const response = await fetch(API.checklist(state.activeCard.id), {
            method: "PUT",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ items })
        });
        if (!response.ok) {
            throw new Error("Nao foi possivel salvar a checklist.");
        }
        state.checklist = await response.json();
        renderChecklist();
    } catch (error) {
        elements.detailFormFeedback.textContent = error.message;
    }
}

async function createAnkiNote(event) {
    event.preventDefault();
    if (!state.activeCard) {
        return;
    }
    renderAnkiNotes("Salvando flashcard no Anki...");
    try {
        const response = await fetch(API.ankiNotes(state.activeCard.id), {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
                front: elements.ankiFrontInput.value.trim(),
                back: elements.ankiBackInput.value.trim()
            })
        });
        if (!response.ok) {
            throw new Error("Abra o Anki, confira o AnkiConnect e tente novamente.");
        }
        const note = await response.json();
        state.ankiNotes = [note, ...state.ankiNotes];
        renderAnkiNotes("Flashcard salvo no Anki.");
        renderDetailFocus(state.activeCard);
    } catch (error) {
        renderAnkiNotes(`Erro ao criar nota. ${error.message}`);
    }
}

async function syncAnkiMature() {
    if (!state.activeCard) {
        return;
    }
    renderAnkiNotes("Atualizando status no Anki...");
    try {
        const response = await fetch(API.ankiMature(state.activeCard.id), {
            method: "POST",
            headers: { Accept: "application/json" }
        });
        if (!response.ok) {
            throw new Error("Abra o Anki e tente sincronizar novamente.");
        }
        state.ankiNotes = await response.json();
        renderAnkiNotes("Status de revisao atualizado.");
        renderDetailFocus(state.activeCard);
        await loadCards();
    } catch (error) {
        renderAnkiNotes(`Nao foi possivel sincronizar. ${error.message}`);
    }
}

async function applyReviewAction(action) {
    if (!state.activeCard) {
        return;
    }
    const url = action === "done" ? API.reviewDone(state.activeCard.id) : API.reviewSkip(state.activeCard.id);
    try {
        const response = await fetch(url, { method: "POST", headers: { Accept: "application/json" } });
        if (!response.ok) {
            throw new Error("Tente registrar a revisao novamente.");
        }
        const result = await response.json();
        updateActiveCard(result.card);
        renderMvp2Panels();
        renderBoard();
        elements.detailFormFeedback.textContent = result.message;
    } catch (error) {
        elements.detailFormFeedback.textContent = error.message;
    }
}

function updateActiveCard(card) {
    state.activeCard = card;
    state.cards = state.cards.map((item) => item.id === card.id ? card : item);
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
    renderDetailFocus(state.activeCard);
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
    renderDetailFocus(state.activeCard);
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
        const context = card.contexto || "Sem contexto";
        accumulator[context] = accumulator[context] || [];
        accumulator[context].push(card);
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

    const order = getCardOrderInfo(card);
    if (!order || order.total <= 1) {
        return "";
    }

    const isSaving = state.reorderingCardId === card.id;
    return `<div class="card-order-controls ${isSaving ? "is-saving" : ""}" aria-label="Ordenar card">
        <button class="card-order-button" type="button" data-direction="up" aria-label="Mover para posicao anterior" data-tooltip="Subir" ${order.index <= 0 || isSaving ? "disabled" : ""}>&uarr;</button>
        <span class="card-order-position" aria-label="Posicao ${order.position} de ${order.total}">${order.position}/${order.total}</span>
        <button class="card-order-button" type="button" data-direction="down" aria-label="Mover para proxima posicao" data-tooltip="Descer" ${order.index === order.total - 1 || isSaving ? "disabled" : ""}>&darr;</button>
    </div>`;
}

async function reorderCard(card, direction) {
    const siblings = getOrderedSiblings(card);
    const currentIndex = siblings.findIndex((item) => item.id === card.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= siblings.length) {
        return;
    }

    [siblings[currentIndex], siblings[targetIndex]] = [siblings[targetIndex], siblings[currentIndex]];
    const previousOrders = siblings.map((item) => ({ id: item.id, orderIndex: item.orderIndex }));
    siblings.forEach((item, index) => {
        item.orderIndex = index;
    });
    state.reorderingCardId = card.id;
    setBoardStatus("Salvando nova ordem...");
    renderBoard();

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
    } catch (error) {
        previousOrders.forEach((previous) => {
            const item = state.cards.find((cardItem) => cardItem.id === previous.id);
            if (item) {
                item.orderIndex = previous.orderIndex;
            }
        });
        setBoardStatus(error.message);
    } finally {
        state.reorderingCardId = null;
        renderBoard();
    }
}

function getCardOrderInfo(card) {
    const siblings = getOrderedSiblings(card);
    const index = siblings.findIndex((item) => item.id === card.id);

    if (index < 0 || siblings.length <= 1 || normalizeStage(card.estagio) === "ABSORVIDO") {
        return null;
    }

    return {
        index,
        position: index + 1,
        total: siblings.length
    };
}

function getOrderedSiblings(card) {
    const groupName = card.contexto || "Sem contexto";
    const stage = normalizeStage(card.estagio);

    return state.cards
        .filter((item) =>
            normalizeStage(item.estagio) === stage &&
            normalizeStage(item.estagio) !== "ABSORVIDO" &&
            (item.contexto || "Sem contexto") === groupName
        )
        .sort(sortCards);
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

    return `<button class="card-next-button" type="button" data-next-stage="${nextStage.key}">${STAGE_GUIDANCE[normalizeStage(card.estagio)].next}</button>`;
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

function openModal(targetStage = "TRIAGEM", suggestedContext = "") {
    const normalizedStage = normalizeStage(targetStage);
    state.editingCardId = null;
    state.creatingStage = normalizedStage;
    elements.modalTitle.textContent = "Novo card de estudo";
    elements.modalSubtitle.textContent = `Comece em ${stageLabel(normalizedStage)} e avance o card conforme praticar e registrar o que aprendeu.`;
    elements.saveCardButton.textContent = "Criar card";
    elements.createCardForm.reset();
    elements.priorityInput.value = "MEDIA";
    elements.contextInput.value = suggestedContext || "Geral";
    elements.typesInput.value = "";
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

function formatDate(value) {
    if (!value) {
        return "sem data";
    }
    const [year, month, day] = String(value).slice(0, 10).split("-");
    if (!year || !month || !day) {
        return value;
    }
    return `${day}/${month}/${year}`;
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

// ==========================================
// THE RECRUIT
// MEMORY ASSESSMENT
// FRONTEND + FLASK API
// ==========================================

// ------------------------------------------
// Configuration
// ------------------------------------------

const GRID_SIZE = 4;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

const SEQUENCE_LENGTH = 4;

const MEMORY_START_API = "/api/memory/start";
const MEMORY_SUBMIT_API = "/api/memory/submit";

const TIME_LIMIT = 105;

// Next assessment
const NEXT_ASSESSMENT_URL = "/cipher";

// ------------------------------------------
// State
// ------------------------------------------

let sequence = [];
let userSequence = [];

let gameStarted = false;
let showingSequence = false;

let timeRemaining = TIME_LIMIT;
let timerInterval = null;

let assessmentId = null;
let assessmentSubmitted = false;

// ------------------------------------------
// DOM Elements
// ------------------------------------------

const grid = document.getElementById("memory-grid");
const timerElement = document.getElementById("timer");

const statusText = document.getElementById("status-text");
const statusIndicator = document.getElementById("status-indicator");

const sequenceCounter =
    document.getElementById("sequence-counter");

const instructionText =
    document.getElementById("instruction-text");

const submitButton =
    document.getElementById("memory-submit");

// ------------------------------------------
// Get Assessment ID
// ------------------------------------------

function getAssessmentId() {

    const storedId =
        localStorage.getItem("assessment_id");

    if (storedId) {
        return storedId;
    }

    const camelCaseId =
        localStorage.getItem("assessmentId");

    if (camelCaseId) {
        return camelCaseId;
    }

    const params =
        new URLSearchParams(window.location.search);

    return params.get("assessment_id");
}

// ------------------------------------------
// Create Memory Grid
// ------------------------------------------

function createGrid() {

    grid.innerHTML = "";

    for (let i = 0; i < TOTAL_CELLS; i++) {

        const cell =
            document.createElement("button");

        cell.type = "button";

        cell.className = `
            memory-cell
            aspect-square
            border
            border-cyan-500/30
            bg-cyan-950/20
            transition-all
            duration-200
            hover:border-cyan-400
            hover:bg-cyan-500/10
        `;

        cell.dataset.index = i;

        cell.addEventListener(
            "click",
            () => selectCell(i, cell)
        );

        grid.appendChild(cell);
    }
}

// ------------------------------------------
// Start Memory Assessment
// ------------------------------------------

async function startMemoryAssessment() {

    try {

        statusText.textContent =
            "CONNECTING...";

        instructionText.textContent =
            "Connecting to Recruitment Headquarters...";

        statusIndicator.classList.add(
            "animate-pulse"
        );

        const response =
            await fetch(
                MEMORY_START_API,
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to start memory assessment."
            );
        }

        const backendSequence =
            data.memory_test?.sequence;

        if (!Array.isArray(backendSequence) ||
            backendSequence.length === 0) {

            throw new Error(
                "Invalid sequence received from backend."
            );
        }

        /*
         * IMPORTANT:
         *
         * Grid is 4 x 4.
         *
         * index = row * 4 + col
         */

        sequence =
            backendSequence.map(cell => {

                return (
                    Number(cell.row) * GRID_SIZE
                ) + Number(cell.col);

            });

        console.log(
            "Backend sequence:",
            backendSequence
        );

        console.log(
            "Frontend sequence:",
            sequence
        );

        createGrid();

        gameStarted = true;
        showingSequence = false;

        userSequence = [];

        updateCounter();

        submitButton.disabled = true;

        submitButton.classList.add(
            "opacity-50",
            "cursor-not-allowed"
        );

        await showSequence();

        startTimer();

    }
    catch (error) {

        console.error(
            "Memory start API error:",
            error
        );

        statusText.textContent =
            "CONNECTION ERROR";

        instructionText.textContent =
            error.message ||
            "Unable to start memory assessment.";

        statusIndicator.classList.remove(
            "animate-pulse",
            "bg-cyan-400"
        );

        statusIndicator.classList.add(
            "bg-red-500"
        );
    }
}

// ------------------------------------------
// Show Sequence
// ------------------------------------------

async function showSequence() {

    showingSequence = true;

    statusText.textContent =
        "MEMORIZE SEQUENCE";

    instructionText.textContent =
        "Observe the highlighted cells carefully.";

    const cells =
        document.querySelectorAll(
            ".memory-cell"
        );

    for (const index of sequence) {

        const cell = cells[index];

        if (!cell) {
            console.error(
                "Cell not found:",
                index
            );
            continue;
        }

        cell.classList.add(
            "bg-cyan-400",
            "border-cyan-200",
            "shadow-[0_0_25px_rgba(34,211,238,0.8)]",
            "flash-sequence"
        );

        await sleep(650);

        cell.classList.remove(
            "bg-cyan-400",
            "border-cyan-200",
            "shadow-[0_0_25px_rgba(34,211,238,0.8)]",
            "flash-sequence"
        );

        await sleep(250);
    }

    showingSequence = false;

    statusText.textContent =
        "REPRODUCE SEQUENCE";

    instructionText.textContent =
        "Select the cells in the same order.";

    statusIndicator.classList.remove(
        "animate-pulse"
    );

    statusIndicator.classList.remove(
        "bg-cyan-400"
    );

    statusIndicator.classList.add(
        "bg-green-400"
    );
}

// ------------------------------------------
// Cell Selection
// ------------------------------------------

function selectCell(index, cell) {

    if (showingSequence) {
        return;
    }

    if (!gameStarted) {
        return;
    }

    if (assessmentSubmitted) {
        return;
    }

    // Don't allow duplicate selection
    if (userSequence.includes(index)) {
        return;
    }

    userSequence.push(index);

    cell.classList.add(
        "bg-cyan-400/30",
        "border-cyan-300",
        "shadow-[0_0_15px_rgba(34,211,238,0.5)]"
    );

    updateCounter();

    const currentPosition =
        userSequence.length - 1;

    /*
     * Immediate failure if wrong cell.
     */

    if (
        sequence[currentPosition] !== index
    ) {

        handleIncorrect();

        return;
    }

    /*
     * Complete sequence.
     */

    if (
        userSequence.length ===
        sequence.length
    ) {

        handleSuccess();
    }
}

// ------------------------------------------
// Update Counter
// ------------------------------------------

function updateCounter() {

    sequenceCounter.textContent =
        `${userSequence.length} / ${
            sequence.length || SEQUENCE_LENGTH
        }`;
}

// ------------------------------------------
// Incorrect Sequence
// ------------------------------------------

function handleIncorrect() {

    if (assessmentSubmitted) {
        return;
    }

    gameStarted = false;

    clearInterval(timerInterval);

    statusText.textContent =
        "SEQUENCE FAILED";

    instructionText.textContent =
        "Incorrect sequence. Recording result...";

    statusIndicator.classList.remove(
        "bg-green-400",
        "bg-cyan-400",
        "animate-pulse"
    );

    statusIndicator.classList.add(
        "bg-red-500"
    );

    const cells =
        document.querySelectorAll(
            ".memory-cell"
        );

    userSequence.forEach(index => {

        const cell = cells[index];

        if (!cell) {
            return;
        }

        cell.classList.add(
            "bg-red-500/30",
            "border-red-500"
        );
    });

    /*
     * IMPORTANT:
     *
     * Previously this reset the game forever.
     *
     * Now we submit the failed assessment
     * and move to the next assessment.
     */

    setTimeout(
        () => {
            submitMemoryResult(false);
        },
        800
    );
}

// ------------------------------------------
// Successful Sequence
// ------------------------------------------

function handleSuccess() {

    if (assessmentSubmitted) {
        return;
    }

    gameStarted = false;

    statusText.textContent =
        "SEQUENCE VERIFIED";

    instructionText.textContent =
        "Memory sequence successfully verified.";

    statusIndicator.classList.remove(
        "animate-pulse",
        "bg-cyan-400",
        "bg-red-500"
    );

    statusIndicator.classList.add(
        "bg-green-400"
    );

    const cells =
        document.querySelectorAll(
            ".memory-cell"
        );

    userSequence.forEach(index => {

        const cell = cells[index];

        if (!cell) {
            return;
        }

        cell.classList.remove(
            "bg-cyan-400/30"
        );

        cell.classList.add(
            "bg-green-400/30",
            "border-green-400",
            "shadow-[0_0_20px_rgba(74,222,128,0.6)]"
        );
    });

    clearInterval(timerInterval);

    submitButton.disabled = false;

    submitButton.classList.remove(
        "opacity-50",
        "cursor-not-allowed"
    );
}

// ------------------------------------------
// Timer
// ------------------------------------------

function startTimer() {

    clearInterval(timerInterval);

    timerInterval =
        setInterval(
            () => {

                timeRemaining--;

                updateTimer();

                if (
                    timeRemaining <= 0
                ) {

                    clearInterval(
                        timerInterval
                    );

                    handleTimeExpired();
                }

            },
            1000
        );
}

// ------------------------------------------
// Update Timer Display
// ------------------------------------------

function updateTimer() {

    const minutes =
        Math.floor(
            timeRemaining / 60
        );

    const seconds =
        timeRemaining % 60;

    timerElement.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    if (
        timeRemaining <= 30
    ) {

        timerElement.classList.remove(
            "text-cyan-400"
        );

        timerElement.classList.add(
            "text-red-400",
            "animate-pulse"
        );
    }
}

// ------------------------------------------
// Time Expired
// ------------------------------------------

function handleTimeExpired() {

    if (assessmentSubmitted) {
        return;
    }

    gameStarted = false;

    statusText.textContent =
        "TIME EXPIRED";

    instructionText.textContent =
        "Time expired. Recording result...";

    statusIndicator.classList.remove(
        "bg-cyan-400",
        "bg-green-400"
    );

    statusIndicator.classList.add(
        "bg-red-500"
    );

    /*
     * Don't trap the candidate here.
     */

    setTimeout(
        () => {
            submitMemoryResult(false);
        },
        800
    );
}

// ------------------------------------------
// Convert index → {row, col}
// ------------------------------------------

function indexToCell(index) {

    return {
        row: Math.floor(index / GRID_SIZE),
        col: index % GRID_SIZE
    };
}

// ------------------------------------------
// Submit Memory Result
// ------------------------------------------

async function submitMemoryResult(passed) {

    if (assessmentSubmitted) {
        return;
    }

    assessmentSubmitted = true;

    assessmentId =
        getAssessmentId();

    /*
     * If assessment ID is missing,
     * still allow candidate to continue.
     *
     * This prevents the assessment from
     * becoming permanently stuck.
     */

    if (!assessmentId) {

        console.warn(
            "Assessment ID missing. Continuing to next assessment."
        );

        goToNextAssessment();

        return;
    }

    try {

        statusText.textContent =
            "TRANSMITTING";

        instructionText.textContent =
            "Submitting assessment data securely...";

        /*
         * Convert indexes back to
         * {row, col}.
         */

        const expectedCells =
            sequence.map(indexToCell);

        const selectedCells =
            userSequence.map(indexToCell);

        const response =
            await fetch(
                MEMORY_SUBMIT_API,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body: JSON.stringify({

                        expected_sequence:
                            expectedCells,

                        selected_cells:
                            selectedCells,

                        assessment_id:
                            assessmentId

                    })
                }
            );

        /*
         * Safely parse response.
         */

        let data = {};

        try {
            data = await response.json();
        }
        catch (jsonError) {
            console.warn(
                "Could not parse submission response."
            );
        }

        console.log(
            "Memory submission response:",
            data
        );

        /*
         * Even if the backend reports an error,
         * don't trap the candidate.
         */

        if (!response.ok) {

            console.error(
                "Memory submission failed:",
                data
            );

            instructionText.textContent =
                "Result recorded locally. Continuing...";
        }

        else {

            statusText.textContent =
                passed
                    ? "ASSESSMENT SAVED"
                    : "ASSESSMENT RECORDED";

            instructionText.textContent =
                passed
                    ? "Memory assessment successfully recorded."
                    : "Memory assessment completed. Continuing...";
        }

        statusIndicator.classList.remove(
            "bg-red-500"
        );

        statusIndicator.classList.add(
            "bg-green-400"
        );

    }
    catch (error) {

        /*
         * IMPORTANT:
         *
         * Don't leave the candidate stuck
         * because of a network/backend error.
         */

        console.error(
            "Memory submission error:",
            error
        );

        statusText.textContent =
            "CONTINUING";

        instructionText.textContent =
            "Unable to save result. Continuing to next assessment...";
    }

    /*
     * Always move forward.
     */

    setTimeout(
        () => {
            goToNextAssessment();
        },
        700
    );
}

// ------------------------------------------
// Next Assessment
// ------------------------------------------

function goToNextAssessment() {

    window.location.href =
        NEXT_ASSESSMENT_URL;
}

// ------------------------------------------
// Submit Button
// ------------------------------------------

submitButton.addEventListener(
    "click",
    async () => {

        if (
            userSequence.length !==
            sequence.length
        ) {

            instructionText.textContent =
                "Complete the sequence before confirming.";

            return;
        }

        await submitMemoryResult(true);
    }
);

// ------------------------------------------
// Utility
// ------------------------------------------

function sleep(milliseconds) {

    return new Promise(
        resolve => {

            setTimeout(
                resolve,
                milliseconds
            );

        }
    );
}

// ------------------------------------------
// Initialize Assessment
// ------------------------------------------

function initializeAssessment() {

    createGrid();

    assessmentId =
        getAssessmentId();

    console.log(
        "Assessment ID:",
        assessmentId
    );

    startMemoryAssessment();
}

// ------------------------------------------
// Start Application
// ------------------------------------------

initializeAssessment();
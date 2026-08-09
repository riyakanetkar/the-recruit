
// ==========================================
// THE RECRUIT
// CIPHER PROTOCOL
// BACKEND INTEGRATION
// ==========================================


const START_API =
    "/api/cipher/start";

const SUBMIT_API =
    "/api/cipher/submit";


let cipherMessages = [];

let answers = {};

let currentIndex = 0;

let assessmentId = null;

let timeLeft = 300;

let timerInterval = null;

let submitting = false;


// ==========================================
// DOM
// ==========================================

const cipherQuestion =
    document.getElementById(
        "cipher-question"
    );

const cipherInput =
    document.getElementById(
        "cipher-input"
    );

const submitButton =
    document.getElementById(
        "cipher-submit"
    );

const submitButtonText =
    document.getElementById(
        "cipher-submit-text"
    );

const currentMessage =
    document.getElementById(
        "current-message"
    );

const totalMessages =
    document.getElementById(
        "total-messages"
    );

const progressText =
    document.getElementById(
        "cipher-progress"
    );

const progressBar =
    document.getElementById(
        "cipher-progress-bar"
    );

const timer =
    document.getElementById(
        "timer"
    );

const hintElement =
    document.getElementById(
        "cipher-hint"
    );


// ==========================================
// GET ASSESSMENT ID
// ==========================================

function getAssessmentId() {

    /*
     * First check URL.
     *
     * Example:
     *
     * /cipher?assessment_id=123
     */

    const params =
        new URLSearchParams(
            window.location.search
        );


    const urlId =
        params.get(
            "assessment_id"
        );


    if (urlId) {

        return urlId;

    }


    /*
     * Then check localStorage.
     */

    const storedId =
        localStorage.getItem(
            "assessment_id"
        );


    if (storedId) {

        return storedId;

    }


    return null;

}


// ==========================================
// START CIPHER
// ==========================================

async function startCipher() {

    try {

        cipherQuestion.textContent =
            "CONNECTING TO CIPHER SERVER...";


        const response =
            await fetch(
                START_API,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const data =
            await response.json();


        console.log(
            "CIPHER START:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to start Cipher."
            );

        }


        if (!data.success) {

            throw new Error(
                data.message ||
                "Cipher could not be started."
            );

        }


        /*
         * YOUR BACKEND RETURNS:
         *
         * data.cipher_test.messages
         */

        cipherMessages =
            data.cipher_test.messages;


        if (
            !Array.isArray(
                cipherMessages
            ) ||
            cipherMessages.length === 0
        ) {

            throw new Error(
                "No cipher messages received."
            );

        }


        /*
         * Get assessment ID.
         */

        assessmentId =
            getAssessmentId();


        if (!assessmentId) {

            throw new Error(
                "Assessment ID is missing."
            );

        }


        /*
         * Reset state.
         */

        answers = {};

        currentIndex = 0;


        totalMessages.textContent =
            cipherMessages.length;


        displayMessage();


        startTimer();

    }
    catch (error) {

        console.error(
            "Cipher start error:",
            error
        );


        cipherQuestion.textContent =
            "CIPHER INITIALIZATION FAILED";


        alert(
            error.message
        );

    }

}


// ==========================================
// DISPLAY CURRENT MESSAGE
// ==========================================

function displayMessage() {

    const message =
        cipherMessages[
            currentIndex
        ];


    if (!message) {
        return;
    }


    /*
     * YOUR BACKEND FIELD:
     *
     * encrypted_message
     */

    cipherQuestion.textContent =
        message.encrypted_message;


    currentMessage.textContent =
        currentIndex + 1;


    /*
     * Restore previously entered answer
     * if the user goes backwards.
     */

    cipherInput.value =
        answers[
            message.id
        ] || "";


    /*
     * Hint
     */

    if (message.hint) {

        hintElement.textContent =
            "HINT: " +
            message.hint;

        hintElement.classList.remove(
            "hidden"
        );

    }
    else {

        hintElement.classList.add(
            "hidden"
        );

    }


    updateProgress();


    cipherInput.focus();

}


// ==========================================
// SAVE CURRENT ANSWER
// ==========================================

function saveCurrentAnswer() {

    const message =
        cipherMessages[
            currentIndex
        ];


    if (!message) {
        return;
    }


    const answer =
        cipherInput.value
            .trim()
            .toUpperCase();


    answers[
        message.id
    ] = answer;

}


// ==========================================
// NEXT MESSAGE
// ==========================================

function nextMessage() {

    saveCurrentAnswer();


    if (
        currentIndex <
        cipherMessages.length - 1
    ) {

        currentIndex++;

        displayMessage();

        return true;

    }


    return false;

}


// ==========================================
// SUBMIT ALL CIPHER ANSWERS
// ==========================================

async function submitCipher() {

    if (submitting) {
        return;
    }


    saveCurrentAnswer();


    /*
     * Make sure every message has
     * an answer.
     */

    const unanswered =
        cipherMessages.some(
            message =>
                !answers[
                    message.id
                ]
        );


    if (unanswered) {

        alert(
            "Please answer all cipher messages before submitting."
        );

        return;

    }


    if (!assessmentId) {

        alert(
            "Assessment ID is missing."
        );

        return;

    }


    submitting = true;


    submitButton.disabled =
        true;


    submitButtonText.textContent =
        "VERIFYING...";


    try {

        /*
         * YOUR BACKEND EXPECTS:
         *
         * message_ids: [...]
         *
         * answers: {
         *     "message-id": "answer"
         * }
         *
         * assessment_id: "..."
         */

        const payload = {

            message_ids:
                cipherMessages.map(
                    message =>
                        message.id
                ),

            answers:
                answers,

            assessment_id:
                assessmentId

        };


        console.log(
            "CIPHER SUBMIT:",
            payload
        );


        const response =
            await fetch(
                SUBMIT_API,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            payload
                        )

                }
            );


        const data =
            await response.json();


        console.log(
            "CIPHER RESULT:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Cipher submission failed."
            );

        }


        if (!data.success) {

            throw new Error(
                data.message ||
                "Cipher verification failed."
            );

        }


        /*
         * Backend has now:
         *
         * - checked answers
         * - calculated score
         * - updated assessment
         */

        clearInterval(
            timerInterval
        );


        const result =
            data.result;


        const score =
            result?.score ?? 0;


        progressText.textContent =
            `${score}%`;


        progressBar.style.width =
            `${score}%`;


        submitButtonText.textContent =
            "COMPLETE";


        /*
         * Move to final assessment.
         *
         * IMPORTANT:
         * This assumes your final page
         * is served at /assessment.
         */

        setTimeout(
            () => {

                window.location.href =
                    "/assessment?assessment_id=" +
                    encodeURIComponent(
                        assessmentId
                    );

            },
            1000
        );

    }
    catch (error) {

        console.error(
            "Cipher submit error:",
            error
        );


        alert(
            error.message
        );


        submitting = false;


        submitButton.disabled =
            false;


        submitButtonText.textContent =
            "DECRYPT";

    }

}


// ==========================================
// PROGRESS
// ==========================================

function updateProgress() {

    const total =
        cipherMessages.length;


    if (!total) {
        return;
    }


    const completed =
        Object.values(
            answers
        ).filter(
            answer =>
                answer &&
                answer.trim() !== ""
        ).length;


    const percentage =
        Math.round(
            (
                completed /
                total
            ) * 100
        );


    progressText.textContent =
        `${percentage}%`;


    progressBar.style.width =
        `${percentage}%`;

}


// ==========================================
// TIMER
// ==========================================

function startTimer() {

    clearInterval(
        timerInterval
    );


    updateTimer();


    timerInterval =
        setInterval(
            () => {

                timeLeft--;


                updateTimer();


                if (
                    timeLeft <= 0
                ) {

                    clearInterval(
                        timerInterval
                    );


                    submitButton.disabled =
                        true;


                    cipherInput.disabled =
                        true;


                    submitButtonText.textContent =
                        "TIME EXPIRED";


                    alert(
                        "Cipher assessment time expired."
                    );

                }

            },
            1000
        );

}


function updateTimer() {

    const minutes =
        Math.floor(
            timeLeft / 60
        );


    const seconds =
        timeLeft % 60;


    timer.textContent =
        `T-MINUS ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;


    if (
        timeLeft <= 60
    ) {

        timer.style.color =
            "#ffb4ab";

    }

}


// ==========================================
// BUTTON
// ==========================================

submitButton.addEventListener(
    "click",
    () => {

        /*
         * If we're not on the last message,
         * clicking DECRYPT moves to the next
         * message.
         */

        if (
            currentIndex <
            cipherMessages.length - 1
        ) {

            nextMessage();

            return;

        }


        /*
         * Last message:
         * submit everything to backend.
         */

        submitCipher();

    }
);


// ==========================================
// ENTER KEY
// ==========================================

cipherInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            event.preventDefault();


            submitButton.click();

        }

    }
);


// ==========================================
// START
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        startCipher();

    }
);


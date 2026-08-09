document.addEventListener("DOMContentLoaded", function () {

    /*
    ============================================================
    APTITUDE ASSESSMENT
    ============================================================

    Backend endpoints:

        GET  /api/aptitude/start
        POST /api/aptitude/submit

    The assessment_id is created by:

        POST /api/assessment/start

    and should already exist in browser storage from the
    candidate initialization flow.
    ============================================================
    */


    // =========================================================
    // DOM ELEMENTS
    // =========================================================

    const questionText =
        document.getElementById("question-text");

    const questionData =
        document.getElementById("question-data");

    const questionDataText =
        document.getElementById("question-data-text");

    const optionsContainer =
        document.getElementById("aptitude-options");

    const progressContainer =
        document.getElementById("aptitude-progress");

    const submitButton =
        document.getElementById("aptitude-submit");

    const submitText =
        document.getElementById("aptitude-submit-text");

    const errorElement =
        document.getElementById("aptitude-error");

    const timerElement =
        document.getElementById("aptitude-timer");

    const candidateIdElement =
        document.getElementById("candidate-id-display");


    // =========================================================
    // STATE
    // =========================================================

    const TOTAL_TIME = 5 * 60;

    let questions = [];

    let currentQuestionIndex = 0;

    let answers = {};

    let assessmentId = null;

    let candidateId = null;

    let timeLeft = TOTAL_TIME;

    let timerInterval = null;

    let isSubmitting = false;


    // =========================================================
    // STORAGE HELPERS
    // =========================================================

    function getStorageValue(key) {

        try {

            const sessionValue =
                sessionStorage.getItem(key);

            if (sessionValue) {
                return sessionValue;
            }


            const localValue =
                localStorage.getItem(key);

            if (localValue) {
                return localValue;
            }

        } catch (error) {

            console.warn(
                "Unable to access browser storage.",
                error
            );

        }

        return null;
    }


    function findAssessmentId() {

        const directKeys = [
            "assessment_id",
            "assessmentId",
            "assessmentID"
        ];


        for (const key of directKeys) {

            const value =
                getStorageValue(key);

            if (value) {
                return value;
            }

        }


        const objectKeys = [
            "assessment",
            "currentAssessment"
        ];


        for (const key of objectKeys) {

            const raw =
                getStorageValue(key);

            if (!raw) {
                continue;
            }


            try {

                const parsed =
                    JSON.parse(raw);


                if (parsed && parsed.id) {
                    return parsed.id;
                }


                if (
                    parsed &&
                    parsed.assessment_id
                ) {
                    return parsed.assessment_id;
                }

            } catch (error) {

                // Ignore invalid JSON.

            }

        }


        return null;
    }


    function findCandidateId() {

        const keys = [
            "candidate_id",
            "candidateId",
            "candidateID"
        ];


        for (const key of keys) {

            const value =
                getStorageValue(key);

            if (value) {
                return value;
            }

        }


        return null;
    }


    // =========================================================
    // ERROR DISPLAY
    // =========================================================

    function showError(message) {

        errorElement.textContent =
            message;

        errorElement.classList.remove(
            "hidden"
        );

    }


    function clearError() {

        errorElement.textContent = "";

        errorElement.classList.add(
            "hidden"
        );

    }


    // =========================================================
    // TIMER
    // =========================================================

    function updateTimerDisplay() {

        const minutes =
            Math.floor(timeLeft / 60);

        const seconds =
            timeLeft % 60;


        timerElement.textContent =
            `T-MINUS: ${minutes
                .toString()
                .padStart(2, "0")}:${seconds
                .toString()
                .padStart(2, "0")}`;


        if (
            timeLeft < 60 &&
            timeLeft > 0
        ) {

            timerElement.classList.add(
                "timer-warning"
            );

        }


        if (timeLeft <= 0) {

            timerElement.classList.add(
                "timer-finished"
            );

        }

    }


    function startTimer() {

        updateTimerDisplay();


        timerInterval =
            setInterval(function () {

                if (timeLeft <= 0) {

                    clearInterval(
                        timerInterval
                    );

                    submitAssessment(
                        true
                    );

                    return;
                }


                timeLeft--;


                updateTimerDisplay();


                if (timeLeft <= 0) {

                    clearInterval(
                        timerInterval
                    );

                    submitAssessment(
                        true
                    );

                }

            }, 1000);

    }


    // =========================================================
    // PROGRESS INDICATOR
    // =========================================================

    function renderProgress() {

        progressContainer.innerHTML = "";


        questions.forEach(
            function (_, index) {

                const segment =
                    document.createElement(
                        "div"
                    );


                segment.className =
                    "h-2 flex-1";


                segment.style.clipPath =
                    "polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)";


                if (
                    index <=
                    currentQuestionIndex
                ) {

                    segment.classList.add(
                        "bg-primary",
                        "opacity-80"
                    );

                } else {

                    segment.classList.add(
                        "bg-secondary/20"
                    );

                }


                progressContainer.appendChild(
                    segment
                );

            }
        );

    }


    // =========================================================
    // RENDER QUESTION
    // =========================================================

    function renderQuestion() {

        clearError();


        const question =
            questions[
                currentQuestionIndex
            ];


        if (!question) {

            showError(
                "Question could not be loaded."
            );

            return;

        }


        // -----------------------------------------------------
        // Question text
        // -----------------------------------------------------

        questionText.textContent =
            question.question || "";


        // -----------------------------------------------------
        // Optional question data
        // -----------------------------------------------------

        if (question.data_stream) {

            questionData.classList.remove(
                "hidden"
            );

            questionDataText.textContent =
                question.data_stream;

        } else {

            questionData.classList.add(
                "hidden"
            );

            questionDataText.textContent =
                "";

        }


        // -----------------------------------------------------
        // Clear old options
        // -----------------------------------------------------

        optionsContainer.innerHTML =
            "";


        // -----------------------------------------------------
        // Options
        // -----------------------------------------------------

        const options = [

            {
                letter: "A",
                text: question.option_a
            },

            {
                letter: "B",
                text: question.option_b
            },

            {
                letter: "C",
                text: question.option_c
            },

            {
                letter: "D",
                text: question.option_d
            }

        ];


        options.forEach(
            function (option) {

                const wrapper =
                    document.createElement(
                        "div"
                    );

                wrapper.className =
                    "relative";


                const input =
                    document.createElement(
                        "input"
                    );

                input.type = "radio";

                input.name =
                    "aptitude_answer";

                input.value =
                    option.letter;

                input.id =
                    `option-${option.letter}`;

                input.className =
                    "peer sr-only option-radio";


                // Restore previously selected answer

                const savedAnswer =
                    answers[
                        String(question.id)
                    ];


                if (
                    savedAnswer ===
                    option.letter
                ) {

                    input.checked =
                        true;

                }


                const label =
                    document.createElement(
                        "label"
                    );

                label.htmlFor =
                    input.id;

                label.className =
                    "option-label";


                const letter =
                    document.createElement(
                        "span"
                    );

                letter.className =
                    "option-letter";

                letter.textContent =
                    `[${option.letter}]`;


                label.appendChild(
                    letter
                );


                label.appendChild(
                    document.createTextNode(
                        ` ${option.text || ""}`
                    )
                );


                input.addEventListener(
                    "change",
                    function () {

                        answers[
                            String(question.id)
                        ] =
                            option.letter;

                        clearError();

                    }
                );


                wrapper.appendChild(
                    input
                );

                wrapper.appendChild(
                    label
                );


                optionsContainer.appendChild(
                    wrapper
                );

            }
        );


        // -----------------------------------------------------
        // Button text
        // -----------------------------------------------------

        if (
            currentQuestionIndex ===
            questions.length - 1
        ) {

            submitText.textContent =
                "SUBMIT ASSESSMENT";

        } else {

            submitText.textContent =
                "NEXT CHALLENGE";

        }


        renderProgress();

    }


    // =========================================================
    // LOAD QUESTIONS
    // =========================================================

    async function loadQuestions() {

        clearError();


        try {

            const response =
                await fetch(
                    "/api/aptitude/start",
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


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Unable to start aptitude assessment."
                );

            }


            /*
                Your backend returns:

                {
                    success: true,
                    assessment: {
                        questions: [...],
                        total_questions: 3
                    }
                }
            */

            questions =
                data.assessment &&
                Array.isArray(
                    data.assessment.questions
                )
                    ? data.assessment.questions
                    : [];


            if (
                questions.length === 0
            ) {

                throw new Error(
                    "No aptitude questions were returned by the server."
                );

            }


            // ---------------------------------------------
            // Assessment information
            // ---------------------------------------------

            assessmentId =
                findAssessmentId();

            candidateId =
                findCandidateId();


            if (candidateId) {

                candidateIdElement.textContent =
                    `CANDIDATE_ID: ${candidateId}`;

            }


            // ---------------------------------------------
            // Render first question
            // ---------------------------------------------

            renderQuestion();


            // ---------------------------------------------
            // Start five-minute timer
            // ---------------------------------------------

            startTimer();


        } catch (error) {

            console.error(
                "Aptitude initialization error:",
                error
            );


            showError(
                error.message ||
                "Unable to initialize aptitude assessment."
            );


            submitButton.disabled =
                true;

        }

    }


    // =========================================================
    // CHECK ASSESSMENT ID
    // =========================================================

    function ensureAssessmentId() {

        if (assessmentId) {
            return true;
        }


        assessmentId =
            findAssessmentId();


        if (!assessmentId) {

            showError(
                "Assessment ID is missing. Please return to candidate initialization and begin the assessment again."
            );

            return false;

        }


        return true;

    }


    // =========================================================
    // SAVE CURRENT ANSWER
    // =========================================================

    function saveCurrentAnswer() {

        const question =
            questions[
                currentQuestionIndex
            ];


        if (!question) {
            return false;
        }


        const selected =
            document.querySelector(
                'input[name="aptitude_answer"]:checked'
            );


        if (!selected) {

            showError(
                "SELECT AN ANSWER BEFORE CONTINUING."
            );

            return false;

        }


        answers[
            String(question.id)
        ] =
            selected.value;


        return true;

    }


    // =========================================================
    // SUBMIT ASSESSMENT
    // =========================================================

    async function submitAssessment(
        timedOut = false
    ) {

        if (isSubmitting) {
            return;
        }


        if (!ensureAssessmentId()) {
            return;
        }


        /*
            If time has NOT expired, make sure the
            current question has an answer.

            If time expired, submission happens
            automatically with whatever answers
            the candidate managed to submit.
        */

        if (!timedOut) {

            if (!saveCurrentAnswer()) {
                return;
            }

        }


        isSubmitting =
            true;


        submitButton.disabled =
            true;


        clearError();


        if (timerInterval) {

            clearInterval(
                timerInterval
            );

        }


        submitText.textContent =
            "PROCESSING...";


        const questionIds =
            questions.map(
                function (question) {
                    return question.id;
                }
            );


        try {

            const response =
                await fetch(
                    "/api/aptitude/submit",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"
                        },

                        body: JSON.stringify({

                            question_ids:
                                questionIds,

                            answers:
                                answers,

                            assessment_id:
                                assessmentId

                        })

                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Assessment submission failed."
                );

            }


            console.log(
                "Aptitude result:",
                data.result
            );


            /*
                Store result in case the next page
                needs to display it.
            */

            try {

                sessionStorage.setItem(
                    "aptitude_result",
                    JSON.stringify(
                        data.result
                    )
                );

            } catch (storageError) {

                console.warn(
                    "Could not save aptitude result.",
                    storageError
                );

            }


            /*
                IMPORTANT:

                Your backend returns:

                    passed: true

                only when ALL THREE questions
                are correct.

                Change these URLs if your actual
                Flask routes are different.
            */

            if (
                data.result &&
                data.result.passed
            ) {

                window.location.href =
                    "/memory";

            } else {

                window.location.href =
                    "/memory";

            }


        } catch (error) {

            console.error(
                "Aptitude submission error:",
                error
            );


            isSubmitting =
                false;


            submitButton.disabled =
                false;


            if (
                currentQuestionIndex ===
                questions.length - 1
            ) {

                submitText.textContent =
                    "SUBMIT ASSESSMENT";

            } else {

                submitText.textContent =
                    "NEXT CHALLENGE";

            }


            showError(
                error.message ||
                "Unable to submit aptitude assessment."
            );

        }

    }


    // =========================================================
    // NEXT / SUBMIT BUTTON
    // =========================================================

    submitButton.addEventListener(
        "click",
        function () {

            /*
                Question 1 → Question 2
                Question 2 → Question 3
                Question 3 → Submit
            */

            if (
                currentQuestionIndex <
                questions.length - 1
            ) {

                if (!saveCurrentAnswer()) {
                    return;
                }


                currentQuestionIndex++;


                renderQuestion();


                return;

            }


            submitAssessment(false);

        }
    );


    // =========================================================
    // START
    // =========================================================

    loadQuestions();

});
document.addEventListener("DOMContentLoaded", function () {

    // =========================================================
    // THREE.JS
    // =========================================================

    const container = document.getElementById(
        "threejs-container-ANIMATION_2"
    );

    if (!container) {
        console.warn(
            "Three.js container not found: #threejs-container-ANIMATION_2"
        );
    } else if (typeof THREE === "undefined") {
        console.error(
            "Three.js is not loaded. Make sure three.min.js is included before app.js."
        );
    } else {

        // Remove any existing canvas
        const existingCanvas =
            container.querySelector("canvas");

        if (existingCanvas) {
            existingCanvas.remove();
        }

        // -----------------------------------------------------
        // Scene
        // -----------------------------------------------------

        const scene = new THREE.Scene();

        const width =
            container.clientWidth || window.innerWidth;

        const height =
            container.clientHeight || window.innerHeight;

        const camera =
            new THREE.PerspectiveCamera(
                75,
                width / height,
                0.1,
                1000
            );

        camera.position.z = 5;

        // -----------------------------------------------------
        // Renderer
        // -----------------------------------------------------

        const renderer =
            new THREE.WebGLRenderer({
                alpha: true,
                antialias: true
            });

        renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio || 1,
                2
            )
        );

        renderer.setSize(
            width,
            height,
            false
        );

        renderer.domElement.style.display = "block";
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";

        container.appendChild(
            renderer.domElement
        );

        // -----------------------------------------------------
        // Colors
        // -----------------------------------------------------

        const electricViolet =
            new THREE.Color(0x8B5CFF);

        const neonCyan =
            new THREE.Color(0x00E5FF);

        // -----------------------------------------------------
        // Group
        // -----------------------------------------------------

        const group =
            new THREE.Group();

        scene.add(group);

        // -----------------------------------------------------
        // Particles
        // -----------------------------------------------------

        const pointsCount = 200;

        const geometry =
            new THREE.BufferGeometry();

        const positions =
            new Float32Array(
                pointsCount * 3
            );

        const colors =
            new Float32Array(
                pointsCount * 3
            );

        for (
            let i = 0;
            i < pointsCount;
            i++
        ) {

            const phi =
                Math.acos(
                    -1 +
                    (2 * i) /
                    pointsCount
                );

            const theta =
                Math.sqrt(
                    pointsCount *
                    Math.PI
                ) * phi;

            const x =
                Math.cos(theta) *
                Math.sin(phi) *
                2;

            const y =
                Math.sin(theta) *
                Math.sin(phi) *
                2.5;

            const z =
                Math.cos(phi) *
                2;

            positions[i * 3] =
                x +
                (Math.random() - 0.5) *
                0.5;

            positions[i * 3 + 1] =
                y +
                (Math.random() - 0.5) *
                0.5;

            positions[i * 3 + 2] =
                z +
                (Math.random() - 0.5) *
                0.5;

            const mixedColor =
                electricViolet
                    .clone()
                    .lerp(
                        neonCyan,
                        Math.random() * 0.3
                    );

            colors[i * 3] =
                mixedColor.r;

            colors[i * 3 + 1] =
                mixedColor.g;

            colors[i * 3 + 2] =
                mixedColor.b;
        }

        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(
                positions,
                3
            )
        );

        geometry.setAttribute(
            "color",
            new THREE.BufferAttribute(
                colors,
                3
            )
        );

        // -----------------------------------------------------
        // Particle material
        // -----------------------------------------------------

        const pointsMaterial =
            new THREE.PointsMaterial({

                size: 0.08,

                vertexColors: true,

                transparent: true,

                opacity: 0.8,

                blending:
                    THREE.AdditiveBlending,

                depthWrite: false
            });

        const points =
            new THREE.Points(
                geometry,
                pointsMaterial
            );

        group.add(points);

        // -----------------------------------------------------
        // Connecting lines
        // -----------------------------------------------------

        const lineMaterial =
            new THREE.LineBasicMaterial({

                color: electricViolet,

                transparent: true,

                opacity: 0.2,

                blending:
                    THREE.AdditiveBlending,

                depthWrite: false
            });

        const lineGeometry =
            new THREE.BufferGeometry();

        const linePositions = [];

        for (
            let i = 0;
            i < pointsCount;
            i++
        ) {

            for (
                let j = i + 1;
                j < pointsCount;
                j++
            ) {

                const dx =
                    positions[i * 3] -
                    positions[j * 3];

                const dy =
                    positions[i * 3 + 1] -
                    positions[j * 3 + 1];

                const dz =
                    positions[i * 3 + 2] -
                    positions[j * 3 + 2];

                const distance =
                    Math.sqrt(
                        dx * dx +
                        dy * dy +
                        dz * dz
                    );

                if (distance < 0.8) {

                    linePositions.push(

                        positions[i * 3],
                        positions[i * 3 + 1],
                        positions[i * 3 + 2],

                        positions[j * 3],
                        positions[j * 3 + 1],
                        positions[j * 3 + 2]

                    );
                }
            }
        }

        lineGeometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(
                linePositions,
                3
            )
        );

        const lines =
            new THREE.LineSegments(
                lineGeometry,
                lineMaterial
            );

        group.add(lines);

        // -----------------------------------------------------
        // Ambient light
        // -----------------------------------------------------

        const ambientLight =
            new THREE.AmbientLight(
                0xffffff,
                0.5
            );

        scene.add(ambientLight);

        // -----------------------------------------------------
        // Resize
        // -----------------------------------------------------

        function resize() {

            const newWidth =
                container.clientWidth ||
                window.innerWidth;

            const newHeight =
                container.clientHeight ||
                window.innerHeight;

            if (
                newWidth === 0 ||
                newHeight === 0
            ) {
                return;
            }

            camera.aspect =
                newWidth / newHeight;

            camera.updateProjectionMatrix();

            renderer.setSize(
                newWidth,
                newHeight,
                false
            );
        }

        window.addEventListener(
            "resize",
            resize
        );

        // -----------------------------------------------------
        // Animation
        // -----------------------------------------------------

        function animate() {

            requestAnimationFrame(
                animate
            );

            group.rotation.y += 0.002;
            group.rotation.x += 0.001;

            const time =
                Date.now() * 0.001;

            pointsMaterial.opacity =
                0.6 +
                Math.sin(time * 2) *
                0.2;

            renderer.render(
                scene,
                camera
            );
        }

        resize();
        animate();
    }


// =========================================================
// CANDIDATE INITIALIZATION MODAL
// =========================================================

const initializeButton =
    document.getElementById("initialize-assessment");

const candidateModal =
    document.getElementById("candidateModal");

const closeModalButton =
    document.getElementById("closeModalBtn");

const candidateName =
    document.getElementById("candidateName");

const candidateError =
    document.getElementById("candidateError");

const beginAssessmentButton =
    document.getElementById("beginAssessmentBtn");


// =========================================================
// OPEN MODAL
// =========================================================

if (initializeButton && candidateModal) {

    initializeButton.addEventListener("click", function () {

        candidateModal.classList.remove("hidden");

        if (candidateName) {
            candidateName.value = "";
            candidateName.focus();
        }

        if (candidateError) {
            candidateError.textContent = "";
            candidateError.classList.add("hidden");
        }

    });

}


// =========================================================
// CLOSE MODAL
// =========================================================

if (closeModalButton && candidateModal) {

    closeModalButton.addEventListener("click", function () {

        candidateModal.classList.add("hidden");

    });

}


// =========================================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// =========================================================

if (candidateModal) {

    candidateModal.addEventListener("click", function (event) {

        if (event.target === candidateModal) {
            candidateModal.classList.add("hidden");
        }

    });

}


// =========================================================
// BEGIN ASSESSMENT
// =========================================================

if (beginAssessmentButton && candidateName) {

    beginAssessmentButton.addEventListener(
        "click",
        async function () {

            const name = candidateName.value.trim();


            // -------------------------------------------------
            // CHECK NAME
            // -------------------------------------------------

            if (!name) {

                if (candidateError) {
                    candidateError.textContent =
                        "IDENTITY REQUIRED // ENTER YOUR NAME";

                    candidateError.classList.remove("hidden");
                }

                candidateName.focus();

                return;
            }


            // -------------------------------------------------
            // CLEAR ERROR
            // -------------------------------------------------

            if (candidateError) {
                candidateError.textContent = "";
                candidateError.classList.add("hidden");
            }


            // -------------------------------------------------
            // TEMPORARILY DISABLE BUTTON
            // -------------------------------------------------

            const originalButtonHTML =
                beginAssessmentButton.innerHTML;

            beginAssessmentButton.disabled = true;

            beginAssessmentButton.innerHTML =
                "INITIALIZING...";


            try {

                // =================================================
                // STEP 1: CREATE CANDIDATE
                // =================================================

                const candidateResponse = await fetch(
                    "/api/candidate/start",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },

                        body: JSON.stringify({
                            name: name
                        })
                    }
                );


                const candidateData =
                    await candidateResponse.json();


                if (
                    !candidateResponse.ok ||
                    !candidateData.success
                ) {

                    throw new Error(
                        candidateData.message ||
                        "Failed to create candidate."
                    );

                }


                const candidate =
                    candidateData.candidate;


                // Make sure we received the UUID

                if (!candidate || !candidate.id) {

                    throw new Error(
                        "Candidate ID was not returned by the server."
                    );

                }


                console.log(
                    "Candidate created:",
                    candidate
                );


                // =================================================
                // STEP 2: CREATE ASSESSMENT
                // =================================================

                const assessmentResponse = await fetch(
                    "/api/assessment/start",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },

                        body: JSON.stringify({
                            candidate_id: candidate.id
                        })
                    }
                );


                const assessmentData =
                    await assessmentResponse.json();


                if (
                    !assessmentResponse.ok ||
                    !assessmentData.success
                ) {

                    throw new Error(
                        assessmentData.message ||
                        "Failed to create assessment."
                    );

                }


                const assessment =
                    assessmentData.assessment;


                if (!assessment || !assessment.id) {

                    throw new Error(
                        "Assessment ID was not returned by the server."
                    );

                }


                console.log(
                    "Assessment created:",
                    assessment
                );


                // =================================================
                // STEP 3: SAVE INFORMATION
                // =================================================

                sessionStorage.setItem(
                    "candidateName",
                    name
                );

                sessionStorage.setItem(
                    "candidate_id",
                    String(candidate.id)
                );

                sessionStorage.setItem(
                    "assessment_id",
                    String(assessment.id)
                );

                sessionStorage.setItem(
                    "candidate",
                    JSON.stringify(candidate)
                );

                sessionStorage.setItem(
                    "assessment",
                    JSON.stringify(assessment)
                );


                // =================================================
                // STEP 4: GO TO APTITUDE PAGE
                // =================================================

                window.location.href = "/aptitude";


            } catch (error) {

                console.error(
                    "Assessment initialization failed:",
                    error
                );


                if (candidateError) {

                    candidateError.textContent =
                        error.message ||
                        "ASSESSMENT INITIALIZATION FAILED";

                    candidateError.classList.remove("hidden");

                }


                // Restore button

                beginAssessmentButton.disabled = false;

                beginAssessmentButton.innerHTML =
                    originalButtonHTML;

            }

        }
    );

}

});
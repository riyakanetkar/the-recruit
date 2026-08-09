document.addEventListener("DOMContentLoaded", () => {
    const candidateNameEl = document.getElementById("candidate-name");
    const candidateIdEl = document.getElementById("candidate-id");
    const beginButton = document.getElementById("begin-assessment");
    const returnButton = document.getElementById("return-home");

    const candidate = JSON.parse(
        localStorage.getItem("recruitCandidate") || "null"
    );

    // -----------------------------
    // CANDIDATE DATA
    // -----------------------------

    if (!candidate) {
        if (candidateNameEl) {
            candidateNameEl.textContent = "NO CANDIDATE";
        }

        if (candidateIdEl) {
            candidateIdEl.textContent = "NOT FOUND";
        }

        if (beginButton) {
            beginButton.disabled = true;
            beginButton.classList.add(
                "opacity-50",
                "cursor-not-allowed"
            );
        }
    } else {
        if (candidateNameEl) {
            candidateNameEl.textContent =
                candidate.name || "UNKNOWN";
        }

        if (candidateIdEl) {
            candidateIdEl.textContent =
                candidate.id ||
                candidate.candidate_id ||
                "UNKNOWN";
        }
    }

    // -----------------------------
    // RETURN TO HOME
    // -----------------------------

    if (returnButton) {
        returnButton.addEventListener("click", () => {
            window.location.href = "/";
        });
    }

    // -----------------------------
    // BEGIN ASSESSMENT
    // -----------------------------

    if (beginButton) {
        beginButton.addEventListener("click", () => {
            if (!candidate) return;

            window.location.href = "/assessment";
        });
    }

    // -----------------------------
    // STITCH WEBGL BACKGROUND
    // -----------------------------

    const canvas = document.getElementById(
        "shader-canvas-ANIMATION_8"
    );

    if (!canvas) return;

    function syncSize() {
        const w = canvas.clientWidth || 1280;
        const h = canvas.clientHeight || 720;

        if (
            canvas.width !== w ||
            canvas.height !== h
        ) {
            canvas.width = w;
            canvas.height = h;
        }
    }

    if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(syncSize).observe(canvas);
    }

    syncSize();

    const gl =
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");

    if (!gl) {
        console.error("WebGL is not supported.");
        return;
    }

    // -----------------------------
    // VERTEX SHADER
    // -----------------------------

    const vs = `
        attribute vec2 a_position;

        varying vec2 v_texCoord;

        void main() {
            v_texCoord = a_position * 0.5 + 0.5;

            gl_Position = vec4(
                a_position,
                0.0,
                1.0
            );
        }
    `;

    // -----------------------------
    // FRAGMENT SHADER
    // -----------------------------

    const fs = `
        precision highp float;

        uniform float u_time;
        uniform vec2 u_resolution;

        varying vec2 v_texCoord;

        float hash(vec2 p) {
            p = fract(
                p * vec2(123.34, 456.21)
            );

            p += dot(
                p,
                p + 45.32
            );

            return fract(
                p.x * p.y
            );
        }

        void main() {

            vec2 uv = v_texCoord;

            vec2 fragCoord =
                uv * u_resolution;

            // Base background
            vec3 color =
                vec3(
                    0.05,
                    0.05,
                    0.07
                );

            // Main grid
            vec2 grid =
                fract(
                    fragCoord / 40.0
                );

            float line =
                step(0.98, grid.x) +
                step(0.98, grid.y);

            color +=
                line *
                vec3(
                    0.1,
                    0.1,
                    0.15
                ) *
                (
                    0.5 +
                    0.5 *
                    sin(
                        u_time * 0.5
                    )
                );

            // Sub-grid
            vec2 subgrid =
                fract(
                    fragCoord / 10.0
                );

            float subline =
                step(0.99, subgrid.x) +
                step(0.99, subgrid.y);

            color +=
                subline *
                vec3(
                    0.05,
                    0.05,
                    0.08
                );

            // Scanline
            float scanline =
                sin(
                    fragCoord.y * 0.5 +
                    u_time * 5.0
                ) * 0.02;

            color += scanline;

            // Digital particles
            float n =
                hash(
                    uv +
                    floor(
                        u_time * 10.0
                    ) * 0.001
                );

            if (n > 0.998) {

                float glow =
                    smoothstep(
                        1.0,
                        0.0,
                        length(
                            uv -
                            vec2(
                                hash(uv),
                                hash(
                                    uv + 1.0
                                )
                            )
                        )
                    );

                color +=
                    vec3(
                        0.545,
                        0.361,
                        1.0
                    ) *
                    glow *
                    0.5;
            }

            // Vignette
            float dist =
                length(
                    uv - 0.5
                );

            color *=
                1.0 -
                dist * 0.5;

            gl_FragColor =
                vec4(
                    color,
                    1.0
                );
        }
    `;

    // -----------------------------
    // SHADER COMPILATION
    // -----------------------------

    function compileShader(type, source) {

        const shader =
            gl.createShader(type);

        gl.shaderSource(
            shader,
            source
        );

        gl.compileShader(shader);

        if (
            !gl.getShaderParameter(
                shader,
                gl.COMPILE_STATUS
            )
        ) {

            console.error(
                gl.getShaderInfoLog(shader)
            );

            gl.deleteShader(shader);

            return null;
        }

        return shader;
    }

    const vertexShader =
        compileShader(
            gl.VERTEX_SHADER,
            vs
        );

    const fragmentShader =
        compileShader(
            gl.FRAGMENT_SHADER,
            fs
        );

    if (
        !vertexShader ||
        !fragmentShader
    ) {
        return;
    }

    // -----------------------------
    // CREATE WEBGL PROGRAM
    // -----------------------------

    const program =
        gl.createProgram();

    gl.attachShader(
        program,
        vertexShader
    );

    gl.attachShader(
        program,
        fragmentShader
    );

    gl.linkProgram(program);

    if (
        !gl.getProgramParameter(
            program,
            gl.LINK_STATUS
        )
    ) {

        console.error(
            gl.getProgramInfoLog(program)
        );

        return;
    }

    gl.useProgram(program);

    // -----------------------------
    // FULL SCREEN QUAD
    // -----------------------------

    const buffer =
        gl.createBuffer();

    gl.bindBuffer(
        gl.ARRAY_BUFFER,
        buffer
    );

    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]),
        gl.STATIC_DRAW
    );

    const position =
        gl.getAttribLocation(
            program,
            "a_position"
        );

    gl.enableVertexAttribArray(
        position
    );

    gl.vertexAttribPointer(
        position,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    // -----------------------------
    // SHADER UNIFORMS
    // -----------------------------

    const uTime =
        gl.getUniformLocation(
            program,
            "u_time"
        );

    const uRes =
        gl.getUniformLocation(
            program,
            "u_resolution"
        );

    // -----------------------------
    // RENDER LOOP
    // -----------------------------

    function render(time) {

        if (
            typeof ResizeObserver ===
            "undefined"
        ) {
            syncSize();
        }

        gl.viewport(
            0,
            0,
            canvas.width,
            canvas.height
        );

        gl.uniform1f(
            uTime,
            time * 0.001
        );

        gl.uniform2f(
            uRes,
            canvas.width,
            canvas.height
        );

        gl.drawArrays(
            gl.TRIANGLE_STRIP,
            0,
            4
        );

        requestAnimationFrame(
            render
        );
    }

    requestAnimationFrame(render);
});
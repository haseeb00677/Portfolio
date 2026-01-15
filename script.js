const root = document.documentElement;

const THEMES = [
    { name: "Deep Purple", accent: "#7a2cff" },
    { name: "Pink", accent: "#ff3bd4" },
    { name: "Electric Blue", accent: "#1f6bff" },
];

let themeIndex = 0;

function applyTheme(idx) {
    themeIndex = ((idx % THEMES.length) + THEMES.length) % THEMES.length;
    root.style.setProperty("--accent", THEMES[themeIndex].accent);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEMES[themeIndex].accent);
}
function nextTheme() { applyTheme(themeIndex + 1); }
applyTheme(themeIndex);

// Gentle auto-cycle; stops after user interaction
let autoCycle = true;
setInterval(() => { if (autoCycle) nextTheme(); }, 6500);

document.getElementById("themeToggle")?.addEventListener("click", () => {
    autoCycle = false;
    nextTheme();
});

// Mouse-reactive aurora focal point
let rafPending = false;
function onPointerMove(e) {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        root.style.setProperty("--mx", `${x.toFixed(2)}%`);
        root.style.setProperty("--my", `${y.toFixed(2)}%`);
        rafPending = false;
    });
}
window.addEventListener("pointermove", onPointerMove, { passive: true });
document.documentElement.style.scrollBehavior = "smooth";

// Scroll reveal
const revealEls = Array.from(document.querySelectorAll(".reveal"));
const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });
revealEls.forEach((el) => io.observe(el));

/* Click ripple */
function addRipple(el, clientX, clientY) {
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
}
document.querySelectorAll(".iridescent").forEach((el) => {
    el.addEventListener("pointerdown", (e) => {
        addRipple(el, e.clientX, e.clientY);
        autoCycle = false;
    }, { passive: true });
});

/* Modal */
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");

const PROJECT_DETAILS = {
    spend: {
        title: "Corporate Spend Approval Engine",
        meta: "Python • Flask • SQL/SQLite",
        bullets: [
            "Multi-tier routing (auto / manager / VP) using dynamic thresholds.",
            "Fraud checks for duplicates and policy violations in real time.",
            "Audit-first schema with immutable logs and traceable state transitions.",
        ],
        next: "Build a real front-end dashboard (roles, queues, audit view), then add auth + analytics."
    },
    physics: {
        title: "2D Physics Simulation Engine",
        meta: "C++ • SFML",
        bullets: [
            "Realtime simulation with gravity and collision handling at 60 FPS.",
            "Optimized entity management to support 50+ active objects smoothly.",
            "Modular foundation for future particle systems and tooling.",
        ],
        next: "Support more shapes (boxes/polygons), add friction, and constraints/joints."
    },
    topography: {
        title: "Topography Animation Visual Interactive",
        meta: "C++ • SFML",
        bullets: [
            "Fluid ring/tube geometry with smooth motion and 3D projection.",
            "Mouse-driven mode blending (twist / vertical wave / spiral flow).",
            "Glow-style rendering via layered passes (core + aura).",
        ],
        next: "Add presets + UI controls, optimize batching further, add fullscreen toggle + export/recording."
    },
    vehicle: {
        title: "Autonomous Assistive Vehicle Prototype",
        meta: "Leadership • University Project",
        bullets: [
            "Leadership-focused build: coordinated timeline, roles, and iteration milestones.",
            "Guided design tradeoffs and testing priorities to keep the project moving.",
            "Emphasized practical execution: reliability, safety considerations, and documentation."
        ],
        next: "Add sensors + closed-loop control, then autonomy (navigation + obstacle avoidance)."
    }

};

function openModal(projectKey) {
    if (!modal || !modalContent) return;
    const data = PROJECT_DETAILS[projectKey];
    if (!data) return;

    modalContent.innerHTML = `
    <h3>${escapeHtml(data.title)}</h3>
    <div class="meta">${escapeHtml(data.meta)}</div>
    <ul>${data.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>
    <div class="nextBlock"><strong>Next steps:</strong> ${escapeHtml(data.next)}</div>
  `;

    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    modal.querySelector(".modal__close")?.focus();
}

function closeModal() {
    if (!modal) return;
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

document.querySelectorAll(".js-learn").forEach((btn) => {
    btn.addEventListener("click", () => {
        autoCycle = false;
        const card = btn.closest(".card");
        const key = card?.getAttribute("data-project");
        if (key) openModal(key);
    });
});

modal?.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.close === "true") closeModal();
});
window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

/* ============================
   Previews: Physics + Topography
   ============================ */
const canvases = Array.from(document.querySelectorAll("canvas.previewCanvas"));
const previews = new Map();

function setupCanvas(canvas) {
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return null;

    const state = {
        canvas,
        ctx,
        w: 0,
        h: 0,
        dpr: Math.max(1, Math.min(2, window.devicePixelRatio || 1)),
        mx: 0.5,
        my: 0.5,
        isActive: false,
        type: canvas.dataset.preview || "",
    };

    function resize() {
        const rect = canvas.getBoundingClientRect();
        state.w = Math.max(1, Math.floor(rect.width));
        state.h = Math.max(1, Math.floor(rect.height));
        canvas.width = Math.floor(state.w * state.dpr);
        canvas.height = Math.floor(state.h * state.dpr);
        ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    canvas.addEventListener("pointermove", (e) => {
        const r = canvas.getBoundingClientRect();
        state.mx = (e.clientX - r.left) / r.width;
        state.my = (e.clientY - r.top) / r.height;
    }, { passive: true });

    canvas.addEventListener("pointerenter", () => { state.isActive = true; }, { passive: true });
    canvas.addEventListener("pointerleave", () => { state.isActive = false; }, { passive: true });

    return state;
}

/* Physics preview */
function makePhysics(state) {
    const balls = [];
    const gravity = 900;
    const bounce = 0.78;
    const maxBalls = 18;

    function spawn(xNorm = 0.5, yNorm = 0.25) {
        if (balls.length >= maxBalls) balls.shift();
        const r = 6 + Math.random() * 7;
        balls.push({
            x: xNorm * state.w,
            y: yNorm * state.h,
            vx: (Math.random() * 2 - 1) * 140,
            vy: (Math.random() * 2 - 1) * 80,
            r,
        });
    }
    for (let i = 0; i < 10; i++) spawn(Math.random(), Math.random() * 0.4 + 0.05);

    state.canvas.addEventListener("pointerdown", (e) => {
        autoCycle = false;
        const r = state.canvas.getBoundingClientRect();
        spawn((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    });

    return {
        step(dt) {
            const tx = (state.mx - 0.5) * 60;
            for (const b of balls) {
                b.vx += tx * dt;
                b.vy += gravity * dt;
                b.x += b.vx * dt;
                b.y += b.vy * dt;

                if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx) * bounce; }
                if (b.x + b.r > state.w) { b.x = state.w - b.r; b.vx = -Math.abs(b.vx) * bounce; }
                if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy) * bounce; }
                if (b.y + b.r > state.h) { b.y = state.h - b.r; b.vy = -Math.abs(b.vy) * bounce; }
            }

            for (let i = 0; i < balls.length; i++) {
                for (let j = i + 1; j < balls.length; j++) {
                    const a = balls[i], b = balls[j];
                    const dx = b.x - a.x, dy = b.y - a.y;
                    const dist = Math.hypot(dx, dy) || 0.0001;
                    const min = a.r + b.r;
                    if (dist < min) {
                        const overlap = (min - dist) * 0.5;
                        const nx = dx / dist, ny = dy / dist;
                        a.x -= nx * overlap; a.y -= ny * overlap;
                        b.x += nx * overlap; b.y += ny * overlap;
                    }
                }
            }
        },
        draw() {
            const { ctx, w, h } = state;
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = "rgba(255,255,255,0.03)";
            ctx.fillRect(0, 0, w, h);

            ctx.globalAlpha = 0.92;
            for (const b of balls) {
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(255,255,255,0.78)";
                ctx.fill();

                ctx.beginPath();
                ctx.arc(b.x, b.y, b.r + 2, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(255,255,255,0.14)";
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
    };
}

/* Topography preview — simplified version of your topology.cpp */
function makeTopography(state) {
    // Keep it fast (stable ~60fps) and still “your project”
    const RINGS = 54;     // (your C++ uses 100)
    const TUBE = 22;      // (your C++ uses 40)
    const pts = new Float32Array((RINGS * TUBE) * 3);  // x,y,z for each point
    const scr = new Float32Array((RINGS * TUBE) * 2);  // sx,sy cache

    // smoothing like your heavy damping
    let modeTransition = 0.0;
    let angleX = 0.0;
    let angleY = 0.0;

    // palette cycle vibe (maps to your purple/pink/blue)
    const palette = [
        [122, 44, 255],
        [255, 59, 212],
        [31, 107, 255],
    ];
    let colorIndex = 0;
    let colorTime = 0;

    function lerp(a, b, t) { return a + (b - a) * t; }
    function lerpColor(c1, c2, t) {
        return [
            Math.round(lerp(c1[0], c2[0], t)),
            Math.round(lerp(c1[1], c2[1], t)),
            Math.round(lerp(c1[2], c2[2], t))
        ];
    }

    function rotate(x, y, z, ax, ay) {
        // rotate around X then Y (close enough to your vibe)
        const cx = Math.cos(ax), sx = Math.sin(ax);
        const cy = Math.cos(ay), sy = Math.sin(ay);

        // X
        let y1 = y * cx - z * sx;
        let z1 = y * sx + z * cx;
        let x1 = x;

        // Y
        let x2 = x1 * cy + z1 * sy;
        let z2 = -x1 * sy + z1 * cy;
        let y2 = y1;

        return [x2, y2, z2];
    }

    function project(x, y, z, w, h) {
        // simple perspective like your project(p, 400,400,-150)
        const camZ = -150;
        const f = 420;
        const depth = (z - camZ);
        const s = f / Math.max(1, depth);
        const sx = w * 0.5 + x * s;
        const sy = h * 0.52 + y * s;
        return [sx, sy, s];
    }

    function buildGeometry(t) {
        const w = state.w, h = state.h;

        // continuous mode target (your mouse X mapped 0..2)
        const targetMode = (state.mx) * 2.0; // 0..2
        modeTransition += (targetMode - modeTransition) * 0.04; // heavy damping

        // rotation targets (your mouse affects angle, with damping)
        const targetAx = (state.my - 0.5) * 0.9 + t * 0.2;
        const targetAy = (state.mx - 0.5) * 0.9 + t * 0.2;
        angleX += (targetAx - angleX) * 0.04;
        angleY += (targetAy - angleY) * 0.04;

        let mode0Factor, mode1Factor, mode2Factor;
        if (modeTransition < 1.0) {
            mode0Factor = 1.0 - modeTransition;
            mode1Factor = modeTransition;
            mode2Factor = 0.0;
        } else {
            mode0Factor = 0.0;
            mode1Factor = 2.0 - modeTransition;
            mode2Factor = modeTransition - 1.0;
        }

        let idx = 0;
        let sid = 0;

        for (let i = 0; i < RINGS; i++) {
            const theta = (i / RINGS) * Math.PI * 2;

            // base breathing (scaled down)
            const breathing = 70 + Math.sin(t * 0.7 + theta * 2.0) * 9;

            for (let j = 0; j < TUBE; j++) {
                const phi = (j / TUBE) * Math.PI * 2;

                // tube wobble
                const tubeWobble = 14 + Math.sin(t * 1.2 + phi * 2.0 + theta) * 3.2;

                // mode 0: gentle twist
                const twist0 = Math.sin(t * 0.5) * 0.4;
                const verticalWave0 = 0.0;
                const spiralFlow0 = 0.0;

                // mode 1: vertical undulation
                const twist1 = Math.cos(t * 0.6 + theta * 1.5) * 0.35;
                const verticalWave1 = Math.sin(theta * 2.0 - t * 0.8) * 8.0;
                const spiralFlow1 = 0.0;

                // mode 2: spiral flow
                const twist2 = Math.sin(t * 0.7 + theta) * 0.45;
                const verticalWave2 = 0.0;
                const spiralFlow2 = Math.cos(phi * 1.5 + t * 0.9) * 6.0;

                const twist = twist0 * mode0Factor + twist1 * mode1Factor + twist2 * mode2Factor;
                const verticalWave = verticalWave0 * mode0Factor + verticalWave1 * mode1Factor + verticalWave2 * mode2Factor;
                const spiralFlow = spiralFlow0 * mode0Factor + spiralFlow1 * mode1Factor + spiralFlow2 * mode2Factor;

                const rr = breathing + tubeWobble * Math.cos(phi);
                let rawX = rr * Math.cos(theta);
                let rawY = rr * Math.sin(theta) + verticalWave;
                let rawZ = tubeWobble * Math.sin(phi) + spiralFlow;

                // apply twist (like your tx/ty)
                const c = Math.cos(twist), s = Math.sin(twist);
                const tx = rawX * c - rawY * s;
                const ty = rawX * s + rawY * c;

                // rotate in 3D
                const [rx, ry, rz] = rotate(tx, ty, rawZ, angleX, angleY);

                pts[idx++] = rx;
                pts[idx++] = ry;
                pts[idx++] = rz;

                const [sx, sy] = project(rx, ry, rz, w, h);
                scr[sid++] = sx;
                scr[sid++] = sy;
            }
        }
    }

    function drawTube(ctx) {
        const w = state.w, h = state.h;

        // palette cycling (like your 3-second lerp)
        colorTime += 1 / 60;
        if (colorTime > 3.0) {
            colorTime = 0;
            colorIndex = (colorIndex + 1) % palette.length;
        }
        const c1 = palette[colorIndex];
        const c2 = palette[(colorIndex + 1) % palette.length];
        const cc = lerpColor(c1, c2, colorTime / 3.0);

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "rgba(255,255,255,0.02)";
        ctx.fillRect(0, 0, w, h);

        // draw rings as connected polylines (faster than triangles)
        // two-pass: glow + core (lightweight)
        const glow = `rgba(${cc[0]},${cc[1]},${cc[2]},0.08)`;
        const core = `rgba(${cc[0]},${cc[1]},${cc[2]},0.18)`;

        // glow pass
        ctx.lineWidth = 3.2;
        ctx.strokeStyle = glow;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        let sid = 0;
        for (let i = 0; i < RINGS; i++) {
            ctx.beginPath();
            for (let j = 0; j < TUBE; j++) {
                const sx = scr[sid++], sy = scr[sid++];
                if (j === 0) ctx.moveTo(sx, sy);
                else ctx.lineTo(sx, sy);
            }
            // close
            const sx0 = scr[(i * TUBE) * 2], sy0 = scr[(i * TUBE) * 2 + 1];
            ctx.lineTo(sx0, sy0);
            ctx.stroke();
        }

        // core pass
        ctx.lineWidth = 1.3;
        ctx.strokeStyle = core;

        sid = 0;
        for (let i = 0; i < RINGS; i++) {
            ctx.beginPath();
            for (let j = 0; j < TUBE; j++) {
                const sx = scr[sid++], sy = scr[sid++];
                if (j === 0) ctx.moveTo(sx, sy);
                else ctx.lineTo(sx, sy);
            }
            const sx0 = scr[(i * TUBE) * 2], sy0 = scr[(i * TUBE) * 2 + 1];
            ctx.lineTo(sx0, sy0);
            ctx.stroke();
        }

        // subtle focus ring
        const mx = state.mx * w;
        const my = state.my * h;
        ctx.beginPath();
        ctx.arc(mx, my, state.isActive ? 26 : 20, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    return {
        step() { },
        draw(t) {
            buildGeometry(t);
            drawTube(state.ctx);
        }
    };
}

/* Init previews */
function initPreviews() {
    canvases.forEach((canvas) => {
        const state = setupCanvas(canvas);
        if (!state) return;

        let impl = null;
        if (state.type === "physics") impl = makePhysics(state);
        if (state.type === "topography") impl = makeTopography(state);

        if (!impl) return;
        previews.set(canvas, { state, impl });
    });
}

initPreviews();

// Stable RAF (keeps it smooth)
let last = performance.now();
function tick(now) {
    const dt = Math.min(0.032, (now - last) / 1000);
    last = now;

    for (const { impl } of previews.values()) {
        impl.step(dt);
        impl.draw(now / 1000);
    }
    requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

/* Contact form (UI-only) */
const contactForm = document.getElementById("contactForm");
const statusEl = document.getElementById("formStatus");
const PUBLIC_EMAIL = "hhaseeb.aahmed006@gmail.com";

document.getElementById("copyEmail")?.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(PUBLIC_EMAIL);
        if (statusEl) statusEl.textContent = "Email copied to clipboard.";
    } catch {
        if (statusEl) statusEl.textContent = "Couldn’t copy. You can manually copy the email above.";
    }
});

contactForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    autoCycle = false;

    const fd = new FormData(contactForm);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const message = String(fd.get("message") || "").trim();

    if (!name || !email || !message) {
        if (statusEl) statusEl.textContent = "Please fill in all fields.";
        return;
    }

    const subject = encodeURIComponent(`Portfolio contact — ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}\n`);
    window.location.href = `mailto:${PUBLIC_EMAIL}?subject=${subject}&body=${body}`;
    if (statusEl) statusEl.textContent = "Opening your email client…";
});

document.getElementById("year").textContent = String(new Date().getFullYear());

function escapeHtml(str) {
    return str
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

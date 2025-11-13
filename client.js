const socket = io();

// --- ELEMENTOS DOM ---
const loginContainer = document.getElementById('login-container');
const nomeInput = document.getElementById('nome-input');
const entrarBtn = document.getElementById('entrar-btn');
const feedbackMsg = document.getElementById('feedback-msg');
const colorSwatches = document.querySelectorAll('.color-swatch');
const gameScreen = document.getElementById('game-screen');
const nomeJogadorSpan = document.getElementById('nome-jogador');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const coordsDebug = document.getElementById('coords-debug');

// --- CONSTANTES ---
const TILE_SIZE = 50;
const PLAYER_RADIUS = TILE_SIZE * 0.4;
// VELOCIDADE DE ANIMAÇÃO REDUZIDA PARA MAIS SUAVIDADE
const VELOCIDADE_ANIM = 0.15; // 0.15 é mais suave que 0.3

// --- ESTADO DO JOGO ---
let meuJogador = null;
let outrosJogadores = {};
let selectedColor = '#0a7aff';
let pathFindingTarget = null;
let movementQueue = []; // Fila de movimentos

// --- CÂMERA E INPUT ---
let camera = { x: 0, y: 0, zoom: 1.0 };
let isPanning = false;
let lastMousePos = { x: 0, y: 0 };
let isCameraLocked = false;

// --- RÉGUA ---
let isRulerActive = false;
let rulerEnd = { gridX: 0, gridY: 0 };
let rulerWaypoints = [];

// ============================================================================
// 1. SETUP E LOGIN
// ============================================================================

colorSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
        colorSwatches.forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        selectedColor = swatch.getAttribute('data-color');
        document.documentElement.style.setProperty('--color-accent', selectedColor);
    });
});

entrarBtn.addEventListener('click', () => {
    const nome = nomeInput.value.trim();
    if (nome.length === 0) {
        feedbackMsg.textContent = "⚠️ Por favor, digite um nome.";
        return;
    }
    feedbackMsg.textContent = "🔄 Conectando...";
    socket.emit('tentar_login', { nome: nome, cor: selectedColor });
});

nomeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') entrarBtn.click();
});

// ============================================================================
// 2. REDE (SOCKET.IO)
// ============================================================================

function setupPlayer(player) {
    player.gridX = player.gridX ?? 0;
    player.gridY = player.gridY ?? 0;
    // Posição visual inicial é EXATA
    player.x = (player.gridX * TILE_SIZE) + (TILE_SIZE / 2);
    player.y = (player.gridY * TILE_SIZE) + (TILE_SIZE / 2);
    return player;
}

socket.on('login_sucesso', (dadosDaConta) => {
    console.log("[CLIENTE] ✅ Login com sucesso!", dadosDaConta);
    meuJogador = setupPlayer(dadosDaConta);

    loginContainer.style.display = 'none';
    gameScreen.style.display = 'block';
    nomeJogadorSpan.textContent = dadosDaConta.nome;
    nomeJogadorSpan.style.color = dadosDaConta.cor;

    initCanvas();
    startGameLoop();
});

socket.on('jogadores_atuais', (players) => {
    for (const id in players) {
        if (id !== meuJogador.id) {
            outrosJogadores[id] = setupPlayer(players[id]);
        }
    }
});

socket.on('novo_jogador', (player) => {
    outrosJogadores[player.id] = setupPlayer(player);
});

socket.on('jogador_moveu_grid', (data) => {
    // ATUALIZA O ALVO LÓGICO (gridX)
    // A animação (updatePlayerMovement) fará o visual (x, y) seguir
    const player = (data.id === meuJogador.id) ? meuJogador : outrosJogadores[data.id];
    if (player) {
        player.gridX = data.gridX;
        player.gridY = data.gridY;
    }
});

socket.on('jogador_saiu', (id) => {
    delete outrosJogadores[id];
});

// ============================================================================
// 3. INPUTS E EVENTOS
// ============================================================================

function initCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    camera.x = canvas.width / 2 - meuJogador.x;
    camera.y = canvas.height / 2 - meuJogador.y;

    // --- CLICK (MOVIMENTO) ---
    canvas.addEventListener('click', (e) => {
        const pos = getMouseGridPos();

        if (isRulerActive) {
            movementQueue = rulerWaypoints.map(p => ({ gridX: p.gridX, gridY: p.gridY }));
            movementQueue.push({ gridX: pos.gridX, gridY: pos.gridY });
            
            console.log(`[CLIENTE] 🏃 Executando fila de ${movementQueue.length} passos`);

            pathFindingTarget = null; // Força o update a pegar da fila
            isRulerActive = false;
            rulerWaypoints = [];
        } else {
            movementQueue = [{ gridX: pos.gridX, gridY: pos.gridY }];
            pathFindingTarget = null; // Força o update
        }
    });

    // --- MOUSEDOWN (RÉGUA / PAN) ---
    canvas.addEventListener('mousedown', (e) => {
        if (isRulerActive && e.button === 2) {
            e.preventDefault(); e.stopPropagation();
            const pos = getMouseGridPos();
            const last = rulerWaypoints[rulerWaypoints.length - 1];
            if (!last || last.gridX !== pos.gridX || last.gridY !== pos.gridY) {
                rulerWaypoints.push(pos);
            }
            return;
        }

        if (e.button === 0 || e.button === 1 || e.button === 2) {
            if (isCameraLocked || isRulerActive) return;
            isPanning = true;
            gameScreen.style.cursor = 'grabbing';
            lastMousePos = { x: e.clientX, y: e.clientY };
        }
    });

    // --- MOUSEMOVE ---
    window.addEventListener('mousemove', (e) => {
        if (isPanning && !isCameraLocked) {
            camera.x += (e.clientX - lastMousePos.x);
            camera.y += (e.clientY - lastMousePos.y);
        }
        lastMousePos = { x: e.clientX, y: e.clientY };
    });

    // --- MOUSEUP ---
    window.addEventListener('mouseup', () => {
        isPanning = false;
        gameScreen.style.cursor = 'grab';
    });

    // --- ZOOM (Corrigido para focar no mouse) ---
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const worldPosBefore = screenToWorld(mouseX, mouseY);

        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        camera.zoom = Math.max(0.3, Math.min(camera.zoom * delta, 3.0));

        const worldPosAfter = screenToWorld(mouseX, mouseY);
        
        camera.x += (worldPosAfter.x - worldPosBefore.x) * camera.zoom;
        camera.y += (worldPosAfter.y - worldPosBefore.y) * camera.zoom;
    });

    // --- TECLADO: ALT = RÉGUA ---
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'y') isCameraLocked = !isCameraLocked;

        if (e.key === 'Alt' && !isRulerActive) {
            e.preventDefault();
            isRulerActive = true;
            rulerWaypoints = [];
            rulerEnd = getMouseGridPos();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'Alt') {
            isRulerActive = false;
        }
    });

    canvas.addEventListener('contextmenu', e => e.preventDefault());
}


// ============================================================================
// 4. LOOP DO JOGO (LÓGICA CORRIGIDA)
// ============================================================================

function startGameLoop() {
    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);
}

// updatePlayerMovement AGORA SÓ CUIDA DA ANIMAÇÃO VISUAL
function updatePlayerMovement(player) {
    const targetX = (player.gridX * TILE_SIZE) + (TILE_SIZE / 2);
    const targetY = (player.gridY * TILE_SIZE) + (TILE_SIZE / 2);

    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const dist = Math.hypot(dx, dy);

    // SNAP: Se estiver a menos de 1px, trava no centro
    if (dist < 1.0) {
        player.x = targetX;
        player.y = targetY;
    } else {
        // Movimento suave (interpolação)
        player.x += dx * VELOCIDADE_ANIM;
        player.y += dy * VELOCIDADE_ANIM;
    }
}

// UPDATE AGORA CUIDA DA LÓGICA TILE-BY-TILE
function update() {
    if (!meuJogador) return;

    // 1. Animação visual (todos os jogadores)
    updatePlayerMovement(meuJogador);
    for (const id in outrosJogadores) {
        updatePlayerMovement(outrosJogadores[id]);
    }

    // 2. Lógica de Movimento (APENAS do meuJogador)
    
    // Verifica se o jogador está VISUALMENTE parado no centro do seu TILE LÓGICO
    const targetX = (meuJogador.gridX * TILE_SIZE) + (TILE_SIZE / 2);
    const targetY = (meuJogador.gridY * TILE_SIZE) + (TILE_SIZE / 2);
    const isVisuallyIdle = (meuJogador.x === targetX && meuJogador.y === targetY);

    if (isVisuallyIdle) {
        // Se estamos parados, vemos se chegamos ao nosso alvo da fila
        if (pathFindingTarget) {
            if (meuJogador.gridX === pathFindingTarget.gridX && 
                meuJogador.gridY === pathFindingTarget.gridY) {
                // Chegamos ao waypoint!
                pathFindingTarget = null;
            }
        }

        // Se estamos parados e sem alvo, pegamos o próximo da fila
        if (!pathFindingTarget && movementQueue.length > 0) {
            pathFindingTarget = movementQueue.shift();
            console.log(`[CLIENTE] Próximo alvo: (${pathFindingTarget.gridX}, ${pathFindingTarget.gridY})`);
        }

        // Se temos um alvo (novo ou antigo), damos UM PASSO LÓGICO em direção a ele
        if (pathFindingTarget) {
            const cx = meuJogador.gridX;
            const cy = meuJogador.gridY;
            const tx = pathFindingTarget.gridX;
            const ty = pathFindingTarget.gridY;

            if (cx !== tx || cy !== ty) {
                let nextGridX = cx;
                let nextGridY = cy;

                if (tx > cx) nextGridX++; else if (tx < cx) nextGridX--;
                if (ty > cy) nextGridY++; else if (ty < cy) nextGridY--;

                // ATUALIZA O ALVO LÓGICO
                meuJogador.gridX = nextGridX;
                meuJogador.gridY = nextGridY;
                socket.emit('mover_grid', { gridX: nextGridX, gridY: nextGridY });
            }
        }
    }

    // 3. Atualiza Câmera e Debug
    if (isCameraLocked) {
        camera.x = canvas.width / 2 - meuJogador.x;
        camera.y = canvas.height / 2 - meuJogador.y;
    }
    coordsDebug.textContent = `Pos: (${meuJogador.gridX}, ${meuJogador.gridY}) | Fila: ${movementQueue.length}`;
}


// ============================================================================
// 5. DESENHO
// ============================================================================

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    drawGrid();
    
    // Desenha outros jogadores
    for (const id in outrosJogadores) {
        drawPlayer(outrosJogadores[id], false);
    }
    // Meu jogador por cima
    drawPlayer(meuJogador, true);
    
    if (isRulerActive) drawRuler();

    ctx.restore();
}

function drawGrid() {
    const gridSize = TILE_SIZE;
    const {x: vx, y: vy} = screenToWorld(0, 0); // Posição 0,0 da tela no mundo
    const vw = canvas.width / camera.zoom;
    const vh = canvas.height / camera.zoom;

    ctx.beginPath();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1 / camera.zoom;

    const sx = Math.floor(vx / gridSize) * gridSize;
    const sy = Math.floor(vy / gridSize) * gridSize;

    for (let x = sx; x < vx + vw; x += gridSize) {
        ctx.moveTo(x, vy); ctx.lineTo(x, vy + vh);
    }
    for (let y = sy; y < vy + vh; y += gridSize) {
        ctx.moveTo(vx, y); ctx.lineTo(vx + vw, y);
    }
    ctx.stroke();
}

function drawPlayer(player, isMe = false) {
    if (!player) return; // Segurança
    ctx.beginPath();
    ctx.fillStyle = player.cor;
    ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isMe ? '#f1c40f' : '#FFF';
    ctx.lineWidth = 3 / camera.zoom;
    ctx.stroke();

    ctx.fillStyle = '#FFF';
    ctx.font = `${14 / camera.zoom}px Segoe UI`;
    ctx.textAlign = 'center';
    ctx.fillText(player.nome, player.x, player.y - PLAYER_RADIUS - (5 / camera.zoom));
}

// ============================================================================
// 6. PATHFINDING (A*) E RÉGUA
// ============================================================================

function drawRuler() {
    const color = meuJogador.cor || '#FFFF00';
    if (isRulerActive) rulerEnd = getMouseGridPos(); // Atualiza ponta

    const points = [
        { x: Math.floor(meuJogador.gridX), y: Math.floor(meuJogador.gridY) },
        ...rulerWaypoints.map(p => ({ x: Math.floor(p.gridX), y: Math.floor(p.gridY) })),
        { x: Math.floor(rulerEnd.gridX), y: Math.floor(rulerEnd.gridY) }
    ];

    let totalCost = 0;
    let segments = [];

    for (let i = 0; i < points.length - 1; i++) {
        if (points[i].x === points[i + 1].x && points[i].y === points[i + 1].y) continue;
        const path = calculatePath(points[i], points[i + 1]);
        if (path && path.length > 1) {
            totalCost += path[path.length - 1].g;
            segments.push(path);
        }
    }

    if (segments.length === 0) return;

    // Linhas tracejadas
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 / camera.zoom;
    ctx.setLineDash([8 / camera.zoom, 8 / camera.zoom]);
    ctx.beginPath();
    segments.forEach(path => {
        ctx.moveTo(path[0].x * TILE_SIZE + TILE_SIZE / 2, path[0].y * TILE_SIZE + TILE_SIZE / 2);
        for (let j = 1; j < path.length; j++) {
            ctx.lineTo(path[j].x * TILE_SIZE + TILE_SIZE / 2, path[j].y * TILE_SIZE + TILE_SIZE / 2);
        }
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Setas e waypoints
    segments.forEach((path, idx) => {
        const end = path[path.length - 1];
        const prev = path.length > 1 ? path[path.length - 2] : path[0];
        const ex = end.x * TILE_SIZE + TILE_SIZE / 2;
        const ey = end.y * TILE_SIZE + TILE_SIZE / 2;
        const px = prev.x * TILE_SIZE + TILE_SIZE / 2;
        const py = prev.y * TILE_SIZE + TILE_SIZE / 2;

        drawArrowhead(ctx, ex, ey, Math.atan2(ey - py, ex - px), 12 / camera.zoom, color);

        if (idx < segments.length - 1) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(ex, ey, 5 / camera.zoom, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Texto de custo
    const txt = `${totalCost * 5} ft.`;
    const fx = rulerEnd.gridX * TILE_SIZE + TILE_SIZE / 2;
    const fy = rulerEnd.gridY * TILE_SIZE + TILE_SIZE / 2;

    ctx.font = `bold ${16 / camera.zoom}px Segoe UI`;
    ctx.textAlign = 'center';
    const metric = ctx.measureText(txt);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(fx - metric.width / 2 - 4, fy + 18, metric.width + 8, 20);
    ctx.fillStyle = color;
    ctx.fillText(txt, fx, fy + 34);
}

function drawArrowhead(ctx, x, y, angle, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size / 2);
    ctx.lineTo(-size, size / 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}

function calculatePath(start, end) {
    const sX = Math.floor(start.x), sY = Math.floor(start.y);
    const eX = Math.floor(end.x), eY = Math.floor(end.y);
    if (sX === eX && sY === eY) return [{ x: sX, y: sY, g: 0 }];

    const openSet = [{ x: sX, y: sY, g: 0, h: 0, f: 0, parent: null, diagonalCount: 0 }];
    const closedSet = new Set();
    let safety = 0;

    while (openSet.length > 0) {
        if (safety++ > 2000) break; // Proteção

        let lowIdx = 0;
        for (let i = 0; i < openSet.length; i++)
            if (openSet[i].f < openSet[lowIdx].f) lowIdx = i;

        const cur = openSet[lowIdx];
        if (cur.x === eX && cur.y === eY) {
            const path = [];
            let t = cur;
            while (t) { path.push({ x: t.x, y: t.y, g: t.g }); t = t.parent; }
            return path.reverse();
        }

        openSet.splice(lowIdx, 1);
        closedSet.add(`${cur.x},${cur.y}`);

        for (let xOff = -1; xOff <= 1; xOff++) {
            for (let yOff = -1; yOff <= 1; yOff++) {
                if (xOff === 0 && yOff === 0) continue;
                const nx = cur.x + xOff, ny = cur.y + yOff;
                if (closedSet.has(`${nx},${ny}`)) continue;

                let cost = 1;
                let diag = cur.diagonalCount;
                if (Math.abs(xOff) === 1 && Math.abs(yOff) === 1) {
                    diag++; cost = (diag % 2 === 0) ? 2 : 1;
                }

                const gScore = cur.g + cost;
                let neighbor = openSet.find(n => n.x === nx && n.y === ny);

                if (!neighbor) {
                    neighbor = {
                        x: nx, y: ny, g: gScore,
                        h: Math.abs(nx - eX) + Math.abs(ny - eY),
                        f: 0, parent: cur, diagonalCount: diag
                    };
                    neighbor.f = neighbor.g + neighbor.h;
                    openSet.push(neighbor);
                } else if (gScore < neighbor.g) {
                    neighbor.g = gScore; neighbor.parent = cur;
                    neighbor.diagonalCount = diag; neighbor.f = neighbor.g + neighbor.h;
                }
            }
        }
    }
    return [];
}

// ============================================================================
// 7. UTILITÁRIOS
// ============================================================================

function screenToWorld(sx, sy) {
    return {
        x: (sx - camera.x) / camera.zoom,
        y: (sy - camera.y) / camera.zoom
    };
}

function getMouseGridPos() {
    const r = canvas.getBoundingClientRect();
    const wp = screenToWorld(lastMousePos.x - r.left, lastMousePos.y - r.top);
    return { gridX: Math.floor(wp.x / TILE_SIZE), gridY: Math.floor(wp.y / TILE_SIZE) };
}
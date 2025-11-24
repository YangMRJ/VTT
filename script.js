<<<<<<< HEAD
// ========== VARIÁVEIS GLOBAIS ==========
let playerData = {
    name: '',
    color: '#6b7280',
    emoji: '👤',
    isMaster: false
};

let selectedColor = '#6b7280';
let selectedEmoji = '👤';
let currentTool = 'move';
let currentRulerType = 'line';

// Canvas e Grid
let canvas, ctx;
let gridSize = 50;
let offsetX = 0;
let offsetY = 0;
let scale = 1;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Tokens dos jogadores
let tokens = [];

// Dados selecionados
let selectedDice = {
    d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0
};

// Estado inicial de posição da Ficha e Bandeja
let characterSheetPosition = { x: 0, y: 0 }; 
let diceTrayPosition = { x: 0, y: 0 }; 
let isInitialSetup = true; 

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    setupLoginScreen();
    setupKeyboardShortcuts();
});

// ========== TELA DE LOGIN ==========
function setupLoginScreen() {
    // Seletor de cor
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            selectedColor = option.dataset.color;
            updateThemeColor(selectedColor);
        });
    });

    // Selecionar primeira cor por padrão
    document.querySelector('.color-option').classList.add('selected');

    // Seletor de emoji
    document.querySelectorAll('.emoji-option').forEach(option => {
        option.addEventListener('click', () => {
            const isMaster = document.getElementById('playerName').value === '9678';
            
            // Se não é mestre e tentou selecionar a coroa
            if (!isMaster && option.dataset.master) {
                alert('Este emoji é exclusivo do Mestre!');
                return;
            }

            document.querySelectorAll('.emoji-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            selectedEmoji = option.dataset.emoji;
        });
    });

    // Selecionar primeiro emoji por padrão
    document.querySelector('.emoji-option').classList.add('selected');

    // Botão de login
    document.getElementById('loginBtn').addEventListener('click', handleLogin);

    // Enter no input de nome
    document.getElementById('playerName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
}

function handleLogin() {
    const nameInput = document.getElementById('playerName').value.trim();
    
    if (!nameInput) {
        alert('Por favor, digite seu nome ou código!');
        return;
    }

    // Verificar se é o mestre
    const isMaster = nameInput === '9678';
    
    // Se é mestre mas não selecionou a coroa, ou tentou usar nome com a coroa
    if (isMaster && selectedEmoji !== '👑') {
        selectedEmoji = '👑';
    } else if (!isMaster && selectedEmoji === '👑') {
        alert('O emoji 👑 é exclusivo do Mestre!');
        return;
    }

    playerData = {
        name: isMaster ? 'Mestre' : nameInput,
        color: selectedColor,
        emoji: selectedEmoji,
        isMaster: isMaster
    };

    // Transição para tela de jogo
    const loginScreen = document.getElementById('loginScreen');
    const gameScreen = document.getElementById('gameScreen');
    
    loginScreen.style.opacity = '0';
    setTimeout(() => {
        loginScreen.style.display = 'none';
        gameScreen.classList.add('active');
        initGameScreen();
    }, 500);
}

function updateThemeColor(color) {
    document.documentElement.style.setProperty('--primary-color', color);
}

// ========== TELA DE JOGO ==========
function initGameScreen() {
    setupCanvas();
    setupToolbar();
    setupDiceTray();
    setupCharacterSheet();
    setupChat();
    
    // CORRIGIDO: Remove a injeção do cabeçalho, apenas contêiner de conteúdo.
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = `
        <div class="player-list-content" id="playersListContent">
            </div>
    `;
    
    addPlayerToList(playerData);
    createPlayerToken(playerData);
    
    // Esconder ferramenta de parede se não for mestre
    if (!playerData.isMaster) {
        document.getElementById('wallTool').style.display = 'none';
    }
    
    // CORREÇÃO: Usar setTimeout para garantir que os elementos estejam visíveis, o DOM calculado, 
    //           e o positionMovableElements possa definir corretamente as coordenadas iniciais X e Y.
    setTimeout(() => {
        // 1. OBRIGA a Ficha e a Bandeja a estarem no estado 'active' (visíveis) para calcular o offset.
        document.getElementById('characterSheet').classList.add('active');
        document.getElementById('diceTray').classList.add('active');
        
        positionMovableElements();
        
        // 2. Após o cálculo e posicionamento, voltamos ao estado desejado (minimizado/fechado).
        //    O Chat e Ficha já devem ter a classe no HTML, mas garantimos o estado final aqui.
        document.getElementById('characterSheet').classList.add('minimized');
        document.getElementById('diceTray').classList.add('minimized');
        document.getElementById('chatContainer').classList.add('closed'); // Chat inicia fechado
        
        isInitialSetup = false; 
    }, 0); 

    animate();
    
    window.addEventListener('resize', positionMovableElements);
    
    // Apenas a Ficha de Personagem é arrastável.
    makeMovable(document.getElementById('characterSheet'), document.querySelector('#characterSheet .sheet-header'));
}

function positionMovableElements() {
    const characterSheet = document.getElementById('characterSheet');
    const diceTray = document.getElementById('diceTray');
    
    // Garante que o CSS de posicionamento é 'fixed'
    characterSheet.style.position = 'fixed';
    diceTray.style.position = 'fixed';

    // 1. FICHA DE PERSONAGEM (Canto Superior Direito)
    // Força a posição inicial, ignorando o arrasto anterior.
    characterSheetPosition.x = window.innerWidth - characterSheet.offsetWidth - 20;
    characterSheetPosition.y = 20;
    
    characterSheet.style.left = `${characterSheetPosition.x}px`;
    characterSheet.style.top = `${characterSheetPosition.y}px`;
    characterSheet.style.transform = '';

    // 2. BANDEJA DE DADOS (Canto Inferior Esquerdo)
    // Fixado via CSS 'bottom: 20px', apenas garantimos o 'left'
    diceTrayPosition.x = 20; // Corrigido para 20px
    
    diceTray.style.left = `${diceTrayPosition.x}px`;
    diceTray.style.top = 'auto'; // Garante que o CSS 'bottom: 20px' seja dominante
    diceTray.style.bottom = '20px'; // Usa o valor do CSS
    diceTray.style.transform = '';
}

function makeMovable(element, handle) {
    let isDragging = false;
    let initialMouseX;
    let initialMouseY;
    let initialElementX;
    let initialElementY;
    
    element.style.position = 'fixed'; 

    let getPosFromStyle = () => {
        const x = parseInt(element.style.left) || 0;
        const y = parseInt(element.style.top) || 0;
        return { x, y };
    };

    handle.addEventListener('mousedown', dragStart);
    
    function dragStart(e) {
        if (e.target.closest('.chat-control-btn')) return;

        const pos = getPosFromStyle();
        initialElementX = pos.x;
        initialElementY = pos.y;
        
        initialMouseX = e.clientX;
        initialMouseY = e.clientY;

        isDragging = true;
        element.style.cursor = 'grabbing';
        element.style.transition = 'none'; 
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
    }

    function dragEnd(e) {
        if (!isDragging) return;
        
        isDragging = false;
        element.style.cursor = 'grab';
        element.style.transition = 'all 0.3s';
        
        // SALVA A POSIÇÃO APENAS SE FOR A FICHA
        if (element.id === 'characterSheet') {
            characterSheetPosition.x = parseInt(element.style.left) || 0;
            characterSheetPosition.y = parseInt(element.style.top) || 0;
        }

        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', dragEnd);
    }

    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();
        
        const dx = e.clientX - initialMouseX;
        const dy = e.clientY - initialMouseY;
        
        let newX = initialElementX + dx;
        let newY = initialElementY + dy;

        newX = Math.max(0, Math.min(newX, window.innerWidth - element.offsetWidth));
        newY = Math.max(0, Math.min(newY, window.innerHeight - element.offsetHeight));

        element.style.left = `${newX}px`;
        element.style.top = `${newY}px`;
    }
}


// ========== CANVAS E GRID ==========
function setupCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse events para pan e zoom
    canvas.addEventListener('mousedown', onCanvasMouseDown);
    canvas.addEventListener('mousemove', onCanvasMouseMove);
    canvas.addEventListener('mouseup', onCanvasMouseUp);
    canvas.addEventListener('wheel', onCanvasWheel);
    canvas.addEventListener('click', onCanvasClick);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawGrid();
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;

    const startX = Math.floor(-offsetX / (gridSize * scale)) * gridSize;
    const startY = Math.floor(-offsetY / (gridSize * scale)) * gridSize;
    const endX = startX + Math.ceil(canvas.width / scale) + gridSize;
    const endY = startY + Math.ceil(canvas.height / scale) + gridSize;

    // Linhas verticais
    for (let x = startX; x < endX; x += gridSize) {
        const screenX = x * scale + offsetX;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, canvas.height);
        ctx.stroke();
    }

    // Linhas horizontais
    for (let y = startY; y < endY; y += gridSize) {
        const screenY = y * scale + offsetY;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(canvas.width, screenY); 
        ctx.stroke();
    }

    // Desenhar tokens
    drawTokens();
}

function onCanvasMouseDown(e) {
    if (currentTool === 'move') {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        canvas.classList.add('grabbing');
    }
    
    // TODO: Implementar outras ferramentas (régua, parede, etc)
}

function onCanvasMouseMove(e) {
    if (isDragging && currentTool === 'move') {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        
        offsetX += dx;
        offsetY += dy;
        
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        
        drawGrid();
    }
}

function onCanvasMouseUp(e) {
    isDragging = false;
    canvas.classList.remove('grabbing');
}

function onCanvasWheel(e) {
    e.preventDefault();
    
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    const worldX = (mouseX - offsetX) / scale;
    const worldY = (mouseY - offsetY) / scale;
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(3, scale * zoomFactor));
    
    offsetX = mouseX - worldX * newScale;
    offsetY = mouseY - worldY * newScale;
    
    scale = newScale;
    drawGrid();
}

function onCanvasClick(e) {
    // TODO: Implementar pathfinding e movimentação de token com point and click
    // 1. Converter coordenadas do mouse para coordenadas do grid
    // 2. Implementar algoritmo A* para pathfinding
    // 3. Mover token do jogador atual para a posição clicada
    // 4. Verificar colisões com paredes
}

// ========== TOKENS ==========
function createPlayerToken(player) {
    const token = {
        x: 5, // Posição inicial no grid
        y: 5,
        color: player.color,
        emoji: player.emoji,
        name: player.name,
        isMaster: player.isMaster
    };
    tokens.push(token);
}

function drawTokens() {
    tokens.forEach(token => {
        const screenX = token.x * gridSize * scale + offsetX;
        const screenY = token.y * gridSize * scale + offsetY;
        const tokenSize = gridSize * scale * 0.8;

        // Círculo do token
        ctx.fillStyle = token.color;
        ctx.beginPath();
        ctx.arc(screenX + gridSize * scale / 2, screenY + gridSize * scale / 2, tokenSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // Emoji
        ctx.font = `${tokenSize * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(token.emoji, screenX + gridSize * scale / 2, screenY + gridSize * scale / 2);

        // Barra de nome
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(screenX, screenY - 20 * scale, gridSize * scale, 18 * scale);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = `${12 * scale}px Arial`;
        ctx.fillText(token.name, screenX + gridSize * scale / 2, screenY - 11 * scale);
    });
}

function animate() {
    // Loop de animação para updates futuros
    requestAnimationFrame(animate);
}

// ========== BARRA DE FERRAMENTAS ==========
function setupToolbar() {
    // Adiciona listener de clique em todos os tool-btn
    document.querySelectorAll('#toolbar .tool-btn[data-tool]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // CORREÇÃO: Se o clique foi originado em um sub-botão (dentro do submenu), ignore o clique do botão PAI.
            // O e.target.closest('.tool-submenu') verifica se o clique ocorreu dentro do submenu.
            if (e.target.closest('.tool-submenu')) return;
            
            const tool = btn.dataset.tool;
            
            // Lógica de restrição de ferramentas (mestre)
            if ((tool === 'wall' || tool === 'enemy') && !playerData.isMaster) return;
            
            // Remove 'active' de TODOS os botões
            document.querySelectorAll('#toolbar .tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTool = tool;
            
            // Lógica do Compêndio
            if (tool === 'enemy') {
                document.getElementById('enemyCompendium').classList.add('active');
            } else {
                 document.getElementById('enemyCompendium').classList.remove('active');
            }
        });
    });

    // Submenu de régua
    document.querySelectorAll('[data-ruler]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentRulerType = btn.dataset.ruler;
            const rulerBtn = document.querySelector('[data-tool="ruler"]');
            
            // 1. Troca o emoji do botão principal
            const emoji = btn.textContent.trim(); 
            // Salva o conteúdo original do submenu antes de sobrescrever o HTML do botão principal
            const originalSubmenuHTML = rulerBtn.closest('.tool-item').querySelector('.tool-submenu').innerHTML;

            rulerBtn.textContent = emoji;
            
            // 2. Garante que o botão principal não perca seu z-index e posicionamento
            rulerBtn.classList.add('active');
            currentTool = 'ruler';

            // ATENÇÃO: Se o HTML foi manipulado para trocar o emoji, o submenu desaparece.
            // A solução mais simples é fazer com que o botão **ruler** não mude de conteúdo,
            // mas apenas o `title` e a ferramenta ativa. 
            // Para manter seu código funcionando, vou reanexar o submenu APÓS o clique no sub-botão, 
            // mas é menos performático. A melhor solução é usar um ícone no lugar do emoji.
            
            // ************ RESTAURAÇÃO DO SUBMENU (SOLUÇÃO TEMPORÁRIA) **************
            // Esta parte é necessária porque o innerHTML do rulerBtn foi sobrescrito
            // para trocar o emoji. O submenu DEIXOU de ser IRMÃO do botão principal.
            
            // Melhor solução é não sobrescrever o innerHTML, mas só o textContent
            // (o que já foi feito acima) e garantir que o HTML inicial não tenha a tag 📏 
            // fora do botão, mas sim dentro dele.
            
            // NO SEU HTML ORIGINAL: <div class="tool-btn" data-tool="ruler" title="Régua (R)">📏</div>
            // O emoji 📏 é o textContent.

            // Vou remover esta lógica de re-anexar o HTML, pois o CSS está ajustado para a nova estrutura.
            // Se o botão principal não tem mais o submenu como irmão, ele não funciona.
            // A solução está no HTML: o emoji DEVE estar fora do .tool-btn.
            
            // Se mantiver o HTML como na seção 1, esta lógica de recriação não é mais necessária, 
            // pois o submenu é IRMÃO do botão, não filho.
            
            // Apenas ative o botão:
            document.querySelector('[data-tool="ruler"]').click();
        });
    });

    document.getElementById('closeCompendiumBtn').addEventListener('click', () => {
        document.getElementById('enemyCompendium').classList.remove('active');
        // Adiciona remoção explícita da classe 'active' do botão 'enemy'
        document.querySelector('[data-tool="enemy"]').classList.remove('active'); 
        document.querySelector('[data-tool="move"]').click(); // Volta para a ferramenta Mover
    });
}

// ========== BANDEJA DE DADOS ==========
function setupDiceTray() {
    // Seleção de dados com clique esquerdo
    document.querySelectorAll('.dice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const diceType = btn.dataset.dice;
            selectedDice[diceType]++;
            updateDiceDisplay(btn, selectedDice[diceType]);
        });

        // Clique direito para remover
        btn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const diceType = btn.dataset.dice;
            if (selectedDice[diceType] > 0) {
                selectedDice[diceType]--;
                updateDiceDisplay(btn, selectedDice[diceType]);
            }
        });
    });

    // Botão de rolar
    document.querySelector('.roll-btn').addEventListener('click', rollDice);
}

function updateDiceDisplay(btn, count) {
    const countElement = btn.querySelector('.dice-count');
    countElement.textContent = count;
    
    if (count > 0) {
        btn.classList.add('selected');
    } else {
        btn.classList.remove('selected');
    }
}

function rollDice() {
    // 1. Calcular resultado de cada tipo de dado selecionado
    let total = 0;
    let results = [];
    
    for (let [diceType, count] of Object.entries(selectedDice)) {
        if (count > 0) {
            const sides = parseInt(diceType.substring(1));
            for (let i = 0; i < count; i++) {
                const roll = Math.floor(Math.random() * sides) + 1;
                results.push(`${diceType}: ${roll}`);
                total += roll;
            }
        }
    }
    
    // 2. Aplicar modificador
    const modifierInput = document.querySelector('.modifier-input');
    const modifier = parseInt(modifierInput.value) || 0;
    total += modifier;
    
    if (results.length > 0) {
        // Formata os resultados da rolagem
        const rollDetails = results.join(', ');
        let message = `🎲 **${playerData.name}** rolou: (${rollDetails})`;
        if (modifier !== 0) {
            message += ` ${modifier > 0 ? '+' : ''} ${modifier}`;
        }
        message += ` = **${total}**`;
        
        addChatMessage(message);
        
        // 5. Resetar dados e modificador
        selectedDice = { d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0 };
        document.querySelectorAll('.dice-btn').forEach(btn => {
            updateDiceDisplay(btn, 0);
        });
        modifierInput.value = '0'; // Resetar modificador
    }
}

function minimizeDiceTray() {
    document.getElementById('diceTray').classList.toggle('minimized');
}

function closeDiceTray() {
    document.getElementById('diceTray').classList.remove('active');
}

function openDiceTray() {
    const diceTray = document.getElementById('diceTray');
    diceTray.classList.add('active');
    diceTray.classList.remove('minimized');
}


// ========== FICHA DE PERSONAGEM ==========
function setupCharacterSheet() {
    document.querySelectorAll('.sheet-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            document.querySelectorAll('.sheet-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            
            document.getElementById(`${tabName}Tab`).style.display = 'block';
        });
    });

    // TODO: Implementar funcionalidades de adicionar/editar itens
}

function minimizeCharacterSheet() {
    document.getElementById('characterSheet').classList.toggle('minimized');
}

function closeCharacterSheet() {
    document.getElementById('characterSheet').classList.remove('active');
}

function openCharacterSheet() {
    const sheet = document.getElementById('characterSheet');
    sheet.classList.add('active');
    sheet.classList.remove('minimized');
    
    // Reposiciona para a última posição conhecida ou inicial
    sheet.style.left = `${characterSheetPosition.x}px`;
    sheet.style.top = `${characterSheetPosition.y}px`;
    sheet.style.transform = '';
}

// ========== CHAT ==========
function setupChat() {
    const chatInput = document.getElementById('chatInput');
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && chatInput.value.trim()) {
            // A mensagem agora usa negrito (Markdown **Nome**) para destacar o nome/emoji.
            const message = `${playerData.emoji} **${playerData.name}**: ${chatInput.value}`; 
            addChatMessage(message);
            chatInput.value = '';
            
            // TODO: Enviar mensagem para outros jogadores via WebSocket
        }
    });
}

function addChatMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const msgElement = document.createElement('p');
    msgElement.style.marginBottom = '0.5rem';
    msgElement.style.fontSize = '0.9rem';
    
    // Substitui ** por bold HTML para renderizar corretamente
    let formattedMessage = message.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'); 
        
    msgElement.innerHTML = formattedMessage;
    chatMessages.appendChild(msgElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function minimizeChat() {
    document.getElementById('chatContainer').classList.toggle('minimized');
}

function closeChat() {
    document.getElementById('chatContainer').classList.add('closed');
}

function openChat() {
    const chatContainer = document.getElementById('chatContainer');
    chatContainer.classList.remove('closed');
    chatContainer.classList.remove('minimized');
}

// ========== LISTA DE JOGADORES ==========
function addPlayerToList(player) {
    // Adiciona os itens dentro do contêiner de conteúdo
    const playersListContent = document.getElementById('playersListContent');
    if (!playersListContent) return; 
    
    const playerItem = document.createElement('div');
    playerItem.className = 'player-item';
    
    // NOVO: Adiciona a função togglePlayersList no clique do item
    playerItem.setAttribute('onclick', 'togglePlayersList()'); 
    
    // A cor é adicionada via style inline, que será usada pelo CSS modificado para o estado minimizado.
    playerItem.innerHTML = `
        <div class="player-indicator" style="background: ${player.color};"></div>
        <div class="player-emoji">${player.emoji}</div>
        <div class="player-name">${player.name}</div>
    `;
    
    playersListContent.appendChild(playerItem);
    
    // TODO: Sincronizar lista de jogadores com servidor
}

function togglePlayersList() {
    const list = document.getElementById('playersList');
    list.classList.toggle('minimized');
}

// ========== ATALHOS DE TECLADO ==========
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Atalhos de ferramentas (só na tela de jogo)
        if (document.getElementById('gameScreen').classList.contains('active')) {
            
            // Ctrl+C para abrir/fechar chat
            if (e.ctrlKey && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                const chatContainer = document.getElementById('chatContainer');
                if (chatContainer.classList.contains('closed')) { 
                    openChat();
                } else {
                    closeChat();
                }
            }
            
            // Ctrl+F para abrir/fechar ficha de personagem
            if (e.ctrlKey && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                const sheet = document.getElementById('characterSheet');
                if (sheet.classList.contains('active') && !sheet.classList.contains('minimized')) {
                    minimizeCharacterSheet(); // Minimiza se estiver aberto
                } else if (sheet.classList.contains('active') && sheet.classList.contains('minimized')) {
                    closeCharacterSheet(); // Fecha se estiver minimizado
                } else {
                    openCharacterSheet(); // Abre se estiver fechado
                }
            }
            
            // Ctrl+D para abrir/fechar bandeja de dados
            if (e.ctrlKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                const tray = document.getElementById('diceTray');
                 if (tray.classList.contains('active') && !tray.classList.contains('minimized')) {
                    minimizeDiceTray(); // Minimiza se estiver aberto
                } else if (tray.classList.contains('active') && tray.classList.contains('minimized')) {
                    closeDiceTray(); // Fecha se estiver minimizado
                } else {
                    openDiceTray(); // Abre se estiver fechado
                }
            }
            
            // Atalhos de ferramentas (V, R, P, I)
            switch(e.key.toLowerCase()) {
                case 'v':
                    document.querySelector('[data-tool="move"]').click();
                    break;
                case 'r':
                    // Verifica se o botão da régua está dentro de um .tool-item
                    const rulerToolItem = document.querySelector('.tool-item [data-tool="ruler"]');
                    if(rulerToolItem) {
                         rulerToolItem.click();
                    } else {
                        document.querySelector('[data-tool="ruler"]').click();
                    }
                    break;
                case 'p':
                    if (playerData.isMaster) {
                        document.querySelector('[data-tool="wall"]').click();
                    }
                    break;
                case 'i':
                    if (playerData.isMaster) {
                        document.querySelector('[data-tool="enemy"]').click();
                    }
                    break;
            }
        }
    });
=======
// ========== VARIÁVEIS GLOBAIS ==========
let playerData = {
    name: '',
    color: '#6b7280',
    emoji: '👤',
    isMaster: false
};

let selectedColor = '#6b7280';
let selectedEmoji = '👤';
let currentTool = 'move';
let currentRulerType = 'line';

// Canvas e Grid
let canvas, ctx;
let gridSize = 50;
let offsetX = 0;
let offsetY = 0;
let scale = 1;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Tokens dos jogadores
let tokens = [];

// Dados selecionados
let selectedDice = {
    d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0
};

// Estado inicial de posição da Ficha e Bandeja
let characterSheetPosition = { x: 0, y: 0 }; 
let diceTrayPosition = { x: 0, y: 0 }; 
let isInitialSetup = true; 

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    setupLoginScreen();
    setupKeyboardShortcuts();
});

// ========== TELA DE LOGIN ==========
function setupLoginScreen() {
    // Seletor de cor
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            selectedColor = option.dataset.color;
            updateThemeColor(selectedColor);
        });
    });

    // Selecionar primeira cor por padrão
    document.querySelector('.color-option').classList.add('selected');

    // Seletor de emoji
    document.querySelectorAll('.emoji-option').forEach(option => {
        option.addEventListener('click', () => {
            const isMaster = document.getElementById('playerName').value === '9678';
            
            // Se não é mestre e tentou selecionar a coroa
            if (!isMaster && option.dataset.master) {
                alert('Este emoji é exclusivo do Mestre!');
                return;
            }

            document.querySelectorAll('.emoji-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            selectedEmoji = option.dataset.emoji;
        });
    });

    // Selecionar primeiro emoji por padrão
    document.querySelector('.emoji-option').classList.add('selected');

    // Botão de login
    document.getElementById('loginBtn').addEventListener('click', handleLogin);

    // Enter no input de nome
    document.getElementById('playerName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
}

function handleLogin() {
    const nameInput = document.getElementById('playerName').value.trim();
    
    if (!nameInput) {
        alert('Por favor, digite seu nome ou código!');
        return;
    }

    // Verificar se é o mestre
    const isMaster = nameInput === '9678';
    
    // Se é mestre mas não selecionou a coroa, ou tentou usar nome com a coroa
    if (isMaster && selectedEmoji !== '👑') {
        selectedEmoji = '👑';
    } else if (!isMaster && selectedEmoji === '👑') {
        alert('O emoji 👑 é exclusivo do Mestre!');
        return;
    }

    playerData = {
        name: isMaster ? 'Mestre' : nameInput,
        color: selectedColor,
        emoji: selectedEmoji,
        isMaster: isMaster
    };

    // Transição para tela de jogo
    const loginScreen = document.getElementById('loginScreen');
    const gameScreen = document.getElementById('gameScreen');
    
    loginScreen.style.opacity = '0';
    setTimeout(() => {
        loginScreen.style.display = 'none';
        gameScreen.classList.add('active');
        initGameScreen();
    }, 500);
}

function updateThemeColor(color) {
    document.documentElement.style.setProperty('--primary-color', color);
}

// ========== TELA DE JOGO ==========
function initGameScreen() {
    setupCanvas();
    setupToolbar();
    setupDiceTray();
    setupCharacterSheet();
    setupChat();
    
    // CORRIGIDO: Remove a injeção do cabeçalho, apenas contêiner de conteúdo.
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = `
        <div class="player-list-content" id="playersListContent">
            </div>
    `;
    
    addPlayerToList(playerData);
    createPlayerToken(playerData);
    
    // Esconder ferramenta de parede se não for mestre
    if (!playerData.isMaster) {
        document.getElementById('wallTool').style.display = 'none';
    }
    
    // CORREÇÃO: Usar setTimeout para garantir que os elementos estejam visíveis, o DOM calculado, 
    //           e o positionMovableElements possa definir corretamente as coordenadas iniciais X e Y.
    setTimeout(() => {
        // 1. OBRIGA a Ficha e a Bandeja a estarem no estado 'active' (visíveis) para calcular o offset.
        document.getElementById('characterSheet').classList.add('active');
        document.getElementById('diceTray').classList.add('active');
        
        positionMovableElements();
        
        // 2. Após o cálculo e posicionamento, voltamos ao estado desejado (minimizado/fechado).
        //    O Chat e Ficha já devem ter a classe no HTML, mas garantimos o estado final aqui.
        document.getElementById('characterSheet').classList.add('minimized');
        document.getElementById('diceTray').classList.add('minimized');
        document.getElementById('chatContainer').classList.add('closed'); // Chat inicia fechado
        
        isInitialSetup = false; 
    }, 0); 

    animate();
    
    window.addEventListener('resize', positionMovableElements);
    
    // Apenas a Ficha de Personagem é arrastável.
    makeMovable(document.getElementById('characterSheet'), document.querySelector('#characterSheet .sheet-header'));
}

function positionMovableElements() {
    const characterSheet = document.getElementById('characterSheet');
    const diceTray = document.getElementById('diceTray');
    
    // Garante que o CSS de posicionamento é 'fixed'
    characterSheet.style.position = 'fixed';
    diceTray.style.position = 'fixed';

    // 1. FICHA DE PERSONAGEM (Canto Superior Direito)
    // Força a posição inicial, ignorando o arrasto anterior.
    characterSheetPosition.x = window.innerWidth - characterSheet.offsetWidth - 20;
    characterSheetPosition.y = 20;
    
    characterSheet.style.left = `${characterSheetPosition.x}px`;
    characterSheet.style.top = `${characterSheetPosition.y}px`;
    characterSheet.style.transform = '';

    // 2. BANDEJA DE DADOS (Canto Inferior Esquerdo)
    // Fixado via CSS 'bottom: 20px', apenas garantimos o 'left'
    diceTrayPosition.x = 20; // Corrigido para 20px
    
    diceTray.style.left = `${diceTrayPosition.x}px`;
    diceTray.style.top = 'auto'; // Garante que o CSS 'bottom: 20px' seja dominante
    diceTray.style.bottom = '20px'; // Usa o valor do CSS
    diceTray.style.transform = '';
}

function makeMovable(element, handle) {
    let isDragging = false;
    let initialMouseX;
    let initialMouseY;
    let initialElementX;
    let initialElementY;
    
    element.style.position = 'fixed'; 

    let getPosFromStyle = () => {
        const x = parseInt(element.style.left) || 0;
        const y = parseInt(element.style.top) || 0;
        return { x, y };
    };

    handle.addEventListener('mousedown', dragStart);
    
    function dragStart(e) {
        if (e.target.closest('.chat-control-btn')) return;

        const pos = getPosFromStyle();
        initialElementX = pos.x;
        initialElementY = pos.y;
        
        initialMouseX = e.clientX;
        initialMouseY = e.clientY;

        isDragging = true;
        element.style.cursor = 'grabbing';
        element.style.transition = 'none'; 
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
    }

    function dragEnd(e) {
        if (!isDragging) return;
        
        isDragging = false;
        element.style.cursor = 'grab';
        element.style.transition = 'all 0.3s';
        
        // SALVA A POSIÇÃO APENAS SE FOR A FICHA
        if (element.id === 'characterSheet') {
            characterSheetPosition.x = parseInt(element.style.left) || 0;
            characterSheetPosition.y = parseInt(element.style.top) || 0;
        }

        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', dragEnd);
    }

    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();
        
        const dx = e.clientX - initialMouseX;
        const dy = e.clientY - initialMouseY;
        
        let newX = initialElementX + dx;
        let newY = initialElementY + dy;

        newX = Math.max(0, Math.min(newX, window.innerWidth - element.offsetWidth));
        newY = Math.max(0, Math.min(newY, window.innerHeight - element.offsetHeight));

        element.style.left = `${newX}px`;
        element.style.top = `${newY}px`;
    }
}


// ========== CANVAS E GRID ==========
function setupCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse events para pan e zoom
    canvas.addEventListener('mousedown', onCanvasMouseDown);
    canvas.addEventListener('mousemove', onCanvasMouseMove);
    canvas.addEventListener('mouseup', onCanvasMouseUp);
    canvas.addEventListener('wheel', onCanvasWheel);
    canvas.addEventListener('click', onCanvasClick);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawGrid();
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;

    const startX = Math.floor(-offsetX / (gridSize * scale)) * gridSize;
    const startY = Math.floor(-offsetY / (gridSize * scale)) * gridSize;
    const endX = startX + Math.ceil(canvas.width / scale) + gridSize;
    const endY = startY + Math.ceil(canvas.height / scale) + gridSize;

    // Linhas verticais
    for (let x = startX; x < endX; x += gridSize) {
        const screenX = x * scale + offsetX;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, canvas.height);
        ctx.stroke();
    }

    // Linhas horizontais
    for (let y = startY; y < endY; y += gridSize) {
        const screenY = y * scale + offsetY;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(canvas.width, screenY); 
        ctx.stroke();
    }

    // Desenhar tokens
    drawTokens();
}

function onCanvasMouseDown(e) {
    if (currentTool === 'move') {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        canvas.classList.add('grabbing');
    }
    
    // TODO: Implementar outras ferramentas (régua, parede, etc)
}

function onCanvasMouseMove(e) {
    if (isDragging && currentTool === 'move') {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        
        offsetX += dx;
        offsetY += dy;
        
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        
        drawGrid();
    }
}

function onCanvasMouseUp(e) {
    isDragging = false;
    canvas.classList.remove('grabbing');
}

function onCanvasWheel(e) {
    e.preventDefault();
    
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    const worldX = (mouseX - offsetX) / scale;
    const worldY = (mouseY - offsetY) / scale;
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(3, scale * zoomFactor));
    
    offsetX = mouseX - worldX * newScale;
    offsetY = mouseY - worldY * newScale;
    
    scale = newScale;
    drawGrid();
}

function onCanvasClick(e) {
    // TODO: Implementar pathfinding e movimentação de token com point and click
    // 1. Converter coordenadas do mouse para coordenadas do grid
    // 2. Implementar algoritmo A* para pathfinding
    // 3. Mover token do jogador atual para a posição clicada
    // 4. Verificar colisões com paredes
}

// ========== TOKENS ==========
function createPlayerToken(player) {
    const token = {
        x: 5, // Posição inicial no grid
        y: 5,
        color: player.color,
        emoji: player.emoji,
        name: player.name,
        isMaster: player.isMaster
    };
    tokens.push(token);
}

function drawTokens() {
    tokens.forEach(token => {
        const screenX = token.x * gridSize * scale + offsetX;
        const screenY = token.y * gridSize * scale + offsetY;
        const tokenSize = gridSize * scale * 0.8;

        // Círculo do token
        ctx.fillStyle = token.color;
        ctx.beginPath();
        ctx.arc(screenX + gridSize * scale / 2, screenY + gridSize * scale / 2, tokenSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // Emoji
        ctx.font = `${tokenSize * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(token.emoji, screenX + gridSize * scale / 2, screenY + gridSize * scale / 2);

        // Barra de nome
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(screenX, screenY - 20 * scale, gridSize * scale, 18 * scale);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = `${12 * scale}px Arial`;
        ctx.fillText(token.name, screenX + gridSize * scale / 2, screenY - 11 * scale);
    });
}

function animate() {
    // Loop de animação para updates futuros
    requestAnimationFrame(animate);
}

// ========== BARRA DE FERRAMENTAS ==========
function setupToolbar() {
    // Adiciona listener de clique em todos os tool-btn
    document.querySelectorAll('#toolbar .tool-btn[data-tool]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // CORREÇÃO: Se o clique foi originado em um sub-botão (dentro do submenu), ignore o clique do botão PAI.
            // O e.target.closest('.tool-submenu') verifica se o clique ocorreu dentro do submenu.
            if (e.target.closest('.tool-submenu')) return;
            
            const tool = btn.dataset.tool;
            
            // Lógica de restrição de ferramentas (mestre)
            if ((tool === 'wall' || tool === 'enemy') && !playerData.isMaster) return;
            
            // Remove 'active' de TODOS os botões
            document.querySelectorAll('#toolbar .tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTool = tool;
            
            // Lógica do Compêndio
            if (tool === 'enemy') {
                document.getElementById('enemyCompendium').classList.add('active');
            } else {
                 document.getElementById('enemyCompendium').classList.remove('active');
            }
        });
    });

    // Submenu de régua
    document.querySelectorAll('[data-ruler]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentRulerType = btn.dataset.ruler;
            const rulerBtn = document.querySelector('[data-tool="ruler"]');
            
            // 1. Troca o emoji do botão principal
            const emoji = btn.textContent.trim(); 
            // Salva o conteúdo original do submenu antes de sobrescrever o HTML do botão principal
            const originalSubmenuHTML = rulerBtn.closest('.tool-item').querySelector('.tool-submenu').innerHTML;

            rulerBtn.textContent = emoji;
            
            // 2. Garante que o botão principal não perca seu z-index e posicionamento
            rulerBtn.classList.add('active');
            currentTool = 'ruler';

            // ATENÇÃO: Se o HTML foi manipulado para trocar o emoji, o submenu desaparece.
            // A solução mais simples é fazer com que o botão **ruler** não mude de conteúdo,
            // mas apenas o `title` e a ferramenta ativa. 
            // Para manter seu código funcionando, vou reanexar o submenu APÓS o clique no sub-botão, 
            // mas é menos performático. A melhor solução é usar um ícone no lugar do emoji.
            
            // ************ RESTAURAÇÃO DO SUBMENU (SOLUÇÃO TEMPORÁRIA) **************
            // Esta parte é necessária porque o innerHTML do rulerBtn foi sobrescrito
            // para trocar o emoji. O submenu DEIXOU de ser IRMÃO do botão principal.
            
            // Melhor solução é não sobrescrever o innerHTML, mas só o textContent
            // (o que já foi feito acima) e garantir que o HTML inicial não tenha a tag 📏 
            // fora do botão, mas sim dentro dele.
            
            // NO SEU HTML ORIGINAL: <div class="tool-btn" data-tool="ruler" title="Régua (R)">📏</div>
            // O emoji 📏 é o textContent.

            // Vou remover esta lógica de re-anexar o HTML, pois o CSS está ajustado para a nova estrutura.
            // Se o botão principal não tem mais o submenu como irmão, ele não funciona.
            // A solução está no HTML: o emoji DEVE estar fora do .tool-btn.
            
            // Se mantiver o HTML como na seção 1, esta lógica de recriação não é mais necessária, 
            // pois o submenu é IRMÃO do botão, não filho.
            
            // Apenas ative o botão:
            document.querySelector('[data-tool="ruler"]').click();
        });
    });

    document.getElementById('closeCompendiumBtn').addEventListener('click', () => {
        document.getElementById('enemyCompendium').classList.remove('active');
        // Adiciona remoção explícita da classe 'active' do botão 'enemy'
        document.querySelector('[data-tool="enemy"]').classList.remove('active'); 
        document.querySelector('[data-tool="move"]').click(); // Volta para a ferramenta Mover
    });
}

// ========== BANDEJA DE DADOS ==========
function setupDiceTray() {
    // Seleção de dados com clique esquerdo
    document.querySelectorAll('.dice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const diceType = btn.dataset.dice;
            selectedDice[diceType]++;
            updateDiceDisplay(btn, selectedDice[diceType]);
        });

        // Clique direito para remover
        btn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const diceType = btn.dataset.dice;
            if (selectedDice[diceType] > 0) {
                selectedDice[diceType]--;
                updateDiceDisplay(btn, selectedDice[diceType]);
            }
        });
    });

    // Botão de rolar
    document.querySelector('.roll-btn').addEventListener('click', rollDice);
}

function updateDiceDisplay(btn, count) {
    const countElement = btn.querySelector('.dice-count');
    countElement.textContent = count;
    
    if (count > 0) {
        btn.classList.add('selected');
    } else {
        btn.classList.remove('selected');
    }
}

function rollDice() {
    // 1. Calcular resultado de cada tipo de dado selecionado
    let total = 0;
    let results = [];
    
    for (let [diceType, count] of Object.entries(selectedDice)) {
        if (count > 0) {
            const sides = parseInt(diceType.substring(1));
            for (let i = 0; i < count; i++) {
                const roll = Math.floor(Math.random() * sides) + 1;
                results.push(`${diceType}: ${roll}`);
                total += roll;
            }
        }
    }
    
    // 2. Aplicar modificador
    const modifierInput = document.querySelector('.modifier-input');
    const modifier = parseInt(modifierInput.value) || 0;
    total += modifier;
    
    if (results.length > 0) {
        // Formata os resultados da rolagem
        const rollDetails = results.join(', ');
        let message = `🎲 **${playerData.name}** rolou: (${rollDetails})`;
        if (modifier !== 0) {
            message += ` ${modifier > 0 ? '+' : ''} ${modifier}`;
        }
        message += ` = **${total}**`;
        
        addChatMessage(message);
        
        // 5. Resetar dados e modificador
        selectedDice = { d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0 };
        document.querySelectorAll('.dice-btn').forEach(btn => {
            updateDiceDisplay(btn, 0);
        });
        modifierInput.value = '0'; // Resetar modificador
    }
}

function minimizeDiceTray() {
    document.getElementById('diceTray').classList.toggle('minimized');
}

function closeDiceTray() {
    document.getElementById('diceTray').classList.remove('active');
}

function openDiceTray() {
    const diceTray = document.getElementById('diceTray');
    diceTray.classList.add('active');
    diceTray.classList.remove('minimized');
}


// ========== FICHA DE PERSONAGEM ==========
function setupCharacterSheet() {
    document.querySelectorAll('.sheet-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            document.querySelectorAll('.sheet-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            
            document.getElementById(`${tabName}Tab`).style.display = 'block';
        });
    });

    // TODO: Implementar funcionalidades de adicionar/editar itens
}

function minimizeCharacterSheet() {
    document.getElementById('characterSheet').classList.toggle('minimized');
}

function closeCharacterSheet() {
    document.getElementById('characterSheet').classList.remove('active');
}

function openCharacterSheet() {
    const sheet = document.getElementById('characterSheet');
    sheet.classList.add('active');
    sheet.classList.remove('minimized');
    
    // Reposiciona para a última posição conhecida ou inicial
    sheet.style.left = `${characterSheetPosition.x}px`;
    sheet.style.top = `${characterSheetPosition.y}px`;
    sheet.style.transform = '';
}

// ========== CHAT ==========
function setupChat() {
    const chatInput = document.getElementById('chatInput');
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && chatInput.value.trim()) {
            // A mensagem agora usa negrito (Markdown **Nome**) para destacar o nome/emoji.
            const message = `${playerData.emoji} **${playerData.name}**: ${chatInput.value}`; 
            addChatMessage(message);
            chatInput.value = '';
            
            // TODO: Enviar mensagem para outros jogadores via WebSocket
        }
    });
}

function addChatMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const msgElement = document.createElement('p');
    msgElement.style.marginBottom = '0.5rem';
    msgElement.style.fontSize = '0.9rem';
    
    // Substitui ** por bold HTML para renderizar corretamente
    let formattedMessage = message.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'); 
        
    msgElement.innerHTML = formattedMessage;
    chatMessages.appendChild(msgElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function minimizeChat() {
    document.getElementById('chatContainer').classList.toggle('minimized');
}

function closeChat() {
    document.getElementById('chatContainer').classList.add('closed');
}

function openChat() {
    const chatContainer = document.getElementById('chatContainer');
    chatContainer.classList.remove('closed');
    chatContainer.classList.remove('minimized');
}

// ========== LISTA DE JOGADORES ==========
function addPlayerToList(player) {
    // Adiciona os itens dentro do contêiner de conteúdo
    const playersListContent = document.getElementById('playersListContent');
    if (!playersListContent) return; 
    
    const playerItem = document.createElement('div');
    playerItem.className = 'player-item';
    
    // NOVO: Adiciona a função togglePlayersList no clique do item
    playerItem.setAttribute('onclick', 'togglePlayersList()'); 
    
    // A cor é adicionada via style inline, que será usada pelo CSS modificado para o estado minimizado.
    playerItem.innerHTML = `
        <div class="player-indicator" style="background: ${player.color};"></div>
        <div class="player-emoji">${player.emoji}</div>
        <div class="player-name">${player.name}</div>
    `;
    
    playersListContent.appendChild(playerItem);
    
    // TODO: Sincronizar lista de jogadores com servidor
}

function togglePlayersList() {
    const list = document.getElementById('playersList');
    list.classList.toggle('minimized');
}

// ========== ATALHOS DE TECLADO ==========
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Atalhos de ferramentas (só na tela de jogo)
        if (document.getElementById('gameScreen').classList.contains('active')) {
            
            // Ctrl+C para abrir/fechar chat
            if (e.ctrlKey && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                const chatContainer = document.getElementById('chatContainer');
                if (chatContainer.classList.contains('closed')) { 
                    openChat();
                } else {
                    closeChat();
                }
            }
            
            // Ctrl+F para abrir/fechar ficha de personagem
            if (e.ctrlKey && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                const sheet = document.getElementById('characterSheet');
                if (sheet.classList.contains('active') && !sheet.classList.contains('minimized')) {
                    minimizeCharacterSheet(); // Minimiza se estiver aberto
                } else if (sheet.classList.contains('active') && sheet.classList.contains('minimized')) {
                    closeCharacterSheet(); // Fecha se estiver minimizado
                } else {
                    openCharacterSheet(); // Abre se estiver fechado
                }
            }
            
            // Ctrl+D para abrir/fechar bandeja de dados
            if (e.ctrlKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                const tray = document.getElementById('diceTray');
                 if (tray.classList.contains('active') && !tray.classList.contains('minimized')) {
                    minimizeDiceTray(); // Minimiza se estiver aberto
                } else if (tray.classList.contains('active') && tray.classList.contains('minimized')) {
                    closeDiceTray(); // Fecha se estiver minimizado
                } else {
                    openDiceTray(); // Abre se estiver fechado
                }
            }
            
            // Atalhos de ferramentas (V, R, P, I)
            switch(e.key.toLowerCase()) {
                case 'v':
                    document.querySelector('[data-tool="move"]').click();
                    break;
                case 'r':
                    // Verifica se o botão da régua está dentro de um .tool-item
                    const rulerToolItem = document.querySelector('.tool-item [data-tool="ruler"]');
                    if(rulerToolItem) {
                         rulerToolItem.click();
                    } else {
                        document.querySelector('[data-tool="ruler"]').click();
                    }
                    break;
                case 'p':
                    if (playerData.isMaster) {
                        document.querySelector('[data-tool="wall"]').click();
                    }
                    break;
                case 'i':
                    if (playerData.isMaster) {
                        document.querySelector('[data-tool="enemy"]').click();
                    }
                    break;
            }
        }
    });
>>>>>>> 1f87bfe8adc61e5e2717caf32c65026b0e36c7f4
}
// ========== VARIÁVEIS GLOBAIS ==========
let playerData = {
    name: '',
    color: '#6b7280', // Cor padrão (cinza)
    emoji: '👤',
    isMaster: false
};

let selectedColor = '#6b7280';
let selectedEmoji = '👤';
let currentTool = 'move'; // Ferramenta ativa (move, ruler, wall, enemy)
let currentRulerType = 'line'; // Tipo de régua (line, circle, square, cone)

// Variáveis do Canvas e Grid
let canvas, ctx;
let gridSize = 50; // Tamanho em pixels de cada célula do grid
let offsetX = 0; // Offset de pan (horizontal)
let offsetY = 0; // Offset de pan (vertical)
let scale = 1; // Nível de zoom
let isDragging = false; // Estado de arrasto do canvas (pan)
let lastMouseX = 0;
let lastMouseY = 0;

// Tokens dos jogadores (estrutura de dados para posição no grid)
let tokens = [];

// Array para armazenar as armas do personagem. (Para renderização da Ficha)
let characterWeapons = [
    { name: "Espada Longa", damage: "1d8", type: "Comum", description: "Ataque corpo-a-corpo padrão." },
    { name: "Bola de Fogo", damage: "8d6", type: "Magia", description: "Grande explosão mágica. (Área: Círculo)" }
];

// Objeto para armazenar o nível de proficiência das perícias.
// Chave: Nome da perícia, Valor: Nível (0: Sem, 2: Proficiência, 3: Expertise)
let characterSkills = {};

// Dados selecionados na Bandeja de Dados
let selectedDice = {
    d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0
};

// Posições salvas para janelas flutuantes arrastáveis
let characterSheetPosition = { x: 0, y: 0 }; 
let diceTrayPosition = { x: 0, y: 0 }; // Atualmente não usada para arrasto, mas reservada.
let isInitialSetup = true; // Flag para forçar o posicionamento inicial das janelas.

// Variável para rastrear o último remetente do chat (para agrupar mensagens)
let lastSender = { 
    name: '', 
    color: '' 
}; 

/**
 * Lista de Perícias D&D 5e com Atributo (para inicialização e renderização).
 */
const DND_SKILLS = [
    { name: "Acrobacia", attr: "Des" },
    { name: "Adestrar Animal", attr: "Sab" },
    { name: "Arcana", attr: "Int" },
    { name: "Atletismo", attr: "For" },
    { name: "Atuação", attr: "Cha" },
    { name: "Furtividade", attr: "Des" },
    { name: "História", attr: "Int" },
    { name: "Intimidação", attr: "Car" },
    { name: "Medicina", attr: "Int" },
    { name: "Natureza", attr: "Int" },
    { name: "Percepção", attr: "Sab" },
    { name: "Persuasão", attr: "Cha" },
    { name: "Prestidigitação", attr: "Des" },
    { name: "Procurar", attr: "Int" },
    { name: "Religião", attr: "Int" },
    { name: "Sentir Motivação", attr: "Sab" },
    { name: "Sobrevivência", attr: "Sab" },
    { name: "Trapacear", attr: "Cha" }
];

// ========== INICIALIZAÇÃO GERAL ==========
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa characterSkills com todas as perícias em nível 0 (Sem Treino)
    DND_SKILLS.forEach(skill => {
        characterSkills[skill.name] = 0;
    });

    setupLoginScreen();
    setupKeyboardShortcuts();
});

// ========== TELA DE LOGIN ==========
function setupLoginScreen() {
    // Configura listeners para seleção de cor e emoji.
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            selectedColor = option.dataset.color;
            updateThemeColor(selectedColor); // Aplica a cor ao tema (variável CSS)
        });
    });

    // Seletor de emoji (incluindo a checagem de exclusividade do Mestre)
    document.querySelectorAll('.emoji-option').forEach(option => {
        option.addEventListener('click', () => {
            const isMaster = document.getElementById('playerName').value === '9678';
            
            // Impede a seleção do emoji de Mestre se o código não for digitado
            if (!isMaster && option.dataset.master) {
                alert('Este emoji é exclusivo do Mestre!');
                return;
            }

            document.querySelectorAll('.emoji-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            selectedEmoji = option.dataset.emoji;
        });
    });

    // Configura o botão e o Enter para o login.
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
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

    // Lógica para determinar se o jogador é o Mestre (código '9678')
    const isMaster = nameInput === '9678';
    
    // Força o emoji de Mestre para a coroa se o código for usado.
    if (isMaster && selectedEmoji !== '👑') {
        selectedEmoji = '👑';
    } else if (!isMaster && selectedEmoji === '👑') {
        // Previne a tentativa de login com emoji de Mestre sem o código
        alert('O emoji 👑 é exclusivo do Mestre!');
        return;
    }

    playerData = {
        name: isMaster ? 'Mestre' : nameInput,
        color: selectedColor,
        emoji: selectedEmoji,
        isMaster: isMaster
    };

    // Transição de tela suave
    const loginScreen = document.getElementById('loginScreen');
    const gameScreen = document.getElementById('gameScreen');
    
    loginScreen.style.opacity = '0';
    setTimeout(() => {
        loginScreen.style.display = 'none';
        gameScreen.classList.add('active'); // Ativa o display: block e opacity: 1
        initGameScreen();
    }, 500);
}

function updateThemeColor(color) {
    // Atualiza a variável CSS global --primary-color
    document.documentElement.style.setProperty('--primary-color', color);
}

// ========== TELA DE JOGO ==========
function initGameScreen() {
    setupCanvas();
    setupToolbar();
    setupDiceTray();
    setupCharacterSheet();
    setupChat();
    
    // Inicializa a lista de jogadores e adiciona o jogador atual
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = `<div class="player-list-content" id="playersListContent"></div>`;
    addPlayerToList(playerData);
    createPlayerToken(playerData);
    
    // Esconde ferramentas exclusivas do Mestre se o jogador não for Mestre
    if (!playerData.isMaster) {
        document.getElementById('wallTool').style.display = 'none';
    }
    
    // Inicialização e posicionamento das janelas flutuantes
    setTimeout(() => {
        const charSheet = document.getElementById('characterSheet');
        const diceTray = document.getElementById('diceTray');
        const chatContainer = document.getElementById('chatContainer');
        
        // 1. Garante que os elementos estejam visíveis (mas com opacidade 0) para o cálculo correto de offsetHeight/offsetWidth
        charSheet.style.opacity = '0';
        charSheet.classList.add('active'); // Temporário, se necessário para calcular dimensões
        diceTray.style.opacity = '0';
        diceTray.classList.add('active');
        chatContainer.style.opacity = '0'; 
        
        positionMovableElements(); // Define a posição inicial com base nas dimensões da tela.
        
        // 2. Aplica as classes finais para o estado "fechado" inicial com animação.
        charSheet.classList.add('minimized');
        charSheet.classList.add('closed');
        charSheet.style.opacity = ''; 
        
        diceTray.classList.add('minimized');
        diceTray.classList.add('closed');
        diceTray.style.opacity = ''; 
        
        chatContainer.classList.add('closed'); 
        chatContainer.style.opacity = ''; 
        
        isInitialSetup = false; 
    }, 0); 

    animate(); // Inicia o loop de animação do canvas
    
    window.addEventListener('resize', positionMovableElements);
    
    // Apenas a Ficha de Personagem é arrastável (movable).
    makeMovable(document.getElementById('characterSheet'), document.querySelector('#characterSheet .sheet-header'));
}

/**
 * Define a posição inicial da Ficha de Personagem (Canto Superior Direito).
 * Chamada no init e no resize para garantir que a janela não saia da tela.
 */
function positionMovableElements() {
    const characterSheet = document.getElementById('characterSheet');
    
    // Força a posição inicial apenas na primeira vez, respeitando a posição salva depois
    if (isInitialSetup) {
        characterSheetPosition.x = window.innerWidth - characterSheet.offsetWidth - 20;
        characterSheetPosition.y = 20;
    }
    
    // Aplica a posição salva/calculada
    characterSheet.style.left = `${characterSheetPosition.x}px`;
    characterSheet.style.top = `${characterSheetPosition.y}px`;
    characterSheet.style.transform = ''; // Remove qualquer transform restante
}

/**
 * Torna um elemento arrastável (movable).
 * @param {HTMLElement} element O elemento a ser movido.
 * @param {HTMLElement} handle A alça (elemento) que inicia o arrasto.
 */
function makeMovable(element, handle) {
    let isDragging = false;
    let initialMouseX, initialMouseY;
    let initialElementX, initialElementY;
    
    element.style.position = 'fixed'; 

    let getPosFromStyle = () => {
        const x = parseInt(element.style.left) || 0;
        const y = parseInt(element.style.top) || 0;
        return { x, y };
    };

    handle.addEventListener('mousedown', dragStart);
    
    function dragStart(e) {
        // Ignora cliques nos botões de controle dentro do handle (min/close)
        if (e.target.closest('.chat-control-btn')) return;

        const pos = getPosFromStyle();
        initialElementX = pos.x;
        initialElementY = pos.y;
        
        initialMouseX = e.clientX;
        initialMouseY = e.clientY;

        isDragging = true;
        element.style.cursor = 'grabbing';
        element.style.transition = 'none'; // Desativa a transição durante o arrasto
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
    }

    function dragEnd(e) {
        if (!isDragging) return;
        
        isDragging = false;
        element.style.cursor = 'grab';
        element.style.transition = 'all 0.3s ease-in-out'; // Restaura a transição suave
        
        // SALVA A POSIÇÃO FINAL APENAS SE FOR A FICHA
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

        // Limita o arrasto aos limites da janela (bounds checking)
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

    // Mouse events para pan, zoom e interação com o mapa
    canvas.addEventListener('mousedown', onCanvasMouseDown);
    canvas.addEventListener('mousemove', onCanvasMouseMove);
    canvas.addEventListener('mouseup', onCanvasMouseUp);
    canvas.addEventListener('wheel', onCanvasWheel); // Zoom
    canvas.addEventListener('click', onCanvasClick); // Interação (ex: mover token)
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawGrid();
}

/**
 * Desenha o grid e todos os tokens na tela.
 */
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#1a1a1a'; // Cor das linhas do grid
    ctx.lineWidth = 1;

    // Calcula onde começar a desenhar as linhas visíveis (otimização)
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
        isDragging = true; // Ativa o pan
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        canvas.classList.add('grabbing');
    }
    
    // TODO: Implementar lógica de início de ferramenta (régua, parede, etc.)
}

function onCanvasMouseMove(e) {
    // Lógica de Pan (movimentação do mapa)
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

/**
 * Lógica de Zoom (centralizado no cursor do mouse).
 */
function onCanvasWheel(e) {
    e.preventDefault();
    
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // Coordenadas mundiais (no grid) antes do zoom
    const worldX = (mouseX - offsetX) / scale;
    const worldY = (mouseY - offsetY) / scale;
    
    // Calcula a nova escala, limitando entre 0.5x e 3x
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(3, scale * zoomFactor));
    
    // Ajusta o offset para manter o ponto (worldX, worldY) fixo na tela após o zoom
    offsetX = mouseX - worldX * newScale;
    offsetY = mouseY - worldY * newScale;
    
    scale = newScale;
    drawGrid();
}

function onCanvasClick(e) {
    // TODO: Implementar movimentação de token
}

// ========== TOKENS ==========
/**
 * Adiciona um novo token ao array global.
 * @param {object} player Objeto com dados do jogador (name, color, emoji, isMaster).
 */
function createPlayerToken(player) {
    const token = {
        x: 5, // Posição inicial no grid (em número de células)
        y: 5,
        color: player.color,
        emoji: player.emoji,
        name: player.name,
        isMaster: player.isMaster
    };
    tokens.push(token);
}

/**
 * Desenha todos os tokens na tela, considerando pan e zoom.
 */
function drawTokens() {
    tokens.forEach(token => {
        // Converte as coordenadas do grid (x, y) para coordenadas de tela (screenX, screenY)
        const screenX = token.x * gridSize * scale + offsetX;
        const screenY = token.y * gridSize * scale + offsetY;
        const tokenSize = gridSize * scale * 0.8; // Tamanho do token (80% da célula)

        // Círculo do token
        ctx.fillStyle = token.color;
        ctx.beginPath();
        // Centraliza o círculo no centro da célula do grid
        ctx.arc(screenX + gridSize * scale / 2, screenY + gridSize * scale / 2, tokenSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // Emoji (ícone central)
        ctx.font = `${tokenSize * 0.8}px Arial`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(token.emoji, screenX + gridSize * scale / 2, screenY + gridSize * scale / 2 + 2);

        // Nome abaixo do token
        ctx.font = `${gridSize * scale * 0.25}px Arial`;
        ctx.fillText(token.name, screenX + gridSize * scale / 2, screenY + gridSize * scale + 15);
    });
}

function animate() {
    drawGrid();
    requestAnimationFrame(animate); // Loop de renderização
}

// ========== BARRA DE FERRAMENTAS ==========
function setupToolbar() {
    // Configura o clique nas ferramentas principais
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
        });
    });

    // Configura o clique nas opções do submenu (tipos de régua)
    document.querySelectorAll('.tool-btn-sub').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tool-btn-sub').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRulerType = btn.dataset.ruler;
        });
    });
}

// ========== BANDEJA DE DADOS ==========
function setupDiceTray() {
    // Lógica de incremento/decremento de dados (clique esquerdo/direito)
    document.querySelectorAll('.dice-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const diceType = btn.dataset.dice;
            selectedDice[diceType]++;
            updateDiceDisplay(btn, selectedDice[diceType]);
        });

        btn.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Impede o menu de contexto padrão
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

/**
 * Atualiza o contador visual de um tipo de dado.
 * @param {HTMLElement} btn O botão do dado.
 * @param {number} count A contagem atual.
 */
function updateDiceDisplay(btn, count) {
    const countElement = btn.querySelector('.dice-count');
    countElement.textContent = count;
    
    if (count > 0) {
        btn.classList.add('selected');
    } else {
        btn.classList.remove('selected');
    }
}

/**
 * Executa a rolagem de dados e envia o resultado para o chat.
 */
function rollDice() {
    let total = 0;
    let results = [];
    
    // 1. Rola cada dado selecionado
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
    
    // 2. Aplica modificador
    const modifierInput = document.querySelector('.modifier-input');
    const modifier = parseInt(modifierInput.value) || 0;
    
    if (results.length > 0) {
        // 3. Formata e envia a mensagem para o chat
        const rollDetails = results.join(', ');
        let message = `🎲 **Rolagem**: (${rollDetails})`;
        
        if (modifier !== 0) {
            message += ` ${modifier > 0 ? '+' : ''} ${modifier}`;
        }
        
        total += modifier;
        message += ` = **${total}**`;
        
        addChatMessage(playerData.name, playerData.emoji, playerData.color, message);
        
        // 4. Resetar dados e modificador
        selectedDice = { d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0 };
        document.querySelectorAll('.dice-btn').forEach(btn => {
            updateDiceDisplay(btn, 0);
        });
        modifierInput.value = '0'; 
    }
}

// Funções de controle da Bandeja de Dados (chamadas pelo HTML)
function minimizeDiceTray() {
    document.getElementById('diceTray').classList.toggle('minimized');
}

function closeDiceTray() {
    document.getElementById('diceTray').classList.add('closed');
}

function openDiceTray() {
    const diceTray = document.getElementById('diceTray');
    diceTray.classList.remove('closed');
    diceTray.classList.remove('minimized');
}


// ========== FICHA DE PERSONAGEM ==========
function setupCharacterSheet() {
    // 1. Alternância de abas
    document.querySelectorAll('.sheet-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            document.querySelectorAll('.sheet-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            
            // A aba 'personagem' usa layout 'grid', as outras usam 'block'
            document.getElementById(`${tabName}Tab`).style.display = (tabName === 'personagem' ? 'grid' : 'block');
            
            // Re-renderiza as listas de armas e perícias ao ativar a aba Personagem
            if (tabName === 'personagem') {
                renderWeapons();
                renderSkills(); 
            }
        });
    });

    // 2. Lógica de Formulário de Adição de Arma (Inline)
    const formContainer = document.getElementById('addWeaponFormContainer');
    const openFormBtn = document.getElementById('openWeaponFormBtn');
    
    // Abre formulário
    openFormBtn.addEventListener('click', () => {
        formContainer.style.display = 'block';
        openFormBtn.style.display = 'none';
    });

    // Cancela adição e fecha formulário
    document.getElementById('cancelAddWeapon').addEventListener('click', () => {
        formContainer.style.display = 'none';
        openFormBtn.style.display = 'block';
        // Limpa campos
        document.getElementById('weaponNameInput').value = '';
        document.getElementById('weaponDamageInput').value = '';
        document.getElementById('weaponTypeSelect').value = 'Comum';
        document.getElementById('weaponDescriptionInput').value = '';
    });

    // Confirma e adiciona a nova arma
    document.getElementById('confirmAddWeapon').addEventListener('click', () => {
        const name = document.getElementById('weaponNameInput').value.trim();
        const damage = document.getElementById('weaponDamageInput').value.trim();
        const type = document.getElementById('weaponTypeSelect').value;
        const description = document.getElementById('weaponDescriptionInput').value.trim();

        if (!name || !damage) {
            alert('Nome e Dano são obrigatórios para a arma!');
            return;
        }

        const newWeapon = { name, damage, type, description };
        characterWeapons.push(newWeapon);
        
        document.getElementById('cancelAddWeapon').click(); // Fecha e limpa
        renderWeapons(); // Atualiza a lista
    });

    // 3. Renderização inicial das listas
    renderWeapons();
    renderSkills(); 

    // 4. Lógica de adição genérica para outras listas (Equipamentos, Mochila, etc.)
    document.querySelectorAll('.sheet-section .add-btn').forEach(btn => {
        // Ignora os botões do formulário de Arma
        if (btn.id !== 'openWeaponFormBtn' && !btn.classList.contains('confirm-btn') && !btn.classList.contains('cancel-btn')) {
            btn.addEventListener('click', () => {
                const section = btn.closest('.sheet-section');
                const sectionTitle = section.querySelector('h4').textContent.trim();
                
                // Pede o nome do item via prompt
                let itemName = prompt(`Nome do ${sectionTitle.toLowerCase().replace('⚔️ ', '').replace('🛡️ ', '').replace('🎒 ', '').replace('✨ ', '').replace('💪 ', '')}:`);
                if (!itemName) return;
                
                const list = section.querySelector('.item-list');
                const itemEntry = document.createElement('li');
                itemEntry.className = 'item-entry';
                itemEntry.innerHTML = `
                    <span>${itemName}</span>
                    <button class="edit-item">✏️</button>
                    <button class="remove-item">🗑️</button>
                `;

                // Adiciona lógica de remoção (e edição simples)
                itemEntry.querySelector('.remove-item').addEventListener('click', () => {
                    itemEntry.remove();
                });

                list.appendChild(itemEntry);
            });
        }
    });
}

/**
 * Renderiza a lista de armas dinamicamente a partir de characterWeapons.
 */
function renderWeapons() {
    const list = document.getElementById('weaponList');
    if (!list) return;

    list.innerHTML = ''; 

    characterWeapons.forEach((weapon, index) => {
        const itemEntry = document.createElement('li');
        itemEntry.className = 'item-entry';
        
        itemEntry.innerHTML = `
            <span>
                <b>${weapon.name}</b> 
                (Dano: ${weapon.damage}, Tipo: ${weapon.type})
                ${weapon.description ? ` - <i>${weapon.description}</i>` : ''}
            </span>
            <button class="remove-weapon" data-index="${index}" title="Remover Arma">🗑️</button>
        `;
        
        // Lógica de remoção: usa o índice no array characterWeapons
        itemEntry.querySelector('.remove-weapon').addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.dataset.index); 
            characterWeapons.splice(idx, 1); 
            renderWeapons();
        });

        list.appendChild(itemEntry);
    });
}

/**
 * Renderiza a lista de perícias com o menu flutuante de seleção de nível.
 */
function renderSkills() {
    const list = document.getElementById('skillsList');
    if (!list) return;

    list.innerHTML = ''; 

    // Define os níveis de proficiência disponíveis
    const proficiencyLevels = [
        { label: "Sem Treino", value: 0, icon: "" }, 
        { label: "Proficiência", value: 2, icon: "" }, 
        { label: "Expertise", value: 3, icon: "" } 
    ];

    DND_SKILLS.forEach((skill, index) => {
        const currentLevel = characterSkills[skill.name] || 0;
        const currentProficiency = proficiencyLevels.find(p => p.value === currentLevel) || proficiencyLevels[0];
        
        const itemEntry = document.createElement('li');
        itemEntry.className = 'item-entry skill-entry'; 

        // Estrutura do item: Nome (Atributo), Ícone de Proficiência (nível atual), Menu Flutuante
        itemEntry.innerHTML = `
            <div class="skill-info">
                <span>${skill.name}</span>
                <span style="color: #9ca3af; font-weight: 500;">(${skill.attr})</span>
            </div>
            
            <div class="skill-level-toggle" data-skill-name="${skill.name}" data-current-level="${currentLevel}">
                <button class="level-icon-btn" title="Nível de Proficiência">
                    <span class="level-icon level-${currentLevel}">${currentProficiency.icon}</span>
                </button>
                
                <div class="skill-level-menu">
                    ${proficiencyLevels.map(level => `
                        <button 
                            title="${level.label}" 
                            data-level="${level.value}"
                            data-icon="${level.icon}"
                            class="menu-option-btn ${level.value === currentLevel ? 'active' : ''}" 
                        >
                            <span class="menu-option-icon level-${level.value}">${level.icon}</span> 
                            ${level.label}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // Lógica de abertura/fechamento do menu
        const toggleBtn = itemEntry.querySelector('.level-icon-btn');
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            // Fecha todos os outros menus abertos para evitar sobreposição
            document.querySelectorAll('.skill-level-menu.open').forEach(menu => {
                if (menu !== e.currentTarget.nextElementSibling) {
                    menu.classList.remove('open');
                }
            });
            e.currentTarget.nextElementSibling.classList.toggle('open');
        });

        // Lógica de seleção do nível
        itemEntry.querySelectorAll('.menu-option-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); 
                
                const skillToggle = e.currentTarget.closest('.skill-level-toggle');
                const menu = e.currentTarget.closest('.skill-level-menu');
                const skillName = skillToggle.dataset.skillName;
                const newLevel = parseInt(e.currentTarget.dataset.level);

                // 1. Atualiza o estado salvo no objeto characterSkills
                characterSkills[skillName] = newLevel;
                
                // 2. Atualiza o ícone principal (para refletir a classe CSS correta)
                const iconSpan = skillToggle.querySelector('.level-icon');
                iconSpan.className = `level-icon level-${newLevel}`; 
                skillToggle.dataset.currentLevel = newLevel;
                
                // 3. Marca a opção ativa dentro do menu
                menu.querySelectorAll('.menu-option-btn').forEach(btn => btn.classList.remove('active'));
                e.currentTarget.classList.add('active');

                // 4. Fecha o menu
                menu.classList.remove('open');
            });
        });

        list.appendChild(itemEntry);
    });
    
    // Fecha o menu ao clicar em qualquer lugar fora (global listener)
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.skill-level-toggle')) {
            document.querySelectorAll('.skill-level-menu.open').forEach(menu => {
                menu.classList.remove('open');
            });
        }
    });
}

// Funções de controle da Ficha de Personagem (chamadas pelo HTML)
function minimizeCharacterSheet() {
    document.getElementById('characterSheet').classList.toggle('minimized');
}

function closeCharacterSheet() {
    document.getElementById('characterSheet').classList.add('closed');
}

function openCharacterSheet() {
    const sheet = document.getElementById('characterSheet');
    sheet.classList.remove('closed');
    sheet.classList.remove('minimized');
    
    // Reposiciona para a última posição arrastada conhecida
    sheet.style.left = `${characterSheetPosition.x}px`;
    sheet.style.top = `${characterSheetPosition.y}px`;
    sheet.style.transform = '';
}

// ========== CHAT ==========
function setupChat() {
    const chatInput = document.getElementById('chatInput');
    // Envia mensagem ao pressionar Enter
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && chatInput.value.trim()) {
            addChatMessage(playerData.name, playerData.emoji, playerData.color, chatInput.value); 
            chatInput.value = '';
            
            // TODO: Adicionar lógica de envio via WebSocket
        }
    });

    lastSender = { name: '', color: '' };
}

/**
 * Adiciona uma nova mensagem ao chat, com lógica de agrupamento.
 * @param {string} senderName Nome do remetente.
 * @param {string} senderEmoji Emoji do remetente.
 * @param {string} senderColor Cor do remetente (hex).
 * @param {string} content Conteúdo da mensagem.
 */
function addChatMessage(senderName, senderEmoji, senderColor, content) {
    const chatMessages = document.getElementById('chatMessages');
    const isSameSender = lastSender.name === senderName;
    
    let currentGroup;

    // Remove a mensagem inicial de boas-vindas/placeholder
    const initialMessage = document.getElementById('initialChatMsg');
    if (initialMessage) {
        initialMessage.remove();
    }
    
    // Função utilitária para converter cor Hex para RGB (necessário para o background com opacidade)
    const hexToRgb = hex => {
        const bigint = parseInt(hex.slice(1), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `${r}, ${g}, ${b}`;
    };
    const rgbColor = hexToRgb(senderColor);

    if (isSameSender) {
        // Se o remetente é o mesmo, anexa a nova mensagem ao último grupo
        currentGroup = chatMessages.lastElementChild;
        if (!currentGroup) return; 

        const contentDiv = currentGroup.querySelector('.chat-message-content');
        const newParagraph = document.createElement('p');
        
        // Formatação simples de negrito (transforma **texto** em <b>texto</b>)
        let formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        
        newParagraph.innerHTML = formattedContent;
        contentDiv.appendChild(newParagraph);
        
    } else {
        // Novo remetente: cria um novo grupo de mensagens
        currentGroup = document.createElement('div');
        currentGroup.className = 'chat-message-group fade-in';
        
        // Estiliza o novo grupo com a cor do jogador (borda e background com opacidade)
        currentGroup.style.border = `1px solid ${senderColor}`;
        currentGroup.style.background = `rgba(${rgbColor}, 0.1)`;
        
        // Injeta o estilo para o pseudo-elemento ::before (glow)
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            #chatMessages .chat-message-group:last-child::before {
                background: ${senderColor};
            }
        `;
        currentGroup.appendChild(styleElement); 

        // Cabeçalho (Nome e Emoji)
        const header = document.createElement('div');
        header.className = 'chat-message-header';
        header.style.color = senderColor; 
        header.style.borderBottom = `1px solid rgba(${rgbColor}, 0.3)`;
        header.innerHTML = `${senderEmoji} ${senderName}`;
        currentGroup.appendChild(header);

        // Conteúdo (Mensagem)
        const contentDiv = document.createElement('div');
        contentDiv.className = 'chat-message-content';
        const newParagraph = document.createElement('p');
        
        let formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        
        newParagraph.innerHTML = formattedContent;
        contentDiv.appendChild(newParagraph);
        currentGroup.appendChild(contentDiv);
        
        chatMessages.appendChild(currentGroup);
        
        // Atualiza o último remetente
        lastSender = { name: senderName, color: senderColor };
    }
    
    // Rolagem automática para baixo para mostrar a mensagem mais recente
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Funções de controle do Chat (chamadas pelo HTML)
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
/**
 * Adiciona um jogador à lista (apenas visual, sem sincronização de servidor).
 * @param {object} player Dados do jogador.
 */
function addPlayerToList(player) {
    const playersListContent = document.getElementById('playersListContent');
    if (!playersListContent) return; 
    
    const playerItem = document.createElement('div');
    playerItem.className = 'player-item';
    
    // Adiciona o listener para retrair/expandir a lista (togglePlayersList)
    playerItem.setAttribute('onclick', 'togglePlayersList()'); 
    
    // player-indicator é o elemento que exibe a cor na versão minimizada
    playerItem.innerHTML = `
        <div class="player-indicator" style="background: ${player.color};"></div>
        <div class="player-emoji">${player.emoji}</div>
        <div class="player-name">${player.name}</div>
    `;
    
    playersListContent.appendChild(playerItem);
    
    // TODO: Adicionar lógica para adicionar jogadores de outros clientes
}

function togglePlayersList() {
    // Alterna a classe 'minimized' para retrair/expandir a lista
    document.getElementById('playersList').classList.toggle('minimized');
}

// ========== ATALHOS DE TECLADO ==========
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Só funciona na tela de jogo
        if (document.getElementById('gameScreen').classList.contains('active')) {
            
            // Ctrl+C: Abrir/Fechar Chat
            if (e.ctrlKey && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                const chatContainer = document.getElementById('chatContainer');
                if (chatContainer.classList.contains('closed')) {
                    openChat();
                } else {
                    closeChat();
                }
            }
            
            // Ctrl+F: Abrir/Fechar/Minimizar Ficha de Personagem
            if (e.ctrlKey && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                const sheet = document.getElementById('characterSheet');
                if (sheet.classList.contains('closed')) {
                    openCharacterSheet(); 
                } else if (sheet.classList.contains('minimized')) {
                    minimizeCharacterSheet(); // Maximiza
                } else {
                    closeCharacterSheet(); // Fecha totalmente
                }
            }
            
            // Ctrl+D: Abrir/Fechar/Minimizar Bandeja de Dados
            if (e.ctrlKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                const tray = document.getElementById('diceTray');
                if (tray.classList.contains('closed')) {
                    openDiceTray();
                } else if (tray.classList.contains('minimized')) {
                    minimizeDiceTray(); // Maximiza
                } else {
                    closeDiceTray(); // Fecha totalmente
                }
            }
            
            // Atalhos de ferramentas (V, R, P, I)
            switch(e.key.toLowerCase()) {
                case 'v':
                    // Seleciona a ferramenta Mover (✋)
                    document.querySelector('[data-tool="move"]').click();
                    break;
                case 'r':
                    // Seleciona a ferramenta Régua (📏)
                    document.querySelector('[data-tool="ruler"]').click();
                    break;
                case 'p':
                    // Seleciona a ferramenta Paredes (🧱), apenas para o Mestre
                    if (playerData.isMaster) {
                        document.querySelector('[data-tool="wall"]').click();
                    }
                    break;
                case 'i':
                    // Seleciona a ferramenta Inimigos (👾), apenas para o Mestre
                    if (playerData.isMaster) {
                        document.querySelector('[data-tool="enemy"]').click();
                    }
                    break;
            }
        }
    });
}
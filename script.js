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
    { name: "Bola de Fogo", damage: "8d6", type: "Magia", description: "Grande explosão mágica. (Área: Círculo)" },
    { name: "Arco Longo", damage: "1d8", type: "Comum", description: "Ataque de longo alcance." },
];

// Objeto para armazenar o nível de proficiência das perícias.
// Chave: Nome da perícia, Valor: Nível (0: Sem, 2: Proficiência, 3: Expertise)
let characterSkills = {};

// D&D 5e Atributos
let characterAttributes = {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10
};

let proficiencyBonus = 2; // +2 no nível 1, atualizável depois

const ATTR_MAP = {
    'For': 'str', // Força
    'Des': 'dex', // Destreza
    'Con': 'con', // Constituição
    'Int': 'int', // Inteligência
    'Sab': 'wis', // Sabedoria
    'Car': 'cha'  // Carisma (usando a abreviação do português)
};

// Função para calcular o modificador de atributo (D&D 5e: (Pontuação - 10) / 2)
function getModifier(score) {
    return Math.floor((score - 10) / 2);
}

// Tabela de perícias (D&D 5e) com o atributo base
const SKILLS_LIST = [
    { name: 'Acrobacia', attr: 'dex', pt: 'Acrobacia' },
    { name: 'Adestrar Animais', attr: 'wis', pt: 'Trato com Animais' },
    { name: 'Arcanismo', attr: 'int', pt: 'Arcanismo' },
    { name: 'Atletismo', attr: 'str', pt: 'Atletismo' },
    { name: 'Atuação', attr: 'cha', pt: 'Atuação' },
    { name: 'Enganação', attr: 'cha', pt: 'Enganação' },
    { name: 'Furtividade', attr: 'dex', pt: 'Furtividade' },
    { name: 'História', attr: 'int', pt: 'História' },
    { name: 'Intimidação', attr: 'cha', pt: 'Intimidação' },
    { name: 'Intuição', attr: 'wis', pt: 'Intuição' },
    { name: 'Investigação', attr: 'int', pt: 'Investigação' },
    { name: 'Medicina', attr: 'wis', pt: 'Medicina' },
    { name: 'Natureza', attr: 'int', pt: 'Natureza' },
    { name: 'Percepção', attr: 'wis', pt: 'Percepção' },
    { name: 'Persuasão', attr: 'cha', pt: 'Persuasão' },
    { name: 'Religião', attr: 'int', pt: 'Religião' },
    { name: 'Sobrevivência', attr: 'wis', pt: 'Sobrevivência' },
    { name: 'Prestidigitação', attr: 'dex', pt: 'Prestidigitação' },
];

/* FUNÇÃO: renderAttributes() - Gera o HTML dos atributos e seus modificadores */
function renderAttributes() {
    const grid = document.getElementById('attributesGrid');
    if (!grid) return;

    const attrNames = {
        str: 'Força (FOR)',
        dex: 'Destreza (DES)',
        con: 'Constituição (CON)',
        int: 'Inteligência (INT)',
        wis: 'Sabedoria (SAB)',
        cha: 'Carisma (CAR)'
    };

    grid.innerHTML = Object.keys(characterAttributes).map(key => {
        const score = characterAttributes[key];
        const mod = getModifier(score);
        
        // Formata o modificador (ex: +2 ou -1)
        const modDisplay = mod >= 0 ? '+' + mod : mod;

        return `
            <div class="attr-item">
                <label>${attrNames[key]}</label>
                <div class="attr-mod" data-attr="${key}">${modDisplay}</div>
                <input type="number" class="attr-score-input" data-attr="${key}" value="${score}" min="1" max="30">
            </div>
        `;
    }).join('');
}


// Função para renderizar a lista de perícias
function renderSkills() {
    const list = document.getElementById('skillsList');
    if (!list) return;

    list.innerHTML = SKILLS_LIST.map(skill => {
        // Inicializa a perícia se não estiver no objeto
        if (characterSkills[skill.name] === undefined) {
            characterSkills[skill.name] = 0; // 0: Não Proficiente
        }

        const level = characterSkills[skill.name];
        // Obtém o modificador do atributo base
        const attrMod = getModifier(characterAttributes[skill.attr]);
        
        let totalMod = attrMod;
        
        // Aplica o Bônus de Proficiência (BP)
        if (level > 0) {
            totalMod += proficiencyBonus; 
        }
        
        // Aplica Expertise (soma um BP adicional)
        if (level === 3) {
            totalMod += proficiencyBonus; 
        }
        
        const modDisplay = totalMod >= 0 ? '+' + totalMod : totalMod;

        return `
            <li class="skill-entry" data-skill="${skill.name}" data-attr="${skill.attr}">
                <div class="skill-level-toggle">
                    <button class="level-icon-btn" onclick="toggleSkillLevel('${skill.name}', event)">
                        <span class="level-icon level-${level}" style="--fill-color: ${playerData.color};"></span>
                    </button>
                    <div class="skill-level-menu" id="menu-${skill.name}">
                        <button class="menu-option-btn" onclick="setSkillLevel('${skill.name}', 0, event)">Não Treinado</button>
                        <button class="menu-option-btn" onclick="setSkillLevel('${skill.name}', 2, event)">Proficiência</button>
                        <button class="menu-option-btn" onclick="setSkillLevel('${skill.name}', 3, event)">Expertise</button>
                    </div>
                </div>
                <div class="skill-info">
                    <span class="skill-mod">${modDisplay}</span> 
                    <span class="skill-name">${skill.pt} (${skill.attr.toUpperCase()})</span>
                </div>
            </li>
        `;
    }).join('');
}

// Funções de Perícias (Toggle e Set Level)
let openSkillMenu = null; // Variável para rastrear o menu aberto

function toggleSkillLevel(skillName, event) {
    event.stopPropagation();
    const menu = document.getElementById(`menu-${skillName}`);

    // Fecha qualquer outro menu aberto
    if (openSkillMenu && openSkillMenu !== menu) {
        openSkillMenu.classList.remove('open');
    }

    // Abre/fecha o menu atual
    if (menu) {
        menu.classList.toggle('open');
        openSkillMenu = menu.classList.contains('open') ? menu : null;
    }
}

function setSkillLevel(skillName, level, event) {
    event.stopPropagation();
    characterSkills[skillName] = level;
    renderSkills(); // Re-renderiza para atualizar os ícones e modificadores
    
    // Fecha o menu após a seleção
    const menu = document.getElementById(`menu-${skillName}`);
    if (menu) {
        menu.classList.remove('open');
        openSkillMenu = null;
    }
}

// Listener para fechar o menu de perícias se clicar fora
document.addEventListener('click', function() {
    if (openSkillMenu) {
        openSkillMenu.classList.remove('open');
        openSkillMenu = null;
    }
});
// Fim Funções de Perícias

// Função para renderizar a lista de armas
function renderWeapons() {
    const list = document.getElementById('weaponList');
    if (!list) return;

    list.innerHTML = characterWeapons.map((weapon, index) => `
        <li class="item-entry" data-weapon-index="${index}">
            <span>${weapon.name} (${weapon.damage})</span>
            <button onclick="removeWeapon(${index})">×</button>
        </li>
    `).join('');
}

// Função para remover uma arma
function removeWeapon(index) {
    characterWeapons.splice(index, 1);
    renderWeapons();
    // Re-renderiza a AttackBar para sincronizar
    renderAttackBar();
}

// Função para renderizar a AttackBar
function renderAttackBar() {
    const attackBar = document.getElementById('attackBar');
    if (!attackBar) return;
    
    // Filtra as armas existentes para criar os slots
    const weaponSlots = characterWeapons.map(weapon => `
        <div 
            class="attack-slot" 
            data-name="${weapon.name}" 
            data-damage="${weapon.damage}" 
            data-description="${weapon.description}"
            onclick="rollAttack('${weapon.name}', '${weapon.damage}')">
            ${weapon.type === 'Magia' ? '🔥' : weapon.type === 'Arco Longo' ? '🏹' : '⚔️'}
        </div>
    `).join('');
    
    // Adiciona o botão '+' no final
    const addButton = '<div class="attack-slot" title="Adicionar Arma" id="openAttackFormBtn">+</div>';
    
    attackBar.innerHTML = weaponSlots + addButton;
    
    // Adiciona listener para o novo botão '+'
    document.getElementById('openAttackFormBtn').addEventListener('click', openAddWeaponForm);
}

// Função de exemplo para rolagem de ataque (simulação)
function rollAttack(name, damage) {
    const diceRoll = Math.floor(Math.random() * 20) + 1;
    let rollMessage = `
        <p>⚔️ ${playerData.name} atacou com ${name}!</p>
        <p>Rolagem (d20): ${diceRoll} (simulando +0 de modificador).</p>
        <p>Dano: ${damage} (simulando rolagem de dano).</p>
    `;
    
    addChatMessage(playerData.name, playerData.emoji, rollMessage, playerData.color);
}

// Função para adicionar uma mensagem ao chat
function addChatMessage(senderName, senderEmoji, message, color) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    // Cria um novo grupo de mensagens
    const msgGroup = document.createElement('div');
    msgGroup.classList.add('chat-message-group');
    msgGroup.style.borderColor = color; // Borda opcional
    msgGroup.style.boxShadow = `0 0 10px ${color}1A`; // Sombra suave

    // Estilo para o glow (usado no CSS com ::before)
    const styleSheet = document.styleSheets[0];
    const ruleIndex = styleSheet.insertRule(`.chat-message-group::before { background-color: ${color}; }`, styleSheet.cssRules.length);
    
    // Cabeçalho da mensagem (Nome e Emoji)
    const msgHeader = document.createElement('div');
    msgHeader.classList.add('chat-message-header');
    msgHeader.innerHTML = `${senderEmoji} ${senderName}`;
    msgGroup.appendChild(msgHeader);

    // Conteúdo da mensagem
    const msgContent = document.createElement('div');
    msgContent.classList.add('chat-message-content');
    msgContent.innerHTML = message;
    msgGroup.appendChild(msgContent);

    messagesContainer.appendChild(msgGroup);

    // Auto-scroll para a mensagem mais recente
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Função para inicializar o jogo após login
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Inicializa tokens (exemplo: adicionar token do jogador)
    tokens.push({ x: 5, y: 5, color: playerData.color, emoji: playerData.emoji });

    drawGrid();

    // Inicializa renderizações da ficha
    renderAttributes();
    renderSkills();
    renderWeapons();
    renderAttackBar();

    // Inicializa atalhos de teclado
    setupKeyboardShortcuts();

    // Inicializa listeners do canvas
    canvas.addEventListener('mousedown', onCanvasMouseDown);
    canvas.addEventListener('mousemove', onCanvasMouseMove);
    canvas.addEventListener('mouseup', onCanvasMouseUp);
    canvas.addEventListener('wheel', onCanvasWheel);

    // Torna a ficha arrastável pelo header
    makeMovable(document.getElementById('characterSheet'), document.querySelector('.sheet-header'));
    // Torna o chat arrastável
    makeMovable(document.getElementById('chatContainer'), document.querySelector('.chat-header'));
    // Torna a bandeja de dados arrastável
    makeMovable(document.getElementById('diceTray'), document.querySelector('.dice-tray-header'));
}

// ============ CORREÇÃO DO ARRASTAR VS CLICAR ============
function makeMovable(element, handle) {
    if (!handle) return;
    
    let isDraggingSheet = false;
    let startX, startY, startLeft, startTop;

    handle.addEventListener('mousedown', (e) => {
        // [CORREÇÃO] Se o alvo do clique for um botão (ou filho de um botão), NÃO inicie o arrasto.
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            return;
        }

        isDraggingSheet = true;
        startX = e.clientX;
        startY = e.clientY;
        
        // Obtém a posição computada atual
        const style = window.getComputedStyle(element);
        startLeft = parseInt(style.left, 10);
        startTop = parseInt(style.top, 10);
        
        // Se left/top não estiverem definidos (ex: auto), usa getBoundingClientRect
        if (isNaN(startLeft)) startLeft = element.getBoundingClientRect().left;
        if (isNaN(startTop)) startTop = element.getBoundingClientRect().top;

        document.addEventListener('mousemove', onMouseMoveSheet);
        document.addEventListener('mouseup', onMouseUpSheet);
    });

    function onMouseMoveSheet(e) {
        if (isDraggingSheet) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            element.style.left = `${startLeft + dx}px`;
            element.style.top = `${startTop + dy}px`;
        }
    }

    function onMouseUpSheet() {
        isDraggingSheet = false;
        document.removeEventListener('mousemove', onMouseMoveSheet);
        document.removeEventListener('mouseup', onMouseUpSheet);
    }
}

// Função de Login
document.getElementById('loginBtn').addEventListener('click', () => {
    const playerNameInput = document.getElementById('playerName');
    const name = playerNameInput.value.trim() || 'Aventureiro(a) Anônimo(a)';

    playerData.name = name;
    playerData.color = selectedColor;
    playerData.emoji = selectedEmoji;
    playerData.isMaster = selectedEmoji === '👑'; 
    
    document.getElementById('loginScreen').style.display = 'none';
    const gameScreen = document.getElementById('gameScreen');
    gameScreen.style.display = 'block';
    gameScreen.classList.add('active');

    // Inicializa o jogo
    initGame();
});

// Funções para drawGrid e drawTokens (exemplo básico)
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#333';
    for (let x = offsetX % (gridSize * scale); x < canvas.width; x += gridSize * scale) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = offsetY % (gridSize * scale); y < canvas.height; y += gridSize * scale) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    drawTokens();
}

function drawTokens() {
    tokens.forEach(token => {
        const screenX = (token.x * gridSize * scale) + offsetX;
        const screenY = (token.y * gridSize * scale) + offsetY;
        ctx.fillStyle = token.color;
        ctx.beginPath();
        ctx.arc(screenX + (gridSize * scale / 2), screenY + (gridSize * scale / 2), (gridSize * scale / 2) - 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.font = `${gridSize * scale / 2}px sans-serif`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(token.emoji, screenX + (gridSize * scale / 2), screenY + (gridSize * scale / 2));
    });
}

// ============ FUNÇÕES DE JANELAS (CORRIGIDAS) ============
function minimizeChat() {
    const chat = document.getElementById('chatContainer');
    if(chat) {
        chat.classList.remove('closed');
        chat.classList.toggle('minimized');
    }
}

function closeChat() {
    const chat = document.getElementById('chatContainer');
    if(chat) {
        chat.classList.add('closed');
        chat.classList.remove('minimized');
    }
}

function minimizeCharacterSheet() {
    const sheet = document.getElementById('characterSheet');
    if(sheet) {
        sheet.classList.remove('closed');
        sheet.classList.toggle('minimized');
    }
}

function closeCharacterSheet() {
    const sheet = document.getElementById('characterSheet');
    if(sheet) {
        sheet.classList.add('closed');
        sheet.classList.remove('minimized');
    }
}

function minimizeDiceTray() {
    const tray = document.getElementById('diceTray');
    if(tray) {
        tray.classList.remove('closed');
        tray.classList.toggle('minimized');
    }
}

function closeDiceTray() {
    const tray = document.getElementById('diceTray');
    if(tray) {
        tray.classList.add('closed');
        tray.classList.remove('minimized');
    }
}

// Atalhos de teclado corrigidos com Ctrl e preventDefault
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ignora atalhos se o foco estiver em um input ou textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        if (e.ctrlKey) {
            switch (e.key.toLowerCase()) {
                case 'c':
                    e.preventDefault();
                    // Usa a função de toggle para consistência
                    const chat = document.getElementById('chatContainer');
                    if (chat.classList.contains('closed')) {
                        chat.classList.remove('closed');
                    } else {
                        closeChat();
                    }
                    return;
                case 'f':
                    e.preventDefault();
                    const sheet = document.getElementById('characterSheet');
                    if (sheet.classList.contains('closed')) {
                        sheet.classList.remove('closed');
                    } else {
                        closeCharacterSheet();
                    }
                    return;
                case 'd':
                    e.preventDefault();
                    const tray = document.getElementById('diceTray');
                    if (tray.classList.contains('closed')) {
                        tray.classList.remove('closed');
                    } else {
                        closeDiceTray();
                    }
                    return;
            }
        }

        // Atalhos para ferramentas (sem Ctrl)
        switch (e.key.toLowerCase()) {
            case 'v':
                // Seleciona a ferramenta Mover (✋)
                const moveBtn = document.querySelector('[data-tool="move"]');
                if(moveBtn) moveBtn.click();
                break;
            case 'r':
                // Seleciona a ferramenta Régua (📏)
                const rulerBtn = document.querySelector('[data-tool="ruler"]');
                if(rulerBtn) rulerBtn.click();
                break;
            case 'p':
                // Seleciona a ferramenta Paredes (🧱), apenas para o Mestre
                if (playerData.isMaster) {
                    const wallBtn = document.querySelector('[data-tool="wall"]');
                    if(wallBtn) wallBtn.click();
                }
                break;
            case 'i':
                // Seleciona a ferramenta Inimigos (👾), apenas para o Mestre
                if (playerData.isMaster) {
                    const enemyBtn = document.querySelector('[data-tool="enemy"]');
                    if(enemyBtn) enemyBtn.click();
                }
                break;
        }
    });
}

/* NOVO LISTENER: Trata a mudança de valor nos inputs de Atributos */
document.addEventListener('input', function(e) {
    if (e.target.matches('.attr-score-input')) {
        const attrKey = e.target.dataset.attr;
        let score = parseInt(e.target.value);
        if (isNaN(score)) score = 10;
        
        // Limita o valor do atributo entre 1 e 30
        score = Math.max(1, Math.min(30, score));
        e.target.value = score;
        
        characterAttributes[attrKey] = score;

        // Atualiza o mod visual no elemento
        const modEl = document.querySelector(`.attr-mod[data-attr="${attrKey}"]`);
        if (modEl) {
            const mod = getModifier(score);
            modEl.textContent = mod >= 0 ? '+' + mod : mod;
        }

        // Re-renderiza perícias para atualizar mods totais
        renderSkills();
    }
});

// Outros listeners (ferramentas, chat, etc.)
document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const newTool = e.currentTarget.dataset.tool;
        
        // Se for régua, o sub-botão deve ser clicado
        if (newTool === 'ruler') return; // Ignora clique no principal se for ruler
            
        // Lógica de seleção de ferramenta
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.tool-btn[data-tool="${newTool}"]`).classList.add('active');
        currentTool = newTool;
    });
});

// Listeners para a seleção de tipo de régua
document.querySelectorAll('.tool-btn-sub').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Previne que o clique ative o .tool-btn pai
        
        const newRulerType = e.currentTarget.dataset.ruler;
        
        // Seleciona a ferramenta 'ruler' no botão principal
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.tool-btn[data-tool="ruler"]').classList.add('active');
        currentTool = 'ruler';
        
        // Lógica de seleção do tipo de régua
        document.querySelectorAll('.tool-btn-sub').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        currentRulerType = newRulerType;
    });
});

// Listener para o input do chat
document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const message = e.target.value.trim();
        if (message) {
            // Simula um roll de dado se começar com '/'
            if (message.startsWith('/roll')) {
                rollDiceFromChat(message);
            } else {
                addChatMessage(playerData.name, playerData.emoji, `<p>${message}</p>`, playerData.color);
            }
            e.target.value = '';
        }
    }
});

// Listeners para a seleção de cor no login
document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', (e) => {
        document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        selectedColor = e.currentTarget.dataset.color;
        // Atualiza a cor primária dinâmica para o preview
        document.documentElement.style.setProperty('--primary-color', selectedColor);
    });
});

// Listeners para a seleção de emoji no login
document.querySelectorAll('.emoji-option').forEach(option => {
    option.addEventListener('click', (e) => {
        document.querySelectorAll('.emoji-option').forEach(o => o.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        selectedEmoji = e.currentTarget.dataset.emoji;
    });
});

// Inicializa a seleção padrão
document.querySelector('.color-option[data-color="#6b7280"]').classList.add('selected');
document.querySelector('.emoji-option[data-emoji="👤"]').classList.add('selected');

// Listeners para a bandeja de dados
document.querySelectorAll('.dice-btn').forEach(btn => {
    btn.addEventListener('click', toggleDiceSelection);
});
document.querySelector('.roll-btn').addEventListener('click', rollSelectedDice);

// Listener para o compêndio
document.getElementById('wallTool').addEventListener('click', toggleCompendium);
document.getElementById('closeCompendiumBtn').addEventListener('click', toggleCompendium);

function toggleCompendium() {
    const compendium = document.getElementById('enemyCompendium');
    compendium.classList.toggle('active');
}


function rollDiceFromChat(command) {
    const parts = command.split(' ');
    // Ex: /roll 2d6 + 3
    if (parts.length < 2) {
        addChatMessage('Sistema', '🤖', `<p>Comando de rolagem inválido. Use: /roll 2d6+3</p>`, '#ef4444');
        return;
    }
    
    const rollString = parts[1]; // Ex: 2d6+3 ou 1d20
    const match = rollString.match(/(\d+)d(\d+)([\+\-]\d+)?/);

    if (!match) {
        addChatMessage('Sistema', '🤖', `<p>Formato de dado inválido. Ex: 2d6 ou 1d20+5</p>`, '#ef4444');
        return;
    }

    const numDice = parseInt(match[1]);
    const diceType = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;
    
    let totalRoll = 0;
    let individualRolls = [];

    for (let i = 0; i < numDice; i++) {
        const roll = Math.floor(Math.random() * diceType) + 1;
        individualRolls.push(roll);
        totalRoll += roll;
    }

    const finalResult = totalRoll + modifier;
    
    let rollMessage = `
        <p>🎲 ${playerData.name} rolou ${numDice}d${diceType}${modifier >= 0 ? '+' : ''}${modifier}!</p>
        <p>Resultados: ${individualRolls.join(' + ')} ${modifier !== 0 ? (modifier >= 0 ? '+' : '') + modifier : ''} = <strong>${finalResult}</strong></p>
    `;
    
    addChatMessage(playerData.name, playerData.emoji, rollMessage, playerData.color);
}


// Lógica da bandeja de dados
let diceCounts = { d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0 };

function toggleDiceSelection(e) {
    const btn = e.currentTarget;
    const dice = btn.dataset.dice;
    
    if (btn.classList.contains('selected')) {
        diceCounts[dice]++;
    } else {
        btn.classList.add('selected');
        diceCounts[dice] = 1;
    }
    
    if (diceCounts[dice] > 9) diceCounts[dice] = 0; // Limite de 9 dados por tipo
    
    if (diceCounts[dice] === 0) {
        btn.classList.remove('selected');
    }
    
    btn.querySelector('.dice-count').textContent = diceCounts[dice];
}

function rollSelectedDice() {
    const modifierInput = document.querySelector('.modifier-input');
    const modifier = parseInt(modifierInput.value) || 0;
    
    let totalRoll = 0;
    let rollDetails = [];
    let rollString = '';
    
    for (const dice in diceCounts) {
        const count = diceCounts[dice];
        if (count > 0) {
            const diceType = parseInt(dice.substring(1));
            rollString += `${count}${dice} `;
            
            for (let i = 0; i < count; i++) {
                const roll = Math.floor(Math.random() * diceType) + 1;
                totalRoll += roll;
                rollDetails.push({ roll, diceType });
            }
        }
    }
    
    if (totalRoll === 0) {
        addChatMessage('Sistema', '🤖', `<p>Selecione pelo menos um dado para rolar.</p>`, '#ef4444');
        return;
    }
    
    const finalResult = totalRoll + modifier;
    const individualRolls = rollDetails.map(d => d.roll);
    
    let rollMessage = `
        <p>🎲 ${playerData.name} rolou: ${rollString.trim()}${modifier !== 0 ? (modifier >= 0 ? '+' : '') + modifier : ''}</p>
        <p>Resultados: ${individualRolls.join(' + ')} ${modifier !== 0 ? (modifier >= 0 ? '+' : '') + modifier : ''} = <strong>${finalResult}</strong></p>
    `;
    
    addChatMessage(playerData.name, playerData.emoji, rollMessage, playerData.color);
    
    // Limpar seleção
    diceCounts = { d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0 };
    document.querySelectorAll('.dice-btn').forEach(btn => {
        btn.classList.remove('selected');
        btn.querySelector('.dice-count').textContent = 0;
    });
    modifierInput.value = '0';
}


// Pan e Zoom
function onCanvasMouseDown(e) {
    if (currentTool === 'move') {
        isDragging = true;
        canvas.classList.add('grabbing');
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    }
}

function onCanvasMouseMove(e) {
    if (isDragging) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        
        offsetX += dx;
        offsetY += dy;

        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        
        drawGrid();
    }
}

function onCanvasMouseUp() {
    isDragging = false;
    canvas.classList.remove('grabbing');
}

function onCanvasWheel(e) {
    e.preventDefault();
    
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9; // 10% de zoom por tick

    // Limita o zoom
    const newScale = Math.max(0.5, Math.min(3.0, scale * zoomFactor));
    
    // Calcula o ponto de zoom (centro da tela)
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    // Converte coordenadas do cliente para coordenadas do grid (antes do zoom)
    const gridXBefore = (clientX - offsetX) / (gridSize * scale);
    const gridYBefore = (clientY - offsetY) / (gridSize * scale);

    scale = newScale;

    // Converte coordenadas do grid para coordenadas do cliente (após o zoom)
    const gridXAfter = gridXBefore * (gridSize * scale);
    const gridYAfter = gridYBefore * (gridSize * scale);
    
    // Ajusta o offset para manter o ponto de zoom no lugar
    offsetX = clientX - gridXAfter;
    offsetY = clientY - gridYAfter;

    drawGrid();
}

// Função para abrir formulário de adicionar arma
function openAddWeaponForm() {
    // Implementação do formulário inline (exemplo, ajuste conforme necessário)
    const formContainer = document.getElementById('addWeaponFormContainer');
    formContainer.style.display = 'block';
    // Adicione listeners para confirm/cancel se necessário
}
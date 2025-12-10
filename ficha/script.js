// script.js (Código Completo Atualizado com Tabela de Armas D&D 2024 e Abas)

document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores da Ficha (Sheet Selectors) ---
    const sheet = document.querySelector('.character-sheet');
    const handle = document.querySelector('.sheet-header');
    const minimizeBtn = document.getElementById('minimize-btn');
    const closeBtn = document.getElementById('close-btn');

    // --- Lógica de Arrastar (Drag) ---
    let isDragging = false;
    let offsetX, offsetY;

    handle.addEventListener('mousedown', (e) => {
        // Ignorar cliques nos botões de controle e no dropdown customizado
        if (e.target.closest('.controls') || e.target.closest('.custom-select')) return;

        isDragging = true;
        sheet.style.cursor = 'grabbing';
        handle.style.cursor = 'grabbing';
        
        // Assegura que o elemento está posicionado para mover
        sheet.style.position = 'absolute';
        sheet.style.transform = 'none'; // Remove a centralização inicial

        offsetX = e.clientX - sheet.offsetLeft;
        offsetY = e.clientY - sheet.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        let newX = e.clientX - offsetX;
        let newY = e.clientY - offsetY;

        sheet.style.left = newX + 'px';
        sheet.style.top = newY + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            sheet.style.cursor = 'grab';
            handle.style.cursor = 'grab';
        }
    });

    // --- Lógica de Minimizar/Maximizar ---
    minimizeBtn.addEventListener('click', () => {
        // Alterna a classe 'minimized' no elemento principal da ficha
        sheet.classList.toggle('minimized');
        
        // Muda o texto do botão
        minimizeBtn.textContent = sheet.classList.contains('minimized') ? '☐' : '_';
        minimizeBtn.title = sheet.classList.contains('minimized') ? 'Maximizar Ficha' : 'Minimizar Ficha';
    });

    // --- Lógica de Fechar/Abrir (Display) ---
    closeBtn.addEventListener('click', () => {
        // Esconde a ficha
        sheet.style.display = 'none';
    });
    
    // --- Lógica do Atalho de Teclado (Ctrl + F) ---
    document.addEventListener('keydown', (e) => {
        // Verifica se Ctrl (ou Command no Mac) e a tecla 'f' foram pressionadas
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault(); // Impede a abertura da busca do navegador
            
            // Alterna a visibilidade da ficha
            const isHidden = sheet.style.display === 'none';
            sheet.style.display = isHidden ? 'block' : 'none';
            
            if (isHidden) {
                sheet.classList.remove('minimized'); 
                minimizeBtn.textContent = '_'; 
                minimizeBtn.title = 'Minimizar Ficha';
            }
        }
    });
    
    // ----------------------------------------------------------------------
    // --- LÓGICA DE HP ---
    // ----------------------------------------------------------------------

    // --- Seletores para Lógica de HP ---
    const hpCurrentInput = document.getElementById('HPCurrentInput'); // Campo do valor de Cura/Dano
    const hpMaxHidden = document.getElementById('HPMax');             // Campo oculto do HP Máximo
    const hpMaxDisplay = document.getElementById('HPMaxDisplay');     // Campo de exibição "Atual/Máximo"
    const hpTempInput = document.getElementById('HPTemp');           // Campo do HP Temporário
    const incrementBtn = document.getElementById('increment-hp');    // Botão de Cura
    const decrementBtn = document.getElementById('decrement-hp');    // Botão de Dano
    const shortRestBtn = document.getElementById('short-rest-btn');  // Botão de Descanso Curto
    const longRestBtn = document.getElementById('long-rest-btn');    // Botão de Descanso Longo

    // Variável que armazena o HP Real Atual (sem o temporário)
    let realCurrentHP = parseInt(hpMaxHidden.value) || 10; 

    // Função que atualiza o display 'Atual/Máximo'
    const updateHPDisplay = () => {
        let max = parseInt(hpMaxHidden.value) || 10;
        let tempHP = parseInt(hpTempInput.value) || 0;
        
        // HP Atual exibido é o Real + o Temporário
        let displayedCurrentHP = realCurrentHP + tempHP;

        hpMaxDisplay.value = `${displayedCurrentHP}/${max}`;
    };

    // Define o valor do HP real e atualiza a exibição
    const setRealHP = (newHP) => {
        let max = parseInt(hpMaxHidden.value) || 10;
        
        realCurrentHP = Math.min(Math.max(0, newHP), max);
        updateHPDisplay();
    };

    // Funções para manipular a saúde do personagem
    const healDamage = (amount) => {
        setRealHP(realCurrentHP + amount);
    };

    const takeDamage = (amount) => {
        let tempHP = parseInt(hpTempInput.value) || 0;
        let remainingDamage = amount;

        // 1. O dano é absorvido primeiro pelo HP Temporário
        if (tempHP > 0) {
            if (remainingDamage >= tempHP) {
                remainingDamage -= tempHP;
                hpTempInput.value = 0; // Zera o HP Temporário
            } else {
                hpTempInput.value = tempHP - remainingDamage;
                remainingDamage = 0; // Todo o dano foi absorvido
            }
        }

        // 2. Se sobrar dano, ele atinge o HP Real
        if (remainingDamage > 0) {
            setRealHP(realCurrentHP - remainingDamage);
        }

        updateHPDisplay();
    };

    // --- Funções de Eventos HP ---

    incrementBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const amount = parseInt(hpCurrentInput.value) || 0;
        healDamage(amount);
        hpCurrentInput.value = 0; // Zera após a aplicação
    });

    decrementBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const amount = parseInt(hpCurrentInput.value) || 0;
        takeDamage(amount);
        hpCurrentInput.value = 0; // Zera após a aplicação
    });

    hpTempInput.addEventListener('change', updateHPDisplay);
    hpMaxHidden.addEventListener('change', (e) => {
        let newMax = parseInt(e.target.value) || 0;
        if (realCurrentHP > newMax) { setRealHP(newMax); }
        updateHPDisplay();
    });

    shortRestBtn.addEventListener('click', () => {
        let max = parseInt(hpMaxHidden.value) || 10;
        setRealHP(Math.min(realCurrentHP + Math.ceil(max * 0.5), max)); // Cura 50% do max
        hpTempInput.value = 0;
        updateHPDisplay();
    });

    longRestBtn.addEventListener('click', () => {
        setRealHP(parseInt(hpMaxHidden.value) || 10); // HP real volta ao máximo
        hpTempInput.value = 0;      // HP Temporário zera
        updateHPDisplay();
    });

    // Chamada inicial
    updateHPDisplay();


    // ----------------------------------------------------------------------
    // --- LÓGICA DO DROPDOWN CUSTOMIZADO (DadoHP) ---
    // ----------------------------------------------------------------------

    const customSelect = document.getElementById('DadoHPSelect');
    const selectedDiv = document.getElementById('DadoHPSelected');
    const itemsContainer = customSelect.querySelector('.select-items');
    const allItems = itemsContainer.querySelectorAll('div');

    const closeAllSelect = (elmnt) => {
        const x = document.getElementsByClassName('select-items');
        const y = document.getElementsByClassName('select-selected');
        
        for (let i = 0; i < y.length; i++) {
            if (elmnt !== y[i]) { y[i].classList.remove('select-arrow-active'); }
        }
        for (let i = 0; i < x.length; i++) {
            if (elmnt.nextSibling !== x[i]) { x[i].classList.add('select-hide'); }
        }
    };

    selectedDiv.addEventListener('click', function(e) {
        e.stopPropagation();
        closeAllSelect(this);
        itemsContainer.classList.toggle('select-hide');
        this.classList.toggle('select-arrow-active');
    });

    allItems.forEach(item => {
        item.addEventListener('click', function(e) {
            selectedDiv.textContent = this.textContent;
            selectedDiv.setAttribute('data-value', this.getAttribute('data-value'));
            closeAllSelect(selectedDiv);
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select')) {
            closeAllSelect({ nextSibling: null }); // Objeto auxiliar para fechar todos
        }
    });

    // ----------------------------------------------------------------------
    // --- LÓGICA DE ATRIBUTOS E MODIFICADORES ---
    // ----------------------------------------------------------------------

    const attributes = [
        { scoreId: 'for-score', modId: 'for-mod' },
        { scoreId: 'des-score', modId: 'des-mod' },
        { scoreId: 'con-score', modId: 'con-mod' },
        { scoreId: 'int-score', modId: 'int-mod' },
        { scoreId: 'car-score', modId: 'car-mod' },
        { scoreId: 'sab-score', modId: 'sab-mod' },
    ];

    const calculateModifier = (score) => {
        const value = parseInt(score) || 10;
        const modifier = Math.floor((value - 10) / 2);
        return modifier >= 0 ? `+${modifier}` : `${modifier}`;
    };

    const updateAttributeModifier = (scoreInput, modInput) => {
        const score = scoreInput.value;
        modInput.value = calculateModifier(score);
    };

    // ----------------------------------------------------------------------
    // --- LÓGICA DE PERÍCIAS (SKILL MODIFIERS) ---
    // ----------------------------------------------------------------------

    const proficiencyBonusInput = document.getElementById('proficiency-bonus');

    const skillMap = [
        // Mapeamento de perícias (FOR, DES, INT, SAB, CAR)
        { skillId: 'acrobacia', attrModId: 'des-mod' }, { skillId: 'prestidigitacao', attrModId: 'des-mod' },
        { skillId: 'furtividade', attrModId: 'des-mod' }, { skillId: 'atletismo', attrModId: 'for-mod' },
        { skillId: 'arcano', attrModId: 'int-mod' }, { skillId: 'historia', attrModId: 'int-mod' },
        { skillId: 'investigacao', attrModId: 'int-mod' }, { skillId: 'natureza', attrModId: 'int-mod' },
        { skillId: 'religiao', attrModId: 'int-mod' }, { skillId: 'adestrar', attrModId: 'sab-mod' },
        { skillId: 'intuicao', attrModId: 'sab-mod' }, { skillId: 'medicina', attrModId: 'sab-mod' },
        { skillId: 'percepcao', attrModId: 'sab-mod' }, { skillId: 'sobrevivencia', attrModId: 'sab-mod' },
        { skillId: 'enganacao', attrModId: 'car-mod' }, { skillId: 'intimidacao', attrModId: 'car-mod' },
        { skillId: 'atuacao', attrModId: 'car-mod' }, { skillId: 'persuasao', attrModId: 'car-mod' },
    ];

    const getProficiencyMultiplier = (proficiencyLevel) => {
        switch (proficiencyLevel) {
            case 'full': return 2; // Expertise
            case 'half': return 1; // Proficiente
            default: return 0; // Sem Treino
        }
    }

    const updateSkillModifier = (skillItem) => {
        const skillId = skillItem.getAttribute('data-skill-id');
        const skillData = skillMap.find(s => s.skillId === skillId);
        if (!skillData) return;

        const attributeModInput = document.getElementById(skillData.attrModId);
        const skillModInput = skillItem.querySelector('.modifier input');
        const proficiencyCircle = skillItem.querySelector('.proficiency-circle');

        const attrMod = parseInt(attributeModInput.value) || 0;
        const pb = parseInt(proficiencyBonusInput.value) || 0;
        const proficiencyLevel = proficiencyCircle.getAttribute('data-proficiency');
        const multiplier = getProficiencyMultiplier(proficiencyLevel);

        const skillModValue = attrMod + (pb * multiplier);
        const formattedSkillMod = skillModValue >= 0 ? `+${skillModValue}` : `${skillModValue}`;
        skillModInput.value = formattedSkillMod;
    };

    const updateAllSkillModifiers = () => {
        document.querySelectorAll('.skill-item').forEach(updateSkillModifier);
    }

    // Configuração dos Listeners para Atributos e PB
    attributes.forEach(attr => {
        const scoreInput = document.getElementById(attr.scoreId);
        const modInput = document.getElementById(attr.modId);

        if (scoreInput && modInput) {
            updateAttributeModifier(scoreInput, modInput);
            scoreInput.addEventListener('input', () => {
                updateAttributeModifier(scoreInput, modInput);
                updateAllSkillModifiers();
            });
        }
    });

    if (proficiencyBonusInput) {
        proficiencyBonusInput.addEventListener('input', updateAllSkillModifiers);
    }

    document.querySelectorAll('.proficiency-menu div').forEach(option => {
        option.addEventListener('click', (e) => {
            const newProficiency = e.target.getAttribute('data-value');
            const skillItem = e.target.closest('.skill-block').querySelector('.skill-item');
            const circleContainer = skillItem.querySelector('.proficiency-circle');

            circleContainer.setAttribute('data-proficiency', newProficiency);
            e.target.closest('.proficiency-menu').classList.add('select-hide');
            updateSkillModifier(skillItem);
        });
    });

    // Lógica de abertura/fechamento do menu de proficiência
    const proficiencyMenus = document.querySelectorAll('.proficiency-menu');
    const closeAllProficiencyMenus = (exceptMenu) => {
        proficiencyMenus.forEach(menu => {
            if (menu !== exceptMenu) { menu.classList.add('select-hide'); }
        });
    }

    document.querySelectorAll('.skill-item').forEach(item => {
        const proficiencyBtn = item.querySelector('.proficiency-btn');
        const menu = item.closest('.skill-block').querySelector('.proficiency-menu');
        proficiencyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllProficiencyMenus(menu);
            menu.classList.toggle('select-hide');
        });
        menu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });
    document.addEventListener('click', () => { closeAllProficiencyMenus(null); });
    updateAllSkillModifiers(); // Chamada inicial

    // ----------------------------------------------------------------------
    // --- LÓGICA DE TABELA DE ARMAS D&D 2024 ---
    // ----------------------------------------------------------------------

    const weaponData = [
        // Simples Corpo-a-Corpo
        { nome: 'Adaga', preco: '2 po', dano: '1d4', tipo: 'P', peso: '0,5', maestria: 'Incissão (Nick)', propriedades: 'Ágil (Finesse), Leve, Arremesso (6/18)' },
        { nome: 'Azagaia', preco: '5 pp', dano: '1d6', tipo: 'P', peso: '1', maestria: 'Lentidão (Slow)', propriedades: 'Arremesso (9/36)' },
        { nome: 'Cajado (Bordão)', preco: '2 pp', dano: '1d6', tipo: 'E', peso: '2', maestria: 'Derrubar (Topple)', propriedades: 'Versátil (1d8)' },
        { nome: 'Clava Grande', preco: '2 pp', dano: '1d8', tipo: 'E', peso: '5', maestria: 'Empurrão (Push)', propriedades: 'Duas Mãos' },
        { nome: 'Foice Curta', preco: '1 po', dano: '1d4', tipo: 'C', peso: '1', maestria: 'Incissão (Nick)', propriedades: 'Leve' },
        { nome: 'Lança', preco: '1 po', dano: '1d6', tipo: 'P', peso: '1,5', maestria: 'Esgotar (Sap)', propriedades: 'Versátil (1d8), Arremesso (6/18)' },
        { nome: 'Maça', preco: '5 po', dano: '1d6', tipo: 'E', peso: '2', maestria: 'Esgotar (Sap)', propriedades: '-' },
        { nome: 'Machadinha', preco: '5 po', dano: '1d6', tipo: 'C', peso: '1', maestria: 'Irritar (Vex)', propriedades: 'Leve, Arremesso (6/18)' },
        { nome: 'Martelo Leve', preco: '2 po', dano: '1d4', tipo: 'E', peso: '1', maestria: 'Incissão (Nick)', propriedades: 'Leve, Arremesso (6/18)' },
        { nome: 'Porrete', preco: '1 pp', dano: '1d4', tipo: 'E', peso: '1', maestria: 'Lentidão (Slow)', propriedades: 'Leve' },
        // Simples à Distância
        { nome: 'Arco Curto', preco: '25 po', dano: '1d6', tipo: 'P', peso: '1', maestria: 'Irritar (Vex)', propriedades: 'Munição, Duas Mãos, Alcance (24/96)' },
        { nome: 'Besta Leve', preco: '25 po', dano: '1d8', tipo: 'P', peso: '2,5', maestria: 'Lentidão (Slow)', propriedades: 'Munição, Recarga, Duas Mãos, Alcance (24/96)' },
        { nome: 'Dardo', preco: '5 pc', dano: '1d4', tipo: 'P', peso: '0,125', maestria: 'Irritar (Vex)', propriedades: 'Ágil (Finesse), Arremesso (6/18)' },
        { nome: 'Funda', preco: '1 pp', dano: '1d4', tipo: 'E', peso: '-', maestria: 'Lentidão (Slow)', propriedades: 'Munição, Alcance (9/36)' },
        // Marciais Corpo-a-Corpo
        { nome: 'Alabarda', preco: '20 po', dano: '1d10', tipo: 'C', peso: '3', maestria: 'Trespassar (Cleave)', propriedades: 'Pesada, Alcance (Reach), Duas Mãos' },
        { nome: 'Chicote', preco: '2 po', dano: '1d4', tipo: 'C', peso: '1,5', maestria: 'Lentidão (Slow)', propriedades: 'Ágil (Finesse), Alcance (Reach)' },
        { nome: 'Cimitarra', preco: '25 po', dano: '1d6', tipo: 'C', peso: '1,5', maestria: 'Incissão (Nick)', propriedades: 'Ágil (Finesse), Leve' },
        { nome: 'Espada Curta', preco: '10 po', dano: '1d6', tipo: 'P', peso: '1', maestria: 'Irritar (Vex)', propriedades: 'Ágil (Finesse), Leve' },
        { nome: 'Espada Duas Mãos (Montante)', preco: '50 po', dano: '2d6', tipo: 'C', peso: '3', maestria: 'Trespassar (Cleave)', propriedades: 'Pesada, Duas Mãos' },
        { nome: 'Espada Longa', preco: '15 po', dano: '1d8', tipo: 'C', peso: '1,5', maestria: 'Esgotar (Sap)', propriedades: 'Versátil (1d10)' },
        { nome: 'Florete', preco: '25 po', dano: '1d8', tipo: 'P', peso: '1', maestria: 'Irritar (Vex)', propriedades: 'Ágil (Finesse)' },
        { nome: 'Glaive', preco: '20 po', dano: '1d10', tipo: 'C', peso: '3', maestria: 'Relance (Graze)', propriedades: 'Pesada, Alcance (Reach), Duas Mãos' },
        { nome: 'Lança de Montaria', preco: '10 po', dano: '1d12', tipo: 'P', peso: '3', maestria: 'Derrubar (Topple)', propriedades: 'Alcance (Reach), Duas Mãos (exceto se montado)' },
        { nome: 'Maça Estrela', preco: '15 po', dano: '1d8', tipo: 'P', peso: '2', maestria: 'Esgotar (Sap)', propriedades: '-' },
        { nome: 'Machado de Batalha', preco: '10 po', dano: '1d8', tipo: 'C', peso: '2', maestria: 'Derrubar (Topple)', propriedades: 'Versátil (1d10)' },
        { nome: 'Machado Grande', preco: '30 po', dano: '1d12', tipo: 'C', peso: '3,5', maestria: 'Trespassar (Cleave)', propriedades: 'Pesada, Duas Mãos' },
        { nome: 'Mangual', preco: '10 po', dano: '1d8', tipo: 'E', peso: '1', maestria: 'Esgotar (Sap)', propriedades: '-' },
        { nome: 'Marreta (Malho)', preco: '10 po', dano: '2d6', tipo: 'E', peso: '5', maestria: 'Derrubar (Topple)', propriedades: 'Pesada, Duas Mãos' },
        { nome: 'Martelo de Guerra', preco: '15 po', dano: '1d8', tipo: 'E', peso: '1', maestria: 'Empurrão (Push)', propriedades: 'Versátil (1d10)' },
        { nome: 'Picareta de Guerra', preco: '5 po', dano: '1d8', tipo: 'P', peso: '1', maestria: 'Esgotar (Sap)', propriedades: '-' },
        { nome: 'Pique', preco: '5 po', dano: '1d10', tipo: 'P', peso: '9', maestria: 'Empurrão (Push)', propriedades: 'Pesada, Alcance (Reach), Duas Mãos' },
        { nome: 'Tridente', preco: '5 po', dano: '1d6', tipo: 'P', peso: '2', maestria: 'Derrubar (Topple)', propriedades: 'Arremesso (6/18), Versátil (1d8)' },
        // Marciais à Distância
        { nome: 'Arco Longo', preco: '50 po', dano: '1d8', tipo: 'P', peso: '1', maestria: 'Irritar (Vex)', propriedades: 'Munição, Pesada, Duas Mãos, Alcance (45/180)' },
        { nome: 'Besta de Mão', preco: '75 po', dano: '1d6', tipo: 'P', peso: '1,5', maestria: 'Irritar (Vex)', propriedades: 'Munição, Leve, Recarga, Alcance (9/36)' },
        { nome: 'Besta Pesada', preco: '50 po', dano: '1d10', tipo: 'P', peso: '9', maestria: 'Lentidão (Slow)', propriedades: 'Munição, Pesada, Recarga, Duas Mãos, Alcance (30/120)' },
        { nome: 'Rede', preco: '1 po', dano: '--', tipo: '-', peso: '1,5', maestria: 'Derrubar (Topple)', propriedades: 'Arremesso (1,5/4,5), Especial' },
        { nome: 'Zarabatana', preco: '10 po', dano: '1', tipo: 'P', peso: '0,5', maestria: 'Lentidão (Slow)', propriedades: 'Munição, Recarga, Alcance (7,5/30)' },
        // Armas de Fogo (Opcional)
        { nome: 'Mosquete', preco: '500 po', dano: '1d12', tipo: 'P', peso: '-', maestria: 'Lentidão (Slow)', propriedades: 'Carregamento, Duas Mãos, Alcance (12/36)' },
        { nome: 'Pistola', preco: '250 po', dano: '1d10', tipo: 'P', peso: '-', maestria: 'Irritar (Vex)', propriedades: 'Carregamento, Alcance (9/27)' },
    ];

    const renderWeaponTable = () => {
        const tabArmas = document.getElementById('tab-armas');
        if (!tabArmas) return;

        let tableHTML = `
            <div style="padding-bottom: 10px; color: var(--primary-color);">*P=Perfurante, E=Esmagamento, C=Corte.</div>
            <table class="weapon-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Dano</th>
                        <th>Tipo</th>
                        <th>Peso (k)</th>
                        <th>Maestria</th>
                        <th>Propriedades</th>
                    </tr>
                </thead>
                <tbody>
        `;

        weaponData.forEach(weapon => {
            tableHTML += `
                <tr>
                    <td>${weapon.nome}</td>
                    <td class="dano">${weapon.dano}</td>
                    <td>${weapon.tipo}</td>
                    <td>${weapon.peso}</td>
                    <td class="maestria">${weapon.maestria}</td>
                    <td class="propriedades">${weapon.propriedades}</td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;
        tabArmas.innerHTML = tableHTML;
    };

    // ----------------------------------------------------------------------
    // --- LÓGICA DO MAIN BLOCK (Troca de Abas e Adição de Itens) ---
    // ----------------------------------------------------------------------

    const mainButtons = document.querySelectorAll('.main-header-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const addItemBtn = document.getElementById('add-item-btn');

    const switchTab = (targetTabId) => {
        mainButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        const targetButton = document.querySelector(`[data-tab="${targetTabId}"]`);
        const targetContent = document.getElementById(`tab-${targetTabId}`);

        if (targetButton) { targetButton.classList.add('active'); }
        if (targetContent) {
            targetContent.classList.add('active');
            const placeholder = targetContent.querySelector('.placeholder-text');
            if (placeholder && targetContent.children.length > 1) { placeholder.remove(); }
        }
    }

    mainButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    // Define o template de item para cada aba
    const itemTemplates = {
        // Armas (para itens personalizados adicionados)
        armas: (count) => `
            <div class="weapon-entry" data-item-id="custom-weapon-${count}">
                <div class="weapon-details">
                    <input type="text" value="Arma Customizada ${count}" placeholder="Nome da Arma">
                    <input type="text" value="" placeholder="Dano (ex: 1d6)">
                    <input type="text" value="" placeholder="Tipo/Maestria">
                </div>
                <button class="delete-btn" data-delete-id="custom-weapon-${count}">Excluir</button>
            </div>
        `,
        // Outros itens genéricos
        magias: (count) => createGenericEntry('Magia', count),
        tracos: (count) => createGenericEntry('Traço', count, 'textarea'),
        proficiencias: (count) => createGenericEntry('Proficiência', count),
        inventario: (count) => createGenericEntry('Item de Inventário', count),
    };

    function createGenericEntry(type, count, inputType = 'text') {
        const inputElement = inputType === 'textarea' ?
            `<textarea placeholder="Descrição do ${type} ${count}" rows="2"></textarea>` :
            `<input type="text" value="${type} ${count}" placeholder="Nome do ${type}">`;

        return `
            <div class="generic-entry" data-item-id="${type.toLowerCase().replace(/\s/g, '-')}-${count}">
                <div class="generic-details">
                    ${inputElement}
                </div>
                <button class="delete-btn" data-delete-id="${type.toLowerCase().replace(/\s/g, '-')}-${count}">Excluir</button>
            </div>
        `;
    }

    let itemCounter = 0;

    const handleDeleteItem = (e) => {
        const deleteId = e.target.getAttribute('data-delete-id');
        const itemToDelete = document.querySelector(`[data-item-id="${deleteId}"]`);

        if (itemToDelete) {
            const parentTab = itemToDelete.closest('.tab-content');
            itemToDelete.remove();

            if (parentTab && parentTab.children.length === 0) {
                const tabId = parentTab.id.replace('tab-', '');
                let placeholderText = 'Adicione itens aqui.';
                switch(tabId) {
                    case 'armas': renderWeaponTable(); return; // Re-renderiza a tabela fixa de armas
                    case 'magias': placeholderText = 'Adicione suas magias.'; break;
                    case 'tracos': placeholderText = 'Adicione traços de raça ou classe.'; break;
                    case 'proficiencias': placeholderText = 'Adicione proficiências em ferramentas e idiomas.'; break;
                    case 'inventario': placeholderText = 'Adicione itens e moedas.'; break;
                }
                parentTab.innerHTML = `<p class="placeholder-text">${placeholderText}</p>`;
            }
        }
    }

    addItemBtn.addEventListener('click', () => {
        const activeTab = document.querySelector('.tab-content.active');
        if (!activeTab) return;

        const activeTabId = activeTab.id.replace('tab-', '');
        const templateFunction = itemTemplates[activeTabId];

        if (templateFunction) {
            itemCounter++;
            const newEntryHTML = templateFunction(itemCounter);

            // Remove a tabela fixa de armas OU o placeholder
            const placeholder = activeTab.querySelector('.placeholder-text, .weapon-table');
            if (placeholder) { placeholder.remove(); }

            activeTab.insertAdjacentHTML('beforeend', newEntryHTML);

            const newItem = activeTab.lastElementChild;
            const deleteButton = newItem.querySelector('.delete-btn');
            if (deleteButton) { deleteButton.addEventListener('click', handleDeleteItem); }

            activeTab.scrollTop = activeTab.scrollHeight;
        }
    });

    // --- INICIALIZAÇÃO FINAL ---
    renderWeaponTable(); // 1. Renderiza a tabela de armas na aba inicial
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', handleDeleteItem);
    });
    switchTab('armas'); // 2. Garante que a aba de armas esteja visível
});
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
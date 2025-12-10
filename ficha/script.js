// script.js (Código Completo Atualizado com Seleção de Armas e Preenchimento Automático)

document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA DE UTILIDADE DA FICHA ---
    const sheet = document.querySelector('.character-sheet');
    const handle = document.querySelector('.sheet-header');
    const minimizeBtn = document.getElementById('minimize-btn');
    const closeBtn = document.getElementById('close-btn');

    // --- Lógica de Arrastar ---
    let isDragging = false;
    let offsetX, offsetY;
    handle.addEventListener('mousedown', (e) => {
        if (e.target.closest('.controls') || e.target.closest('.custom-select')) return;
        isDragging = true;
        sheet.style.cursor = 'grabbing';
        handle.style.cursor = 'grabbing';
        sheet.style.position = 'absolute';
        sheet.style.transform = 'none';
        offsetX = e.clientX - sheet.offsetLeft;
        offsetY = e.clientY - sheet.offsetTop;
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        sheet.style.left = e.clientX - offsetX + 'px';
        sheet.style.top = e.clientY - offsetY + 'px';
    });
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            sheet.style.cursor = 'grab';
            handle.style.cursor = 'grab';
        }
    });

    // --- Lógica de Minimizar/Fechar ---
    minimizeBtn.addEventListener('click', () => {
        sheet.classList.toggle('minimized');
        minimizeBtn.textContent = sheet.classList.contains('minimized') ? '☐' : '_';
        minimizeBtn.title = sheet.classList.contains('minimized') ? 'Maximizar Ficha' : 'Minimizar Ficha';
    });
    closeBtn.addEventListener('click', () => {
        sheet.style.display = 'none';
    });
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
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
    const hpCurrentInput = document.getElementById('HPCurrentInput');
    const hpMaxHidden = document.getElementById('HPMax');
    const hpMaxDisplay = document.getElementById('HPMaxDisplay');
    const hpTempInput = document.getElementById('HPTemp');
    const incrementBtn = document.getElementById('increment-hp');
    const decrementBtn = document.getElementById('decrement-hp');
    const shortRestBtn = document.getElementById('short-rest-btn');
    const longRestBtn = document.getElementById('long-rest-btn');
    let realCurrentHP = parseInt(hpMaxHidden.value) || 10;

    const updateHPDisplay = () => {
        let max = parseInt(hpMaxHidden.value) || 10;
        let tempHP = parseInt(hpTempInput.value) || 0;
        let displayedCurrentHP = realCurrentHP + tempHP;
        hpMaxDisplay.value = `${displayedCurrentHP}/${max}`;
    };

    const setRealHP = (newHP) => {
        let max = parseInt(hpMaxHidden.value) || 10;
        realCurrentHP = Math.min(Math.max(0, newHP), max);
        updateHPDisplay();
    };

    const healDamage = (amount) => {
        setRealHP(realCurrentHP + amount);
    };

    const takeDamage = (amount) => {
        let tempHP = parseInt(hpTempInput.value) || 0;
        let remainingDamage = amount;
        if (tempHP > 0) {
            if (remainingDamage >= tempHP) {
                remainingDamage -= tempHP;
                hpTempInput.value = 0;
            } else {
                hpTempInput.value = tempHP - remainingDamage;
                remainingDamage = 0;
            }
        }
        if (remainingDamage > 0) {
            setRealHP(realCurrentHP - remainingDamage);
        }
        updateHPDisplay();
    };

    incrementBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const amount = parseInt(hpCurrentInput.value) || 0;
        healDamage(amount);
        hpCurrentInput.value = 0;
    });

    decrementBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const amount = parseInt(hpCurrentInput.value) || 0;
        takeDamage(amount);
        hpCurrentInput.value = 0;
    });

    hpTempInput.addEventListener('change', updateHPDisplay);
    hpMaxHidden.addEventListener('change', (e) => {
        let newMax = parseInt(e.target.value) || 0;
        if (realCurrentHP > newMax) { setRealHP(newMax); }
        updateHPDisplay();
    });

    shortRestBtn.addEventListener('click', () => {
        let max = parseInt(hpMaxHidden.value) || 10;
        setRealHP(Math.min(realCurrentHP + Math.ceil(max * 0.5), max));
        hpTempInput.value = 0;
        updateHPDisplay();
    });

    longRestBtn.addEventListener('click', () => {
        setRealHP(parseInt(hpMaxHidden.value) || 10);
        hpTempInput.value = 0;
        updateHPDisplay();
    });

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
        if (!e.target.closest('.custom-select')) { closeAllSelect({ nextSibling: null }); }
    });

    // ----------------------------------------------------------------------
    // --- LÓGICA DE ATRIBUTOS E MODIFICADORES & PERÍCIAS ---
    // ----------------------------------------------------------------------

    const attributes = [
        { scoreId: 'for-score', modId: 'for-mod' }, { scoreId: 'des-score', modId: 'des-mod' },
        { scoreId: 'con-score', modId: 'con-mod' }, { scoreId: 'int-score', modId: 'int-mod' },
        { scoreId: 'car-score', modId: 'car-mod' }, { scoreId: 'sab-score', modId: 'sab-mod' },
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

    const proficiencyBonusInput = document.getElementById('proficiency-bonus');

    const skillMap = [
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
            case 'full': return 2;
            case 'half': return 1;
            default: return 0;
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
        menu.addEventListener('click', (e) => { e.stopPropagation(); });
    });
    document.addEventListener('click', () => { closeAllProficiencyMenus(null); });
    updateAllSkillModifiers();


    // ----------------------------------------------------------------------
    // --- DADOS DA LISTA DE ARMAS D&D 2024 ---
    // ----------------------------------------------------------------------
    const weaponData = [
        // O valor do 'value' no dropdown será o índice do array, então a ordem é importante
        { nome: 'Adaga', dano: '1d4 P', maestria: 'Incissão (Nick)', propriedades: 'Ágil, Leve, Arremesso (6/18)' },
        { nome: 'Azagaia', dano: '1d6 P', maestria: 'Lentidão (Slow)', propriedades: 'Arremesso (9/36)' },
        { nome: 'Cajado (Bordão)', dano: '1d6 E', maestria: 'Derrubar (Topple)', propriedades: 'Versátil (1d8)' },
        { nome: 'Clava Grande', dano: '1d8 E', maestria: 'Empurrão (Push)', propriedades: 'Duas Mãos' },
        { nome: 'Foice Curta', dano: '1d4 C', maestria: 'Incissão (Nick)', propriedades: 'Leve' },
        { nome: 'Lança', dano: '1d6 P', maestria: 'Esgotar (Sap)', propriedades: 'Versátil (1d8), Arremesso (6/18)' },
        { nome: 'Maça', dano: '1d6 E', maestria: 'Esgotar (Sap)', propriedades: '-' },
        { nome: 'Machadinha', dano: '1d6 C', maestria: 'Irritar (Vex)', propriedades: 'Leve, Arremesso (6/18)' },
        { nome: 'Martelo Leve', dano: '1d4 E', maestria: 'Incissão (Nick)', propriedades: 'Leve, Arremesso (6/18)' },
        { nome: 'Porrete', dano: '1d4 E', maestria: 'Lentidão (Slow)', propriedades: 'Leve' },
        { nome: 'Arco Curto', dano: '1d6 P', maestria: 'Irritar (Vex)', propriedades: 'Munição, Duas Mãos, Alcance (24/96)' },
        { nome: 'Besta Leve', dano: '1d8 P', maestria: 'Lentidão (Slow)', propriedades: 'Munição, Recarga, Duas Mãos, Alcance (24/96)' },
        { nome: 'Dardo', dano: '1d4 P', maestria: 'Irritar (Vex)', propriedades: 'Ágil (Finesse), Arremesso (6/18)' },
        { nome: 'Funda', dano: '1d4 E', maestria: 'Lentidão (Slow)', propriedades: 'Munição, Alcance (9/36)' },
        { nome: 'Alabarda', dano: '1d10 C', maestria: 'Trespassar (Cleave)', propriedades: 'Pesada, Alcance (Reach), Duas Mãos' },
        { nome: 'Chicote', dano: '1d4 C', maestria: 'Lentidão (Slow)', propriedades: 'Ágil (Finesse), Alcance (Reach)' },
        { nome: 'Cimitarra', dano: '1d6 C', maestria: 'Incissão (Nick)', propriedades: 'Ágil (Finesse), Leve' },
        { nome: 'Espada Curta', dano: '1d6 P', maestria: 'Irritar (Vex)', propriedades: 'Ágil (Finesse), Leve' },
        { nome: 'Espada Duas Mãos (Montante)', dano: '2d6 C', maestria: 'Trespassar (Cleave)', propriedades: 'Pesada, Duas Mãos' },
        { nome: 'Espada Longa', dano: '1d8 C', maestria: 'Esgotar (Sap)', propriedades: 'Versátil (1d10)' },
        { nome: 'Florete', dano: '1d8 P', maestria: 'Irritar (Vex)', propriedades: 'Ágil (Finesse)' },
        { nome: 'Glaive', dano: '1d10 C', maestria: 'Relance (Graze)', propriedades: 'Pesada, Alcance (Reach), Duas Mãos' },
        { nome: 'Lança de Montaria', dano: '1d12 P', maestria: 'Derrubar (Topple)', propriedades: 'Alcance (Reach), Duas Mãos (exceto se montado)' },
        { nome: 'Maça Estrela', dano: '1d8 P', maestria: 'Esgotar (Sap)', propriedades: '-' },
        { nome: 'Machado de Batalha', dano: '1d8 C', maestria: 'Derrubar (Topple)', propriedades: 'Versátil (1d10)' },
        { nome: 'Machado Grande', dano: '1d12 C', maestria: 'Trespassar (Cleave)', propriedades: 'Pesada, Duas Mãos' },
        { nome: 'Mangual', dano: '1d8 E', maestria: 'Esgotar (Sap)', propriedades: '-' },
        { nome: 'Marreta (Malho)', dano: '2d6 E', maestria: 'Derrubar (Topple)', propriedades: 'Pesada, Duas Mãos' },
        { nome: 'Martelo de Guerra', dano: '1d8 E', maestria: 'Empurrão (Push)', propriedades: 'Versátil (1d10)' },
        { nome: 'Picareta de Guerra', dano: '1d8 P', maestria: 'Esgotar (Sap)', propriedades: '-' },
        { nome: 'Pique', dano: '1d10 P', maestria: 'Empurrão (Push)', propriedades: 'Pesada, Alcance (Reach), Duas Mãos' },
        { nome: 'Tridente', dano: '1d6 P', maestria: 'Derrubar (Topple)', propriedades: 'Arremesso (6/18), Versátil (1d8)' },
        { nome: 'Arco Longo', dano: '1d8 P', maestria: 'Irritar (Vex)', propriedades: 'Munição, Pesada, Duas Mãos, Alcance (45/180)' },
        { nome: 'Besta de Mão', dano: '1d6 P', maestria: 'Irritar (Vex)', propriedades: 'Munição, Leve, Recarga, Alcance (9/36)' },
        { nome: 'Besta Pesada', dano: '1d10 P', maestria: 'Lentidão (Slow)', propriedades: 'Munição, Pesada, Recarga, Duas Mãos, Alcance (30/120)' },
        { nome: 'Rede', dano: '--', maestria: 'Derrubar (Topple)', propriedades: 'Arremesso (1,5/4,5), Especial' },
        { nome: 'Zarabatana', dano: '1 P', maestria: 'Lentidão (Slow)', propriedades: 'Munição, Recarga, Alcance (7,5/30)' },
        { nome: 'Mosquete', dano: '1d12 P', maestria: 'Lentidão (Slow)', propriedades: 'Carregamento, Duas Mãos, Alcance (12/36)' },
        { nome: 'Pistola', dano: '1d10 P', maestria: 'Irritar (Vex)', propriedades: 'Carregamento, Alcance (9/27)' },
    ];
    
    // Função para criar o HTML do dropdown de armas
    const createWeaponSelect = () => {
        let options = '<option value="">--- Escolher Arma ---</option>';
        weaponData.forEach((weapon, index) => {
            // O valor da option é o índice do array, que usaremos para buscar os dados
            options += `<option value="${index}">${weapon.nome}</option>`;
        });
        return `<select name="weapon-name">${options}</select>`;
    };
    
    // Função que preenche os campos com os dados da arma selecionada
    const handleWeaponSelection = (event) => {
        const select = event.target;
        const entryContainer = select.closest('.weapon-entry');
        // O valor é o índice da arma no array weaponData
        const weaponIndex = parseInt(select.value);

        const inputDano = entryContainer.querySelector('input[name="weapon-dano"]');
        const inputProps = entryContainer.querySelector('input[name="weapon-props"]');
        
        // Se algo foi selecionado (não é o placeholder)
        if (!isNaN(weaponIndex) && weaponIndex >= 0 && weaponIndex < weaponData.length) {
            const weapon = weaponData[weaponIndex];
            const propsText = `${weapon.maestria} / ${weapon.propriedades}`;
            
            inputDano.value = weapon.dano;
            inputProps.value = propsText;
        } else {
            // Se o usuário voltar para o placeholder ou selecionar 'Escolher Arma'
            inputDano.value = '';
            inputProps.value = '';
        }
    };


    // Função que cria a linha de entrada de arma vazia (com o seletor)
    const createWeaponEntry = (count) => {
        const deleteId = `weapon-${count}`;
        
        // Os inputs de Dano e Propriedades agora são `readonly`
        return `
            <div class="weapon-entry" data-item-id="${deleteId}">
                <div class="weapon-details">
                    ${createWeaponSelect()}
                    <input type="text" name="weapon-dano" value="" placeholder="Dano (Tipo)" readonly title="Preenchido automaticamente ao selecionar a arma.">
                    <input type="text" name="weapon-props" value="" placeholder="Maestria / Propriedades" readonly title="Preenchido automaticamente ao selecionar a arma.">
                </div>
                <button class="delete-btn" data-delete-id="${deleteId}">Excluir</button>
            </div>
        `;
    };

    // Função para renderizar a mensagem padrão (Placeholder) na aba de armas
    const renderWeaponPlaceholder = () => {
        const tabArmas = document.getElementById('tab-armas');
        const listContainer = tabArmas.querySelector('#weapon-list-container');
        
        // Garante que o placeholder esteja visível e o cabeçalho invisível se a lista estiver vazia
        if (listContainer && listContainer.children.length === 0) {
            tabArmas.querySelector('.placeholder-text').style.display = 'block';
            tabArmas.querySelector('.weapon-header-row').style.display = 'none';
        }
    }

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
            
            // Lógica específica para a aba de armas
            if (targetTabId === 'armas') {
                const listContainer = targetContent.querySelector('#weapon-list-container');
                if (listContainer.children.length === 0) {
                    renderWeaponPlaceholder();
                } else {
                    targetContent.querySelector('.placeholder-text').style.display = 'none';
                    targetContent.querySelector('.weapon-header-row').style.display = 'flex';
                }
            } else {
                 // Lógica para placeholders genéricos
                 const placeholder = targetContent.querySelector('.placeholder-text');
                 if (placeholder) placeholder.style.display = (targetContent.children.length === 1) ? 'block' : 'none';
            }
        }
    }

    mainButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    const itemTemplates = {
        armas: (count) => createWeaponEntry(count), 
        magias: (count) => createGenericEntry('Magia', count),
        tracos: (count) => createGenericEntry('Traço', count, 'textarea'),
        proficiencias: (count) => createGenericEntry('Proficiência', count),
        inventario: (count) => createGenericEntry('Item de Inventário', count),
    };

    function createGenericEntry(type, count, inputType = 'text') {
        const inputElement = inputType === 'textarea' ?
            `<textarea placeholder="Descrição do ${type}..." rows="2"></textarea>` :
            `<input type="text" value="" placeholder="Nome do ${type}">`;

        const deleteId = `${type.toLowerCase().replace(/\s/g, '-')}-${count}`;
        
        return `
            <div class="generic-entry" data-item-id="${deleteId}">
                <div class="generic-details">
                    ${inputElement}
                </div>
                <button class="delete-btn" data-delete-id="${deleteId}">Excluir</button>
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

            if (parentTab.id === 'tab-armas') {
                const listContainer = parentTab.querySelector('#weapon-list-container');
                if (listContainer.children.length === 0) {
                    renderWeaponPlaceholder();
                }
            } else { 
                const placeholder = parentTab.querySelector('.placeholder-text');
                if (!placeholder && parentTab.children.length === 0) {
                    // Se for um item genérico e a aba ficou vazia, re-insere o placeholder
                    const tabId = parentTab.id.replace('tab-', '');
                    let placeholderText;
                    switch(tabId) {
                        case 'magias': placeholderText = 'Adicione suas magias.'; break;
                        case 'tracos': placeholderText = 'Adicione traços de raça ou classe.'; break;
                        case 'proficiencias': placeholderText = 'Adicione proficiências em ferramentas e idiomas.'; break;
                        case 'inventario': placeholderText = 'Adicione itens e moedas.'; break;
                        default: placeholderText = 'Adicione itens aqui.';
                    }
                    parentTab.insertAdjacentHTML('afterbegin', `<p class="placeholder-text">${placeholderText}</p>`);
                }
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
            
            const listContainer = activeTab.querySelector('#weapon-list-container') || activeTab;

            // Remove/esconde o placeholder antes de adicionar o item
            const placeholder = activeTab.querySelector('.placeholder-text');
            if (placeholder) { placeholder.style.display = 'none'; }
            
            // Adiciona o cabeçalho fixo na aba armas e garante que o contêiner de itens receba o HTML
            if (activeTabId === 'armas') {
                activeTab.querySelector('.weapon-header-row').style.display = 'flex';
            }

            listContainer.insertAdjacentHTML('beforeend', newEntryHTML);

            const newItem = listContainer.lastElementChild;
            const deleteButton = newItem.querySelector('.delete-btn');
            
            if (deleteButton) { deleteButton.addEventListener('click', handleDeleteItem); }
            
            // ADICIONA O LISTENER DE MUDANÇA (SELECT) APENAS SE FOR UMA NOVA ENTRADA DE ARMA
            if (activeTabId === 'armas') {
                const weaponSelect = newItem.querySelector('select[name="weapon-name"]');
                if (weaponSelect) {
                    weaponSelect.addEventListener('change', handleWeaponSelection);
                }
            }

            listContainer.scrollTop = listContainer.scrollHeight;
        }
    });

    // --- INICIALIZAÇÃO FINAL ---
    renderWeaponPlaceholder(); 
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', handleDeleteItem);
    });
    // Adiciona listener de mudança para selects de armas se eles forem criados no HTML
    document.querySelectorAll('select[name="weapon-name"]').forEach(select => {
        select.addEventListener('change', handleWeaponSelection);
    });
    
    switchTab('armas');
});
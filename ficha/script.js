// script.js (Código Completo Atualizado com Lógica de Atributos, Perícias e Abas)

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
        if (sheet.classList.contains('minimized')) {
            minimizeBtn.textContent = '☐'; // Ícone de maximizar
            minimizeBtn.title = 'Maximizar Ficha';
        } else {
            minimizeBtn.textContent = '_'; // Ícone de minimizar
            minimizeBtn.title = 'Minimizar Ficha';
        }
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
            if (sheet.style.display === 'none') {
                sheet.style.display = 'block'; // Ou 'flex', se o seu layout exigir
                // Se a ficha estava minimizada ao fechar, ela abre normal
                sheet.classList.remove('minimized'); 
                minimizeBtn.textContent = '_'; 
                minimizeBtn.title = 'Minimizar Ficha';
            } else {
                sheet.style.display = 'none';
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
        
        let displayedMaxHP = max; 
        
        // HP Atual exibido é o Real + o Temporário
        let displayedCurrentHP = realCurrentHP + tempHP;

        hpMaxDisplay.value = `${displayedCurrentHP}/${displayedMaxHP}`;
    };

    // Define o valor do HP real e atualiza a exibição
    const setRealHP = (newHP) => {
        let max = parseInt(hpMaxHidden.value) || 10;
        
        if (newHP < 0) {
            newHP = 0;
        } else if (newHP > max) {
            newHP = max;
        }
        
        realCurrentHP = newHP;
        updateHPDisplay();
    };

    // Funções para manipular a saúde do personagem
    const healDamage = (amount) => {
        let max = parseInt(hpMaxHidden.value) || 10;
        let newHP = realCurrentHP + amount;

        // Cura não deve exceder o HP Máximo Real
        if (newHP > max) {
            newHP = max;
        }

        setRealHP(newHP);
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
            let newRealHP = realCurrentHP - remainingDamage;
            if (newRealHP < 0) {
                newRealHP = 0;
            }
            setRealHP(newRealHP);
        }

        updateHPDisplay();
    };

    // --- Funções de Eventos ---

    // Botão de Cura (Adiciona o valor do input HPCurrentInput ao HP Real)
    incrementBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const amount = parseInt(hpCurrentInput.value) || 0;
        healDamage(amount);
        hpCurrentInput.value = 0; // Zera após a aplicação
    });

    // Botão de Dano (Aplica o valor do input HPCurrentInput)
    decrementBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const amount = parseInt(hpCurrentInput.value) || 0;
        takeDamage(amount);
        hpCurrentInput.value = 0; // Zera após a aplicação
    });

    // Tratamento manual do HP Temporário (Apenas atualiza o display)
    hpTempInput.addEventListener('change', updateHPDisplay);
    
    // Tratamento manual do HP Máximo Real (Atualiza o display e checa o valor real)
    hpMaxHidden.addEventListener('change', (e) => {
        let newMax = parseInt(e.target.value) || 0;
        if (realCurrentHP > newMax) {
            setRealHP(newMax); // Se o atual for maior que o novo max, reduz o atual
        }
        updateHPDisplay();
    });

    // Lógica para Descanso Curto (Cura 50% do HP Máximo Real e zera o HP Temp)
    shortRestBtn.addEventListener('click', () => {
        let max = parseInt(hpMaxHidden.value) || 10;
        
        setRealHP(Math.min(realCurrentHP + Math.ceil(max * 0.5), max)); // Cura 50% do max
        
        // Zera o HP Temporário após descanso (regra comum)
        hpTempInput.value = 0;
        updateHPDisplay();
    });

    // Lógica para Descanso Longo (Recupera o HP para o Máximo Real e zera o HP Temp)
    longRestBtn.addEventListener('click', () => {
        let max = parseInt(hpMaxHidden.value) || 10;
        
        setRealHP(max);             // HP real volta ao máximo
        hpTempInput.value = 0;      // HP Temporário zera
        updateHPDisplay();
    });

    // Chamada inicial para garantir que o display esteja correto ao carregar
    updateHPDisplay();


    // ----------------------------------------------------------------------
    // --- LÓGICA DO DROPDOWN CUSTOMIZADO (DadoHP) ---
    // ----------------------------------------------------------------------

    const customSelect = document.getElementById('DadoHPSelect');
    const selectedDiv = document.getElementById('DadoHPSelected');
    const itemsContainer = customSelect.querySelector('.select-items');
    const allItems = itemsContainer.querySelectorAll('div');

    selectedDiv.addEventListener('click', function(e) {
        e.stopPropagation(); // Previne que o clique feche o menu imediatamente
        
        // Fecha todos os outros dropdowns abertos
        closeAllSelect(this);
        
        // Alterna a visibilidade dos itens e a seta
        itemsContainer.classList.toggle('select-hide');
        this.classList.toggle('select-arrow-active');
    });

    allItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Pega o valor e texto do item clicado
            const value = this.getAttribute('data-value');
            const text = this.textContent;

            // Atualiza o valor exibido
            selectedDiv.textContent = text;
            selectedDiv.setAttribute('data-value', value);
            
            // Fecha o dropdown
            itemsContainer.classList.add('select-hide');
            selectedDiv.classList.remove('select-arrow-active');
        });
    });

    // Função para fechar todos os dropdowns abertos
    function closeAllSelect(elmnt) {
        const arrNo = [];
        const x = document.getElementsByClassName('select-items');
        const y = document.getElementsByClassName('select-selected');
        
        for (let i = 0; i < y.length; i++) {
            if (elmnt == y[i]) {
                arrNo.push(i);
            } else {
                y[i].classList.remove('select-arrow-active');
            }
        }
        
        for (let i = 0; i < x.length; i++) {
            if (arrNo.indexOf(i)) {
                x[i].classList.add('select-hide');
            }
        }
    }

    // Fecha o dropdown se o usuário clicar fora dele
    document.addEventListener('click', closeAllSelect);

    // ----------------------------------------------------------------------
    // --- LÓGICA DE ATRIBUTOS E MODIFICADORES (DnD 5e 2024) ---
    // ----------------------------------------------------------------------

    // Mapeamento de atributos (compartilhado com a lógica de perícia)
    const attributes = [
        { scoreId: 'for-score', modId: 'for-mod' },
        { scoreId: 'des-score', modId: 'des-mod' },
        { scoreId: 'con-score', modId: 'con-mod' },
        { scoreId: 'int-score', modId: 'int-mod' },
        { scoreId: 'car-score', modId: 'car-mod' },
        { scoreId: 'sab-score', modId: 'sab-mod' },
    ];

    // Função de Cálculo do Modificador (Math.floor((score - 10) / 2))
    const calculateModifier = (score) => {
        const value = parseInt(score) || 10; 
        const modifier = Math.floor((value - 10) / 2);
        return modifier >= 0 ? `+${modifier}` : `${modifier}`;
    };

    // Função para atualizar um modificador de atributo
    const updateAttributeModifier = (scoreInput, modInput) => {
        const score = scoreInput.value;
        modInput.value = calculateModifier(score);
    };

    // ----------------------------------------------------------------------
    // --- LÓGICA DE PERÍCIAS (SKILL MODIFIERS) ---
    // ----------------------------------------------------------------------

    const proficiencyBonusInput = document.getElementById('proficiency-bonus');

    // Mapeamento das 18 perícias para seus atributos
    const skillMap = [
        // DES
        { skillId: 'acrobacia', attrModId: 'des-mod', attribute: 'DES' },
        { skillId: 'prestidigitacao', attrModId: 'des-mod', attribute: 'DES' },
        { skillId: 'furtividade', attrModId: 'des-mod', attribute: 'DES' },
        // FOR
        { skillId: 'atletismo', attrModId: 'for-mod', attribute: 'FOR' },
        // INT
        { skillId: 'arcano', attrModId: 'int-mod', attribute: 'INT' },
        { skillId: 'historia', attrModId: 'int-mod', attribute: 'INT' },
        { skillId: 'investigacao', attrModId: 'int-mod', attribute: 'INT' },
        { skillId: 'natureza', attrModId: 'int-mod', attribute: 'INT' },
        { skillId: 'religiao', attrModId: 'int-mod', attribute: 'INT' },
        // SAB
        { skillId: 'adestrar', attrModId: 'sab-mod', attribute: 'SAB' },
        { skillId: 'intuicao', attrModId: 'sab-mod', attribute: 'SAB' },
        { skillId: 'medicina', attrModId: 'sab-mod', attribute: 'SAB' },
        { skillId: 'percepcao', attrModId: 'sab-mod', attribute: 'SAB' },
        { skillId: 'sobrevivencia', attrModId: 'sab-mod', attribute: 'SAB' },
        // CAR
        { skillId: 'enganacao', attrModId: 'car-mod', attribute: 'CAR' },
        { skillId: 'intimidacao', attrModId: 'car-mod', attribute: 'CAR' },
        { skillId: 'atuacao', attrModId: 'car-mod', attribute: 'CAR' },
        { skillId: 'persuasao', attrModId: 'car-mod', attribute: 'CAR' },
    ];

    // Função de utilidade para obter o multiplicador de proficiência
    const getProficiencyMultiplier = (proficiencyLevel) => {
        switch (proficiencyLevel) {
            case 'full': return 2; // Expertise
            case 'half': return 1; // Proficiente
            case 'none':
            default: return 0; // Sem Treino
        }
    }

    // Função principal para calcular e atualizar uma perícia específica
    const updateSkillModifier = (skillItem) => {
        const skillId = skillItem.getAttribute('data-skill-id');
        const skillData = skillMap.find(s => s.skillId === skillId);
        
        if (!skillData) return;

        const attributeModInput = document.getElementById(skillData.attrModId);
        const skillModInput = skillItem.querySelector('.modifier input');
        const proficiencyCircle = skillItem.querySelector('.proficiency-circle');
        
        // 1. Obter valores
        // attrMod vem como string ("+N" ou "-N")
        const attrMod = parseInt(attributeModInput.value) || 0; 
        const pb = parseInt(proficiencyBonusInput.value) || 0;
        const proficiencyLevel = proficiencyCircle.getAttribute('data-proficiency');
        const multiplier = getProficiencyMultiplier(proficiencyLevel);

        // 2. Calcular o Modificador Final: Attr Mod + (PB * Multiplier)
        const skillModValue = attrMod + (pb * multiplier);
        
        // 3. Formatar e Atualizar o Input
        const formattedSkillMod = skillModValue >= 0 ? `+${skillModValue}` : `${skillModValue}`;
        skillModInput.value = formattedSkillMod;
    };

    // Função para atualizar TODAS as perícias
    const updateAllSkillModifiers = () => {
        document.querySelectorAll('.skill-item').forEach(updateSkillModifier);
    }
    
    // ----------------------------------------------------------------------
    // --- CONFIGURAÇÃO DOS LISTENERS DE EVENTOS ---
    // ----------------------------------------------------------------------

    // 1. Ouvir mudanças nos ATRIBUTOS
    attributes.forEach(attr => {
        const scoreInput = document.getElementById(attr.scoreId);
        const modInput = document.getElementById(attr.modId);

        if (scoreInput && modInput) {
            // Inicializa o modificador ao carregar
            updateAttributeModifier(scoreInput, modInput);

            // Listener para recalcular o modificador de atributo e TODAS as perícias
            scoreInput.addEventListener('input', () => {
                updateAttributeModifier(scoreInput, modInput);
                updateAllSkillModifiers(); 
            });
        }
    });

    // 2. Ouvir mudanças no BÔNUS DE PROFICIÊNCIA (PB)
    if (proficiencyBonusInput) {
        proficiencyBonusInput.addEventListener('input', updateAllSkillModifiers);
    }

    // 3. Ouvir mudanças no CÍRCULO DE PROFICIÊNCIA das perícias (Half, Full, None)
    document.querySelectorAll('.proficiency-menu div').forEach(option => {
        option.addEventListener('click', (e) => {
            const newProficiency = e.target.getAttribute('data-value');
            const skillItem = e.target.closest('.skill-block').querySelector('.skill-item');
            const circleContainer = skillItem.querySelector('.proficiency-circle');
            
            // 1. Atualiza o atributo de dado do círculo
            circleContainer.setAttribute('data-proficiency', newProficiency);
            
            // 2. Fecha o menu
            e.target.closest('.proficiency-menu').classList.add('select-hide');

            // 3. Recalcula apenas a perícia modificada
            updateSkillModifier(skillItem); 
        });
    });

    // Atualiza todas as perícias na carga inicial (após a inicialização dos atributos)
    updateAllSkillModifiers();
    
    // --- CONTINUAÇÃO DA LÓGICA ORIGINAL DE PROFICIÊNCIA DE PERÍCIAS ---
    // (A lógica de abertura/fechamento do menu de proficiência)

    const proficiencyMenus = document.querySelectorAll('.proficiency-menu');

    // Função para fechar todos os menus de proficiência abertos
    const closeAllProficiencyMenus = (exceptMenu) => {
        proficiencyMenus.forEach(menu => {
            if (menu !== exceptMenu) {
                menu.classList.add('select-hide');
            }
        });
    }

    document.querySelectorAll('.skill-item').forEach(item => {
        const proficiencyBtn = item.querySelector('.proficiency-btn');
        const menu = item.closest('.skill-block').querySelector('.proficiency-menu'); 

        // Lógica para abrir/fechar o menu ao clicar no botão/círculo
        proficiencyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllProficiencyMenus(menu);
            menu.classList.toggle('select-hide');
        });
        
        // Impede que o clique no menu feche-o (pelo handler de 'document')
        menu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    // Fecha o menu de proficiência se o usuário clicar em qualquer outro lugar
    document.addEventListener('click', () => {
        closeAllProficiencyMenus(null);
    });

    // ----------------------------------------------------------------------
    // --- LÓGICA DO MAIN BLOCK (Troca de Abas e Adição de Itens) ---
    // ----------------------------------------------------------------------

    const mainButtons = document.querySelectorAll('.main-header-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const addItemBtn = document.getElementById('add-item-btn');
    const mainContentArea = document.querySelector('.main-content-area');

    // --- 1. Lógica de Troca de Abas ---

    const switchTab = (targetTabId) => {
        // 1. Desativar todos os botões e conteúdos
        mainButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // 2. Ativar o botão e o conteúdo alvo
        const targetButton = document.querySelector(`[data-tab="${targetTabId}"]`);
        const targetContent = document.getElementById(`tab-${targetTabId}`);
        
        if (targetButton) {
            targetButton.classList.add('active');
        }
        if (targetContent) {
            targetContent.classList.add('active');
            // Remove placeholder se houver itens
            const placeholder = targetContent.querySelector('.placeholder-text');
            if (placeholder && targetContent.children.length > 1) {
                 placeholder.remove();
            }
        }
    }

    // Configurar Listeners para os botões de cabeçalho
    mainButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });


    // --- 2. Lógica de Adição de Itens Dinâmicos ---

    // Define o template de item para cada aba
    const itemTemplates = {
        // Exemplo: Armas
        armas: (count) => `
            <div class="weapon-entry" data-item-id="weapon-${count}">
                <div class="weapon-details">
                    <input type="text" value="Arma ${count}" placeholder="Nome da Arma">
                    <input type="text" value="" placeholder="Dano (ex: 1d6)">
                    <input type="text" value="" placeholder="Tipo">
                </div>
                <button class="delete-btn" data-delete-id="weapon-${count}">Excluir</button>
            </div>
        `,
        // Outros itens genéricos
        magias: (count) => createGenericEntry('Magia', count),
        tracos: (count) => createGenericEntry('Traço', count, 'textarea'),
        proficiencias: (count) => createGenericEntry('Proficiência', count),
        inventario: (count) => createGenericEntry('Item de Inventário', count),
    };

    // Função auxiliar para criar templates de itens simples/genéricos
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

    // Contador global para dar IDs únicos aos itens
    let itemCounter = 0; 

    addItemBtn.addEventListener('click', () => {
        const activeTab = document.querySelector('.tab-content.active');
        
        if (!activeTab) return; 

        const activeTabId = activeTab.id.replace('tab-', '');
        const templateFunction = itemTemplates[activeTabId];

        if (templateFunction) {
            itemCounter++;
            
            // 1. Cria o novo elemento HTML
            const newEntryHTML = templateFunction(itemCounter);
            
            // 2. Remove o placeholder se existir
            const placeholder = activeTab.querySelector('.placeholder-text');
            if (placeholder) {
                placeholder.remove();
            }

            // 3. Adiciona ao DOM
            activeTab.insertAdjacentHTML('beforeend', newEntryHTML);

            // 4. Configura o listener para o novo botão Excluir
            const newItem = activeTab.lastElementChild;
            const deleteButton = newItem.querySelector('.delete-btn');
            if (deleteButton) {
                deleteButton.addEventListener('click', handleDeleteItem);
            }
            
            // 5. Rola para o final
            activeTab.scrollTop = activeTab.scrollHeight;

        } else {
            console.warn(`Template não encontrado para a aba: ${activeTabId}`);
        }
    });


    // --- 3. Lógica de Exclusão de Itens ---

    const handleDeleteItem = (e) => {
        const deleteId = e.target.getAttribute('data-delete-id');
        const itemToDelete = document.querySelector(`[data-item-id="${deleteId}"]`);
        
        if (itemToDelete) {
            const parentTab = itemToDelete.closest('.tab-content');
            itemToDelete.remove();
            
            // Se a aba ficar vazia, adiciona o placeholder de volta
            if (parentTab && parentTab.children.length === 0) {
                const tabId = parentTab.id.replace('tab-', '');
                
                // Mapeamento para texto do placeholder
                let placeholderText;
                switch(tabId) {
                    case 'armas': placeholderText = 'Adicione suas armas ou ataques.'; break;
                    case 'magias': placeholderText = 'Adicione suas magias.'; break;
                    case 'tracos': placeholderText = 'Adicione traços de raça ou classe.'; break;
                    case 'proficiencias': placeholderText = 'Adicione proficiências em ferramentas e idiomas.'; break;
                    case 'inventario': placeholderText = 'Adicione itens e moedas.'; break;
                    default: placeholderText = 'Adicione itens aqui.';
                }

                parentTab.innerHTML = `<p class="placeholder-text">${placeholderText}</p>`;
            }
        }
    }

    // Adiciona listener de exclusão a itens existentes na carga inicial (não é necessário pois não há itens fixos)
    /*
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', handleDeleteItem);
    });
    */


    // 4. Inicializa o estado (garante que a aba 'Armas' esteja ativa no carregamento)
    // Usamos um DOMContentLoaded listener no topo, então faremos a chamada aqui
    switchTab('armas');

});
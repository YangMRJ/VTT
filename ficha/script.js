// script.js (Código Completo Atualizado)

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
        let healAmount = Math.ceil(max * 0.5); // Cura 50% do max
        
        healDamage(healAmount);
        
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

});
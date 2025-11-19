# 📜 Documentação Técnica: VTT RPG

Este projeto é um *Virtual Tabletop (VTT)* básico e funcional, construído com tecnologias web puras (HTML, CSS e JavaScript).

## ⚙️ Funcionalidades Principais

* **Login Personalizado:** Permite escolher nome, cor e emoji de token.
* **Acesso de Mestre:** O código `9678` garante acesso como Mestre ("Mestre") e seleciona o emoji de coroa (`👑`).
* **Grid e Navegação:** O canvas implementa Pan e Zoom (`offsetX`, `offsetY`, `scale`) para navegação no mapa.
* **Tokens:** Renderiza os tokens dos jogadores com cor, emoji e nome.
* **Bandeja de Dados:** Suporta a seleção de múltiplos dados (d4 a d100) e modificadores, com rolagem e resultado enviado para o Chat.
* **UI Arrastável:** A Ficha de Personagem (`#characterSheet`) é uma janela flutuante que pode ser arrastada e minimizada.
* **Barra de Ferramentas:** Inclui ferramentas como Mover (`V`), Régua (`R`), e ferramentas exclusivas do Mestre como Parede (`P`) e Inimigos (`I`).

## 📁 Estrutura de Arquivos

| Arquivo | Descrição |
| :--- | :--- |
| `index.html` | Define a estrutura da interface, incluindo as telas de login e jogo, e todos os componentes flutuantes (Chat, Ficha, Bandeja). |
| `styles.css` | Define o tema escuro, layout, e o comportamento visual, como a retração da Lista de Jogadores e o submenu da Régua. |
| `script.js` | Contém toda a lógica de inicialização, interação do usuário, renderização do canvas, rolagem de dados e atalhos de teclado. |

## 🕹️ Atalhos de Teclado (Implementados em `script.js`)

Os atalhos funcionam na `gameScreen` e permitem acesso rápido a ferramentas e janelas de interface.

| Ação | Tecla |
| :--- | :--- |
| **Mover** (Ferramenta) | `V` |
| **Régua** (Ferramenta) | `R` |
| **Parede** (Mestre) | `P` |
| **Inimigos** (Mestre) | `I` |
| **Chat** (Alternar/Abrir/Fechar) | `Ctrl + C` |
| **Ficha de Personagem** (Alternar/Abrir/Fechar) | `Ctrl + F` |
| **Bandeja de Dados** (Alternar/Abrir/Fechar) | `Ctrl + D` |

## 📝 Detalhes da Implementação

### 1. Canvas e Tokens

* **Pan:** Gerenciado por `onCanvasMouseDown` e `onCanvasMouseMove`, que ajustam `offsetX` e `offsetY` quando a ferramenta `move` está ativa.
* **Zoom:** A função `onCanvasWheel` ajusta a variável `scale` (limitada entre 0.5 e 3) e recalcula os offsets para manter o zoom centrado no ponteiro do mouse.
* **Desenho:** `drawGrid()` e `drawTokens()` são chamadas dentro de `resizeCanvas()` e nas interações de pan/zoom, garantindo a atualização visual.

### 2. Bandeja de Dados

* **Seleção:** Um clique normal em `.dice-btn` incrementa a contagem do dado em `selectedDice`, enquanto o clique com o botão direito decrementa.
* **Rolagem:** `rollDice()` calcula os resultados de cada dado no objeto `selectedDice`, adiciona o `modifier-input` e exibe o resultado formatado no chat antes de resetar a seleção.

### 3. Arrastar Elementos

* A função `makeMovable(element, handle)` é usada para tornar a Ficha de Personagem arrastável, utilizando o cabeçalho (`.sheet-header`) como *handle*.
* A posição da Ficha (`characterSheetPosition.x`, `characterSheetPosition.y`) é salva no `dragEnd`.

# 🔮 Planos Futuros e Próximos Passos (TODOs)

Com base nos comentários `// TODO:` presentes no código `script.js`, os planos futuros do projeto se concentram em transformá-lo em um VTT multiplayer interativo, adicionando lógica de movimentação no mapa e gerenciamento de dados de forma dinâmica.

## 1. Movimentação e Pathfinding de Token

O objetivo é implementar a lógica de movimentação inteligente dos tokens no mapa, permitindo aos jogadores usar o sistema de 'point and click'.

* **Conversão de Coordenadas:** Converter as coordenadas do mouse (e.g., `e.clientX`, `e.clientY`) para coordenadas do grid.
* **Algoritmo de Pathfinding:** Implementar um algoritmo como o **A\*** (A-star) para encontrar o caminho mais curto entre a posição atual do token e a posição clicada.
* **Movimentação:** Mover o token do jogador atual para a posição clicada, seguindo o caminho calculado.
* **Verificação de Colisão:** Integrar a lógica para verificar se o caminho calculado colide com obstáculos de mapa, como paredes.

## 2. Sincronização e Multiplayer

O VTT atualmente funciona apenas localmente. O próximo passo é torná-lo utilizável para múltiplos jogadores.

* **Chat Multiplayer:** Enviar mensagens do chat para outros jogadores, o que exige a implementação de uma solução de comunicação em tempo real, como **WebSockets**.
* **Sincronização da Lista de Jogadores:** Sincronizar o estado da lista de jogadores com um servidor para que todos os participantes vejam quem está conectado.
* **Sincronização de Tokens:** Garantir que as posições e o estado dos tokens de todos os jogadores sejam atualizados em tempo real para todos os clientes.

## 3. Gerenciamento de Dados e Ferramentas

Adicionar a funcionalidade completa de gerenciamento de conteúdo nas interfaces de usuário.

* **Ficha de Personagem Dinâmica:** Implementar funcionalidades para adicionar e editar itens, armas, magias e equipamentos na Ficha de Personagem.
* **Implementação de Ferramentas:** Adicionar a lógica de desenho e interação para outras ferramentas da barra, como a Régua (em suas variações: linha, círculo, quadrado, cone) e a ferramenta Parede, que o Mestre utiliza para definir obstáculos no mapa.

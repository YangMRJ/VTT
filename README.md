## 📜 Documentação Técnica: VTT RPG (Atualizada)

Este projeto é um *Virtual Tabletop (VTT)* básico e funcional, construído com tecnologias web puras (HTML, CSS e JavaScript), com foco inicial na interface e funcionalidades locais.

---

## ⚙️ Funcionalidades Principais

| Categoria | Funcionalidade | Implementação (Sim/Não) |
| :--- | :--- | :--- |
| **Acesso** | Login Personalizado (Nome, Cor, Emoji) | Sim |
| **Acesso** | Acesso de Mestre (Código `9678` com emoji `👑`) | Sim |
| **Mapa** | Grid, Pan (Mover) e Zoom | Sim |
| **Mapa** | Tokens de Jogadores (Renderização) | Sim |
| **UI** | Ficha de Personagem Arrastável (`#characterSheet`) | Sim |
| **UI** | Bandeja de Dados (Seleção e Rolagem) | Sim |
| **UI** | Chat (Agrupamento de Mensagens) | Sim |
| **Ficha** | Gerenciamento de Armas (Adicionar/Remover) | Sim |
| **Ficha** | Gerenciamento de Perícias (Nível de Proficiência) | Sim |
| **Ferramentas** | Seleção de Ferramenta (Mover, Régua, etc.) | Sim |

---

## 📁 Estrutura de Arquivos

| Arquivo | Descrição |
| :--- | :--- |
| `index.html` | Define a estrutura da interface, incluindo as telas de login e jogo, e todos os componentes flutuantes (Chat, Ficha, Bandeja). |
| `styles.css` | Define o tema escuro, layout, e o comportamento visual, como a retração da Lista de Jogadores e o submenu da Régua. |
| `script.js` | Contém toda a lógica de inicialização, interação do usuário, renderização do canvas, rolagem de dados e atalhos de teclado. |

---

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

---

## 📝 Detalhes da Implementação

### 1. Canvas e Tokens

* **Pan:** Gerenciado por `onCanvasMouseDown` e `onCanvasMouseMove`, que ajustam `offsetX` e `offsetY` quando a ferramenta `move` está ativa.
* **Zoom:** A função `onCanvasWheel` ajusta a variável `scale` (limitada entre 0.5 e 3) e recalcula os offsets para manter o zoom centrado no ponteiro do mouse.
* **Token:** A função `drawTokens()` renderiza os tokens dos jogadores, calculando a posição na tela com base nas coordenadas do grid (`x`, `y`), `gridSize`, `scale` e os `offsets` de pan.

### 2. Ficha de Personagem

* **Armas:** A função `renderWeapons()` exibe dinamicamente a lista de armas do array `characterWeapons` e permite adicionar novos itens através de um formulário *inline* e removê-los.
* **Perícias:** A função `renderSkills()` renderiza a lista de perícias de D&D 5e e permite ao jogador definir o nível de proficiência (0: Sem, 2: Proficiência, 3: Expertise) através de um menu flutuante.
* **Arrastar:** O método `makeMovable` permite que a ficha seja arrastada e salva sua última posição (`characterSheetPosition`).

---

## 🔮 Planos Futuros e Próximos Passos (TODOs)

A prioridade atual é **melhorar o gerenciamento de dados na Ficha de Personagem**.

### 1. 🥇 Ficha de Personagem Dinâmica (PRIORIDADE)

O objetivo é implementar a funcionalidade completa de gerenciamento de conteúdo nas abas e seções da Ficha de Personagem.

* **Implementar Edição de Itens:** Adicionar lógica de edição para itens de Equipamentos e Mochila.
* **Campos Editáveis:** Tornar os campos de texto/número na ficha (Nome, Classe, Nível, CA, etc.) editáveis e salvar seus valores.
* **Implementar Abas Magias/História:** Adicionar lógica de CRUD (Criação, Leitura, Atualização e Exclusão) para Magias, Habilidades e textos de Background/Aparência.

### 2. 🗺️ Movimentação e Pathfinding de Token

O objetivo é implementar a lógica de movimentação inteligente dos tokens no mapa.

* **Conversão de Coordenadas:** Converter as coordenadas do mouse para coordenadas do grid.
* **Algoritmo de Pathfinding:** Implementar um algoritmo como o **A\*** (A-star) para encontrar o caminho mais curto no mapa.
* **Movimentação:** Mover o token do jogador atual para a posição clicada, seguindo o caminho calculado.
* **Verificação de Colisão:** Integrar a lógica para verificar se o caminho calculado colide com obstáculos de mapa (futura ferramenta Parede).

### 3. 🌐 Sincronização e Multiplayer

O VTT precisa de comunicação em tempo real para ser utilizável.

* **Chat Multiplayer:** Enviar mensagens do chat para outros jogadores, o que exige a implementação de **WebSockets**.
* **Sincronização de Tokens:** Garantir que as posições e o estado dos tokens de todos os jogadores sejam atualizados em tempo real para todos os clientes.
* **Sincronização da Lista de Jogadores:** Sincronizar o estado da lista de jogadores com um servidor.

### 4. 🛠️ Implementação de Ferramentas

Adicionar a lógica de desenho e interação para as ferramentas da barra.

* **Régua (Ruler):** Adicionar a lógica de desenho para as diferentes formas de medição (linha, círculo, quadrado, cone).
* **Parede (Wall):** Permitir que o Mestre desenhe barreiras invisíveis no grid que tokens não podem atravessar.
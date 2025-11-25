# 📜 Documentação Técnica: VTT RPG (Atualizada)

Este projeto é um *Virtual Tabletop (VTT)* básico e funcional, construído com tecnologias web puras (HTML, CSS e JavaScript), com foco inicial na interface e funcionalidades locais.

---

## ⚙️ Funcionalidades Principais

| Categoria | Funcionalidade | Implementação (Sim/Não) |
| :--- | :--- | :--- |
| **Acesso** | Login Personalizado (Nome, Cor, Emoji) | ✅ Sim |
| **Acesso** | Acesso de Mestre (Código `9678` com emoji `👑`) | ✅ Sim |
| **Mapa** | Grid, Pan (Mover) e Zoom | ✅ Sim |
| **Mapa** | Tokens de Jogadores (Renderização) | ✅ Sim |
| **UI** | Ficha de Personagem Arrastável (`#characterSheet`) | ✅ Sim |
| **UI** | Bandeja de Dados Arrastável (`#diceTray`) | ✅ Sim |
| **UI** | Chat Arrastável (`#chatContainer`) | ✅ Sim |
| **UI** | Bandeja de Dados (Seleção e Rolagem) | ✅ Sim |
| **UI** | Chat (Agrupamento de Mensagens) | ✅ Sim |
| **Ficha** | Gerenciamento de Armas (Adicionar/Remover) | ✅ Sim |
| **Ficha** | Gerenciamento de Perícias (Nível de Proficiência) | ✅ Sim |
| **Ficha** | Atributos Editáveis com Cálculo Automático de Modificadores | ✅ Sim |
| **Ferramentas** | Seleção de Ferramenta (Mover, Régua, etc.) | ✅ Sim |

---

## 🐛 Bugs Conhecidos e Issues

### 🔴 CRÍTICOS
- **Nenhum bug crítico identificado**

### 🟡 PROBLEMAS DE USABILIDADE
1. **Arrastar vs Clicar em Botões** - Corrigido ✅
   - *Problema:* Ao arrastar as janelas, os botões internos eram acionados
   - *Solução:* Implementada verificação no `makeMovable()` para ignorar arrasto quando o alvo é um botão

2. **Minimizar Janelas** - Corrigido ✅  
   - *Problema:* Botões de minimizar (-) não funcionavam
   - *Solução:* Corrigida inconsistência entre nomes das funções no HTML e JavaScript

### 🟢 MELHORIAS IDENTIFICADAS
- **Ficha de Personagem** - Campos de texto/número ainda não são persistentes
- **Sistema de Armas** - Formulário de adição precisa ser implementado completamente
- **Perícias** - Cálculos automáticos funcionam, mas interface pode ser melhorada

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

### 2. Sistema de Janelas Arrastáveis

* **Arrastar:** O método `makeMovable` permite que **todas as janelas** (Ficha, Chat, Bandeja) sejam arrastadas pelos seus headers.
* **Correção de Bug:** Implementada verificação para prevenir que botões internos sejam acionados durante o arrasto.
* **Minimizar/Fechar:** Funções `minimizeChat()`, `minimizeCharacterSheet()`, `minimizeDiceTray()` e respectivas funções `close...()`.

### 3. Ficha de Personagem

* **Armas:** A função `renderWeapons()` exibe dinamicamente a lista de armas do array `characterWeapons` e permite adicionar novos itens através de um formulário *inline* e removê-los.
* **Perícias:** A função `renderSkills()` renderiza a lista de perícias de D&D 5e e permite ao jogador definir o nível de proficiência (0: Sem, 2: Proficiência, 3: Expertise) através de um menu flutuante.
* **Atributos:** A função `renderAttributes()` exibe os 6 atributos principais com inputs editáveis e calcula automaticamente os modificadores.
* **Sistema de Cálculo:** Modificadores são calculados em tempo real com `getModifier()` e afetam automaticamente as perícias.

---

## 🎯 PRÓXIMOS PASSOS (PRIORIDADES)

### 🥇 ALTA PRIORIDADE - FICHA DE PERSONAGEM
1. **Implementar Persistência de Dados**
   - Salvar valores dos campos de texto/número (Nome, Classe, Nível, CA, etc.)
   - Implementar localStorage para manter dados entre sessões

2. **Completar Sistema de Armas**
   - Finalizar formulário de adição de armas (`openAddWeaponForm`)
   - Implementar edição de armas existentes
   - Conectar sistema de rolagem de ataques com modificadores reais

3. **Implementar Abas Magias/História**
   - Adicionar lógica CRUD para Magias e Habilidades
   - Implementar campos editáveis para Background e Aparência

### 🥈 MÉDIA PRIORIDADE - MAPA E MOVIMENTAÇÃO
1. **Movimentação de Tokens**
   - Converter coordenadas do mouse para grid
   - Implementar algoritmo de pathfinding (A*)
   - Sistema de colisão com obstáculos

### 🥉 BAIXA PRIORIDADE - MULTIPLAYER
1. **Sincronização em Tempo Real**
   - Implementar WebSockets para chat multiplayer
   - Sincronizar posições de tokens entre jogadores
   - Sistema de lista de jogadores em tempo real

---

## 🔧 Funcionalidades Completas ✅

- [x] Sistema de login com personalização
- [x] Canvas com grid, pan e zoom
- [x] Renderização de tokens
- [x] Janelas arrastáveis (Ficha, Chat, Bandeja)
- [x] Sistema de perícias com proficiência
- [x] Atributos editáveis com cálculos automáticos
- [x] Sistema de armas básico
- [x] Bandeja de dados funcional
- [x] Chat com mensagens formatadas
- [x] Atalhos de teclado
- [x] Ferramentas básicas (Mover, Régua)

---

## 🚀 Como Usar

1. **Acesso:** Abra `index.html` em um navegador moderno
2. **Login:** Digite seu nome, escolha cor e emoji
3. **Mestre:** Use código `9678` e emoji `👑` para acesso de mestre
4. **Navegação:**
   - `V` para mover o mapa
   - `R` para régua de medição
   - `Ctrl+C/F/D` para alternar Chat/Ficha/Bandeja
5. **Ficha:** Edite atributos, perícias e armas diretamente na interface

---

**📅 Última Atualização:** Correção de bugs de arrasto e minimizar janelas
**🎯 Próximo Foco:** Persistência de dados da ficha e sistema completo de armas
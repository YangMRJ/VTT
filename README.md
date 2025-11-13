# Nosso Jogo 2D 🎮

Um protótipo de VTT (Virtual Tabletop) 2D focado em movimento tático, construído com Node.js, Express e Socket.io.

## 🚀 Sobre o Projeto

Este projeto é um protótipo funcional de um **VTT (Virtual Tabletop)** 2D. O que começou como uma simples base para um jogo multiplayer evoluiu para uma ferramenta tática com comunicação em tempo real via WebSockets (Socket.io).

O foco principal é simular o movimento tático de jogos de RPG de mesa, com uma tela de login moderna, um grid interativo e uma ferramenta de régua avançada.

## ✨ Funcionalidades Atuais

* **Login Moderno:** Escolha de nome e cor de token antes de entrar.
* **Sincronização Real-time:** Veja outros jogadores se movendo pelo grid em tempo real.
* **Controles de Câmera:**
    * **Pan:** Arraste com o mouse para mover a câmera.
    * **Zoom:** Use o scroll do mouse para aproximar ou afastar (focado no cursor).
* **Régua Tática (Segure `Alt`)**
    * Calcula distâncias usando a regra **5-10-5** (padrão D&D).
    * A cor da régua usa a cor do token do jogador.
* **Waypoints (Curvas)**
    * Com a régua ativa (`Alt`), clique com o **botão direito** para adicionar pontos de curva (waypoints).
    * A régua calcula o custo total do caminho, incluindo as curvas.
* **Execução de Movimento**
    * Com a régua ativa, clique com o **botão esquerdo** para executar o movimento planejado.
    * O token seguirá a fila de waypoints automaticamente, movendo-se tile por tile.

## 💻 Tecnologias Utilizadas

* **Frontend:**
    * HTML5 (Canvas API)
    * CSS3 (Variáveis CSS, Flexbox)
    * JavaScript (ES6+) (Lógica do cliente, renderização do canvas, manipulação de eventos)
* **Backend:**
    * Node.js (Ambiente de execução)
    * Express (Servidor web para servir os arquivos)
    * Socket.io (Biblioteca para comunicação em tempo real)

## 🏃 Como Executar

1.  **Clone o repositório** (ou tenha os 4 arquivos na mesma pasta).
2.  **Instale o Node.js** se você ainda não o tiver.
3.  **Abra o terminal** na pasta do projeto e inicialize o Node:
    ```bash
    npm init -y
    ```
4.  **Instale as dependências** (Express e Socket.io):
    ```bash
    npm install express socket.io
    ```
5.  **Inicie o servidor:**
    ```bash
    node server.js
    ```
6.  **Abra seu navegador** e acesse `http://localhost:3000`.
7.  Abra uma segunda aba (ou um navegador diferente) no mesmo endereço para ver a interação!

## 🔮 Próximos Passos

Os próximos grandes objetivos para este projeto são:

* **Implementar uma Toolbar:** Adicionar uma barra de ferramentas para alternar entre "Mover", "Régua", "Ping", etc., em vez de depender apenas do `Alt`.
* **Lógica de Mestre (GM):** Criar permissões especiais para um Mestre de Jogo (controlar NPCs, mover tokens de jogadores, "fog of war").
* **Otimização:** Refinar a interpolação de movimento de outros jogadores para que também seja suave.
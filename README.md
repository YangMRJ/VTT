# 🐉 Pygame D&D Menu & Character Manager

Este é um projeto desenvolvido em Python utilizando a biblioteca **Pygame**. Ele funciona como a base de um jogo de RPG (estilo D&D), contando com um Menu Principal interativo, um sistema avançado de Configurações (Áudio e Gráficos) e um Gerenciador/Criador de Fichas de Personagem completo.

Toda a progressão e configuração são salvas automaticamente de forma persistente.

---

## ✨ Funcionalidades

### 1. Sistema de Menus
* **Menu Principal**: Navegação fluida com suporte a teclado (WASD/Setas) e Mouse (Hover e Clique).
* **Feedback Audiovisual**: Efeitos sonoros ao navegar e confirmar seleções, com marcadores visuais `><` em amarelo.

### 2. Configurações (Options)
* **Áudio**: Sliders customizados estilo "pixel art" para controlar o volume da Música de Fundo e dos Efeitos Sonoros (SFX) independentemente.
* **Gráficos**: 
  * Alteração de Resolução (de 1024x768 até 1920x1080).
  * Modos de Exibição: `JANELA`, `FULLSCREEN` e `BORDERLESS` (Sem bordas, ocupando o monitor atual).

### 3. Criador e Ficha de Personagem (D&D 5e)
* **Criação**: Defina o Nome, Raça, Classe e Antecedente do herói. Essas opções ficam travadas após a criação para manter a integridade do RPG.
* **Ficha de Personagem (Dashboard)**: Layout em blocos inspirado em fichas de D&D de mesa.
  * **Info Básica**: Leitura dos dados definidos na criação + Nível.
  * **Atributos**: Ajuste dinâmico de Força, Destreza, Constituição, Inteligência, Sabedoria e Carisma.
  * **Combate**: HP Máximo, Classe de Armadura (CA), Iniciativa e Deslocamento.
  * **Perícias**: Atletismo, Furtividade, Percepção e Persuasão.
* **Exclusão Segura**: Sistema de "Zona de Perigo" que exige a digitação da palavra `delete` para evitar exclusões acidentais.

### 4. Persistência de Dados (Save/Load)
* Todos os personagens, volumes, resoluções e modos de tela são salvos automaticamente em um arquivo `settings.json` local. O jogo sempre abre exatamente como você o deixou.

---

## 🛠️ Requisitos e Instalação

**1. Instale o Python:**
Certifique-se de ter o Python 3.x instalado na sua máquina.

**2. Instale o Pygame:**
Abra o terminal ou prompt de comando e digite:
```bash
pip install pygame

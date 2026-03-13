import pygame
import sys

# Inicialização
pygame.init()
LARGURA, ALTURA = 1280, 720
tela = pygame.display.set_mode((LARGURA, ALTURA))
pygame.display.set_caption("VTT Project - Menu")
relogio = pygame.time.Clock()

# Cores e Fontes
PRETO = (0, 0, 0)
BRANCO = (255, 255, 255)
AMARELO = (255, 255, 0)
fonte = pygame.font.SysFont("Arial", 40, bold=True)

# Opções do Menu
opcoes = ["Host", "Jogar", "Compendio", "Personagens", "Opções", "Sair"]
indice_selecionado = 0

# Carregar Imagem da Seta
try:
    seta_img = pygame.image.load("arrow_select.png")
    seta_img = pygame.transform.scale(seta_img, (30, 30)) # Ajuste o tamanho se necessário
except:
    seta_img = None # Caso não encontre a imagem, o código não quebra
    print("Aviso: Imagem 'arrow_select.png' não encontrada.")

def desenhar_menu():
    tela.fill(PRETO)
    
    for i, texto in enumerate(opcoes):
        # Define a cor: Amarelo se selecionado, Branco se não
        cor = AMARELO if i == indice_selecionado else BRANCO
        surface_texto = fonte.render(texto, True, cor)
        
        # Posicionamento centralizado na horizontal, um embaixo do outro
        rect_texto = surface_texto.get_rect(center=(LARGURA // 2, 200 + i * 60))
        
        # Desenha a seta se for a opção selecionada
        if i == indice_selecionado and seta_img:
            rect_seta = seta_img.get_rect(midright=(rect_texto.left - 20, rect_texto.centery))
            tela.blit(seta_img, rect_seta)
        
        tela.blit(surface_texto, rect_texto)

# Loop Principal
while True:
    desenhar_menu()
    
    # Captura posição do mouse
    mouse_pos = pygame.mouse.get_pos()
    
    for evento in pygame.event.get():
        if evento.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

        # Seleção por TECLADO
        if evento.type == pygame.KEYDOWN:
            if evento.key == pygame.K_UP:
                indice_selecionado = (indice_selecionado - 1) % len(opcoes)
            elif evento.key == pygame.K_DOWN:
                indice_selecionado = (indice_selecionado + 1) % len(opcoes)
            elif evento.key in [pygame.K_RETURN, pygame.K_SPACE]:
                print(f"Selecionado: {opcoes[indice_selecionado]}")
                if opcoes[indice_selecionado] == "Sair":
                    pygame.quit()
                    sys.exit()

        # Seleção por MOUSE (Movimento)
        if evento.type == pygame.MOUSEMOTION:
            for i, texto in enumerate(opcoes):
                rect_teste = fonte.render(texto, True, BRANCO).get_rect(center=(LARGURA // 2, 200 + i * 60))
                if rect_teste.collidepoint(mouse_pos):
                    indice_selecionado = i

        # Seleção por MOUSE (Clique)
        if evento.type == pygame.MOUSEBUTTONDOWN:
            if evento.button == 1: # Clique esquerdo
                print(f"Clicado: {opcoes[indice_selecionado]}")
                if opcoes[indice_selecionado] == "Sair":
                    pygame.quit()
                    sys.exit()

    pygame.display.flip()
    relogio.tick(60)
import pygame
import sys

# Inicialização
pygame.init()
pygame.mixer.init()

LARGURA, ALTURA = 1280, 720
tela = pygame.display.set_mode((LARGURA, ALTURA))
pygame.display.set_caption("VTT Project")
relogio = pygame.time.Clock()

# Cores
PRETO = (0, 0, 0)
BRANCO = (255, 255, 255)
AMARELO = (255, 255, 0)

# Fonte e Áudio
try:
    fonte = pygame.font.Font("Minecraft.ttf", 40)
except:
    fonte = pygame.font.SysFont("Arial", 40, bold=True)
    print("Aviso: Minecraft.ttf não encontrado, usando fonte padrão.")

# Sons
try:
    som_nav = pygame.mixer.Sound("nav.mp3")
    som_select = pygame.mixer.Sound("select.mp3")
    pygame.mixer.music.load("menu_theme.mp3")
    pygame.mixer.music.play(-1)
except:
    print("Erro ao carregar arquivos de áudio.")
    som_nav = som_select = None

# Opções do Menu
opcoes = ["Host", "Jogar", "Compendio", "Personagens", "Opções", "Sair"]
indice_selecionado = 0

def desenhar_menu():
    tela.fill(PRETO)
    
    for i, texto in enumerate(opcoes):
        if i == indice_selecionado:
            cor = AMARELO
            # Adiciona as setas de texto ao redor da opção
            texto_exibido = f"> {texto} <"
        else:
            cor = BRANCO
            texto_exibido = texto
            
        surface_texto = fonte.render(texto_exibido, True, cor)
        rect_texto = surface_texto.get_rect(center=(LARGURA // 2, 200 + i * 70))
        
        tela.blit(surface_texto, rect_texto)

# Loop Principal
while True:
    desenhar_menu()
    mouse_pos = pygame.mouse.get_pos()
    
    for evento in pygame.event.get():
        if evento.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

        # Seleção por TECLADO
        if evento.type == pygame.KEYDOWN:
            indice_anterior = indice_selecionado
            
            if evento.key == pygame.K_UP:
                if indice_selecionado > 0:
                    indice_selecionado -= 1
            elif evento.key == pygame.K_DOWN:
                if indice_selecionado < len(opcoes) - 1:
                    indice_selecionado += 1

            if indice_selecionado != indice_anterior and som_nav:
                som_nav.play()

            elif evento.key in [pygame.K_RETURN, pygame.K_SPACE]:
                if som_select: som_select.play()
                if opcoes[indice_selecionado] == "Sair":
                    pygame.time.wait(300)
                    pygame.quit()
                    sys.exit()

        # Seleção por MOUSE
        if evento.type == pygame.MOUSEMOTION:
            for i, texto in enumerate(opcoes):
                # Usamos o texto original para o cálculo da área de colisão (evita que o rect mude de tamanho com as setas)
                rect_teste = fonte.render(texto, True, BRANCO).get_rect(center=(LARGURA // 2, 200 + i * 70))
                # Expandimos um pouco a área de colisão lateral para facilitar o uso do mouse
                rect_teste.width += 100
                rect_teste.x -= 50
                
                if rect_teste.collidepoint(mouse_pos):
                    if indice_selecionado != i:
                        indice_selecionado = i
                        if som_nav: som_nav.play()

        if evento.type == pygame.MOUSEBUTTONDOWN:
            if evento.button == 1:
                # Verifica se o clique foi na opção selecionada
                rect_clique = fonte.render(f"> {opcoes[indice_selecionado]} <", True, AMARELO).get_rect(center=(LARGURA // 2, 200 + indice_selecionado * 70))
                if rect_clique.collidepoint(mouse_pos):
                    if som_select: som_select.play()
                    if opcoes[indice_selecionado] == "Sair":
                        pygame.time.wait(300)
                        pygame.quit()
                        sys.exit()

    pygame.display.flip()
    relogio.tick(60)
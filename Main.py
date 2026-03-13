import pygame
import sys

# --- 1. CONFIGURAÇÕES INICIAIS ---
pygame.init()
pygame.mixer.init()

LARGURA, ALTURA = 1280, 720
tela = pygame.display.set_mode((LARGURA, ALTURA))
pygame.display.set_caption("VTT Project - Menu")
relogio = pygame.time.Clock()

# Cores
PRETO = (0, 0, 0)
BRANCO = (255, 255, 255)
AMARELO = (255, 255, 0)

# Carregamento de Recursos (Fontes e Sons)
try:
    fonte = pygame.font.Font("Minecraft.ttf", 40)
    fonte_titulo = pygame.font.Font("Minecraft.ttf", 80)
except:
    fonte = pygame.font.SysFont("Arial", 40, bold=True)
    fonte_titulo = pygame.font.SysFont("Arial", 80, bold=True)
    print("Aviso: Minecraft.ttf não encontrado, usando fonte padrão.")

try:
    som_nav = pygame.mixer.Sound("nav.mp3")
    som_select = pygame.mixer.Sound("select.mp3")
    pygame.mixer.music.load("menu_theme.mp3")
    pygame.mixer.music.set_volume(0.5) # Volume da música em 50%
    pygame.mixer.music.play(-1)
except:
    print("Erro ao carregar arquivos de áudio.")
    som_nav = som_select = None

# Estado do Menu
opcoes = ["Host", "Jogar", "Compendio", "Personagens", "Opções", "Sair"]
indice_selecionado = 0
tempo_ultima_tecla = 0
DELAY_REPETICAO = 150 # Velocidade ao segurar a seta (ms)

# --- 2. FUNÇÕES AUXILIARES ---

def desenhar_menu():
    tela.fill(PRETO)
    
    # Título (Opcional, para não ficar vazio no topo)
    surf_titulo = fonte_titulo.render("VTT PROJECT", True, BRANCO)
    rect_titulo = surf_titulo.get_rect(center=(LARGURA // 2, 80))
    tela.blit(surf_titulo, rect_titulo)
    
    for i, texto in enumerate(opcoes):
        if i == indice_selecionado:
            cor = AMARELO
            texto_exibido = f"> {texto} <"
        else:
            cor = BRANCO
            texto_exibido = texto
            
        surface_texto = fonte.render(texto_exibido, True, cor)
        # O espaçamento vertical (70) e o início (220)
        rect_texto = surface_texto.get_rect(center=(LARGURA // 2, 220 + i * 70))
        tela.blit(surface_texto, rect_texto)

# --- 3. LOOP PRINCIPAL ---
while True:
    desenhar_menu()
    agora = pygame.time.get_ticks()
    mouse_pos = pygame.mouse.get_pos()
    teclas = pygame.key.get_pressed()
    
    # Lógica de Navegação (Segurar Tecla)
    if agora - tempo_ultima_tecla > DELAY_REPETICAO:
        indice_anterior = indice_selecionado
        if teclas[pygame.K_UP]:
            if indice_selecionado > 0:
                indice_selecionado -= 1
                tempo_ultima_tecla = agora
        elif teclas[pygame.K_DOWN]:
            if indice_selecionado < len(opcoes) - 1:
                indice_selecionado += 1
                tempo_ultima_tecla = agora
        
        if indice_selecionado != indice_anterior and som_nav:
            som_nav.play()

    # Processamento de Eventos (Cliques e Teclas Únicas)
    for evento in pygame.event.get():
        if evento.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

        if evento.type == pygame.KEYDOWN:
            if evento.key in [pygame.K_RETURN, pygame.K_SPACE]:
                if som_select: som_select.play()
                print(f"Ação: {opcoes[indice_selecionado]}")
                if opcoes[indice_selecionado] == "Sair":
                    pygame.time.wait(300)
                    pygame.quit()
                    sys.exit()

        if evento.type == pygame.MOUSEMOTION:
            for i, texto in enumerate(opcoes):
                # Rect de colisão para o mouse
                rect_teste = fonte.render(texto, True, BRANCO).get_rect(center=(LARGURA // 2, 220 + i * 70))
                # Aumentamos a largura para o mouse não "fugir" ao trocar de opção
                rect_teste.width += 150
                rect_teste.x -= 75
                
                if rect_teste.collidepoint(mouse_pos):
                    if indice_selecionado != i:
                        indice_selecionado = i
                        if som_nav: som_nav.play()

        if evento.type == pygame.MOUSEBUTTONDOWN:
            if evento.button == 1: # Botão esquerdo
                # Verifica colisão na opção atual
                rect_clique = fonte.render(f"> {opcoes[indice_selecionado]} <", True, AMARELO).get_rect(center=(LARGURA // 2, 220 + indice_selecionado * 70))
                if rect_clique.collidepoint(mouse_pos):
                    if som_select: som_select.play()
                    print(f"Clique: {opcoes[indice_selecionado]}")
                    if opcoes[indice_selecionado] == "Sair":
                        pygame.time.wait(300)
                        pygame.quit()
                        sys.exit()

    pygame.display.flip()
    relogio.tick(60)
import pygame
import sys

# --- 1. CONFIGURAÇÕES INICIAIS ---
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
CINZA_ESCURO = (40, 40, 40)

# Carregamento de Recursos
try:
    fonte = pygame.font.Font("Minecraft.ttf", 40)
    fonte_p = pygame.font.Font("Minecraft.ttf", 30)
    fonte_titulo = pygame.font.Font("Minecraft.ttf", 80)
except:
    fonte = pygame.font.SysFont("Arial", 40, bold=True)
    fonte_p = pygame.font.SysFont("Arial", 30, bold=True)
    fonte_titulo = pygame.font.SysFont("Arial", 80, bold=True)

# Sons
try:
    som_nav = pygame.mixer.Sound("nav.mp3")
    som_select = pygame.mixer.Sound("select.mp3")
    pygame.mixer.music.load("menu_theme.mp3")
    pygame.mixer.music.play(-1)
except:
    som_nav = som_select = None

# Estados do Jogo
TELA_MENU = "menu"
TELA_OPCOES = "opcoes"
estado_atual = TELA_MENU

# Variáveis do Menu Principal
opcoes_main = ["Host", "Jogar", "Compendio", "Personagens", "Opções", "Sair"]
indice_selecionado = 0
tempo_ultima_tecla = 0
DELAY_REPETICAO = 150 

# Variáveis da Tela de Opções
abas = ["Geral", "Gráficos", "Áudio"]
aba_selecionada = 0

# --- 2. FUNÇÕES DE DESENHO ---

def desenhar_menu_principal():
    global indice_selecionado
    tela.fill(PRETO)
    surf_titulo = fonte_titulo.render("VTT PROJECT", True, BRANCO)
    rect_titulo = surf_titulo.get_rect(center=(LARGURA // 2, 80))
    tela.blit(surf_titulo, rect_titulo)
    
    for i, texto in enumerate(opcoes_main):
        if i == indice_selecionado:
            cor = AMARELO
            texto_exibido = f"> {texto} <"
        else:
            cor = BRANCO
            texto_exibido = texto
        surface = fonte.render(texto_exibido, True, cor)
        rect = surface.get_rect(center=(LARGURA // 2, 220 + i * 70))
        tela.blit(surface, rect)

def desenhar_tela_opcoes():
    tela.fill(PRETO)
    
    # 1. Box Principal (Cobre a maior parte da tela)
    largura_box, altura_box = 1000, 550
    box_rect = pygame.Rect((LARGURA//2 - largura_box//2, ALTURA//2 - altura_box//2 + 30), (largura_box, altura_box))
    pygame.draw.rect(tela, CINZA_ESCURO, box_rect, border_radius=10)
    pygame.draw.rect(tela, BRANCO, box_rect, 3, border_radius=10) # Borda
    
    # 2. Seta de Voltar "<"
    surf_voltar = fonte.render("<", True, AMARELO)
    rect_voltar = surf_voltar.get_rect(topleft=(box_rect.left + 20, box_rect.top + 20))
    tela.blit(surf_voltar, rect_voltar)
    
    # 3. Abas Divisórias
    for i, nome in enumerate(abas):
        cor = AMARELO if i == aba_selecionada else BRANCO
        surf_aba = fonte_p.render(nome, True, cor)
        # Posiciona as abas uma ao lado da outra
        rect_aba = surf_aba.get_rect(topleft=(box_rect.left + 100 + i * 200, box_rect.top + 25))
        tela.blit(surf_aba, rect_aba)
        
        # Linha embaixo da aba selecionada
        if i == aba_selecionada:
            pygame.draw.line(tela, AMARELO, (rect_aba.left, rect_aba.bottom), (rect_aba.right, rect_aba.bottom), 3)

    return rect_voltar # Retornamos o rect para checar clique depois

# --- 3. LOOP PRINCIPAL ---
while True:
    agora = pygame.time.get_ticks()
    mouse_pos = pygame.mouse.get_pos()
    
    if estado_atual == TELA_MENU:
        desenhar_menu_principal()
        
        # Lógica de teclado para o Menu
        teclas = pygame.key.get_pressed()
        if agora - tempo_ultima_tecla > DELAY_REPETICAO:
            if teclas[pygame.K_UP] and indice_selecionado > 0:
                indice_selecionado -= 1
                tempo_ultima_tecla = agora
                if som_nav: som_nav.play()
            elif teclas[pygame.K_DOWN] and indice_selecionado < len(opcoes_main) - 1:
                indice_selecionado += 1
                tempo_ultima_tecla = agora
                if som_nav: som_nav.play()

    elif estado_atual == TELA_OPCOES:
        rect_voltar = desenhar_tela_opcoes()

    # --- PROCESSAMENTO DE EVENTOS ---
    for evento in pygame.event.get():
        if evento.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

        if evento.type == pygame.KEYDOWN:
            if estado_atual == TELA_MENU:
                if evento.key in [pygame.K_RETURN, pygame.K_SPACE]:
                    if som_select: som_select.play()
                    if opcoes_main[indice_selecionado] == "Opções":
                        estado_atual = TELA_OPCOES
                    elif opcoes_main[indice_selecionado] == "Sair":
                        pygame.quit()
                        sys.exit()
            
            elif estado_atual == TELA_OPCOES:
                if evento.key == pygame.K_ESCAPE:
                    estado_atual = TELA_MENU
                # Navegar entre abas com as setas
                if evento.key == pygame.K_RIGHT:
                    aba_selecionada = (aba_selecionada + 1) % len(abas)
                    if som_nav: som_nav.play()
                if evento.key == pygame.K_LEFT:
                    aba_selecionada = (aba_selecionada - 1) % len(abas)
                    if som_nav: som_nav.play()

        if evento.type == pygame.MOUSEBUTTONDOWN:
            if evento.button == 1:
                if estado_atual == TELA_MENU:
                    # (Mesma lógica de colisão do menu anterior)
                    rect_clique = fonte.render(f"> {opcoes_main[indice_selecionado]} <", True, AMARELO).get_rect(center=(LARGURA // 2, 220 + indice_selecionado * 70))
                    if rect_clique.collidepoint(mouse_pos):
                        if som_select: som_select.play()
                        if opcoes_main[indice_selecionado] == "Opções":
                            estado_atual = TELA_OPCOES
                        elif opcoes_main[indice_selecionado] == "Sair":
                            pygame.quit()
                            sys.exit()
                
                elif estado_atual == TELA_OPCOES:
                    # Clique na seta de voltar
                    if rect_voltar.collidepoint(mouse_pos):
                        if som_select: som_select.play()
                        estado_atual = TELA_MENU
                    
                    # Clique nas abas
                    largura_box = 1000
                    box_left = LARGURA//2 - largura_box//2
                    box_top = ALTURA//2 - 550//2 + 30
                    for i in range(len(abas)):
                        rect_aba = pygame.Rect(box_left + 100 + i * 200, box_top + 25, 150, 40)
                        if rect_aba.collidepoint(mouse_pos):
                            aba_selecionada = i
                            if som_nav: som_nav.play()

    pygame.display.flip()
    relogio.tick(60)
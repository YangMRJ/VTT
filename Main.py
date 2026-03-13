import pygame
import sys

# --- 1. CONFIGURAÇÕES E INICIALIZAÇÃO ---
pygame.init()
pygame.mixer.init()

LARGURA, ALTURA = 1280, 720
tela = pygame.display.set_mode((LARGURA, ALTURA))
pygame.display.set_caption("VTT Project")
relogio = pygame.time.Clock()

# Cores
PRETO, BRANCO, AMARELO, CINZA = (0, 0, 0), (255, 255, 255), (255, 255, 0), (40, 40, 40)
CINZA_L = (100, 100, 100)

# Carregamento de Recursos
try:
    fonte_p = pygame.font.Font("Minecraft.ttf", 25)
    fonte = pygame.font.Font("Minecraft.ttf", 40)
    fonte_titulo = pygame.font.Font("Minecraft.ttf", 80)
except:
    fonte_p = pygame.font.SysFont("Arial", 25, bold=True)
    fonte = pygame.font.SysFont("Arial", 40, bold=True)
    fonte_titulo = pygame.font.SysFont("Arial", 80, bold=True)

try:
    som_nav = pygame.mixer.Sound("nav.mp3")
    som_select = pygame.mixer.Sound("select.mp3")
    pygame.mixer.music.load("menu_theme.mp3")
    pygame.mixer.music.set_volume(0.5)
    pygame.mixer.music.play(-1)
except:
    som_nav = som_select = None

# --- 2. VARIÁVEIS DE ESTADO ---
estado_atual = "menu" # Começa no Menu Principal

# Variáveis do Menu Principal
opcoes_main = ["Host", "Jogar", "Compendio", "Personagens", "Opções", "Sair"]
indice_selecionado = 0
tempo_ultima_tecla = 0
DELAY_REPETICAO = 150 

# Variáveis da Tela de Opções
abas = ["Geral", "Gráficos", "Áudio"]
aba_selecionada = 0
mostrar_fps = False
resolucoes = ["800x600", "1280x720", "1600x900", "1920x1080"]
res_index = 1
modos_tela = ["Window", "Borderless", "Full Screen"]
modo_index = 0
vol_musica = 0.5
vol_sfx = 0.7

# --- 3. CLASSES DE UI ---
class Slider:
    def __init__(self, x, y, largura, valor_inicial):
        self.rect = pygame.Rect(x, y, largura, 10)
        self.valor = valor_inicial
        self.circulo_x = x + (largura * valor_inicial)
    
    def desenhar(self, tela):
        pygame.draw.rect(tela, CINZA_L, self.rect)
        pygame.draw.circle(tela, AMARELO, (int(self.circulo_x), self.rect.centery), 12)
    
    def atualizar(self, mouse_pos, clique):
        if clique and self.rect.inflate(0, 20).collidepoint(mouse_pos):
            self.circulo_x = max(self.rect.left, min(mouse_pos[0], self.rect.right))
            self.valor = (self.circulo_x - self.rect.left) / self.rect.width
            return True
        return False

# Instanciando os Sliders
slider_musica = Slider(540, 320, 300, vol_musica)
slider_sfx = Slider(540, 420, 300, vol_sfx)


# --- 4. FUNÇÕES DE DESENHO ---

def desenhar_menu_principal():
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
            
        surface_texto = fonte.render(texto_exibido, True, cor)
        rect_texto = surface_texto.get_rect(center=(LARGURA // 2, 220 + i * 70))
        tela.blit(surface_texto, rect_texto)

def desenhar_aba_geral(box_rect):
    txt = fonte.render("Mostrar FPS:", True, BRANCO)
    tela.blit(txt, (box_rect.left + 100, box_rect.top + 150))
    
    check_rect = pygame.Rect(box_rect.left + 400, box_rect.top + 155, 30, 30)
    pygame.draw.rect(tela, BRANCO, check_rect, 2)
    if mostrar_fps:
        pygame.draw.rect(tela, AMARELO, check_rect.inflate(-10, -10))
    return [("fps", check_rect)]

def desenhar_aba_graficos(box_rect):
    txt_res = fonte.render(f"Resolução: < {resolucoes[res_index]} >", True, BRANCO)
    res_rect = txt_res.get_rect(topleft=(box_rect.left + 100, box_rect.top + 150))
    tela.blit(txt_res, res_rect)
    
    txt_modo = fonte.render(f"Modo: < {modos_tela[modo_index]} >", True, BRANCO)
    modo_rect = txt_modo.get_rect(topleft=(box_rect.left + 100, box_rect.top + 250))
    tela.blit(txt_modo, modo_rect)
    return [("res", res_rect), ("modo", modo_rect)]

def desenhar_aba_audio(box_rect):
    tela.blit(fonte.render("Música", True, BRANCO), (box_rect.left + 100, 300))
    slider_musica.desenhar(tela)
    tela.blit(fonte.render("SFX", True, BRANCO), (box_rect.left + 100, 400))
    slider_sfx.desenhar(tela)
    return []

def desenhar_tela_opcoes():
    tela.fill(PRETO)
    
    # Desenha a Box
    largura_box, altura_box = 1000, 550
    box_rect = pygame.Rect((LARGURA//2 - largura_box//2, ALTURA//2 - altura_box//2 + 30), (largura_box, altura_box))
    pygame.draw.rect(tela, CINZA, box_rect, border_radius=10)
    pygame.draw.rect(tela, BRANCO, box_rect, 3, border_radius=10)
    
    # Seta Voltar
    surf_voltar = fonte.render("<", True, AMARELO)
    rect_voltar = surf_voltar.get_rect(topleft=(box_rect.left + 25, box_rect.top + 25))
    tela.blit(surf_voltar, rect_voltar)

    # Abas Centralizadas
    largura_total_abas = 600
    inicio_x = box_rect.centerx - (largura_total_abas // 2)
    areas_abas = []

    for i, nome in enumerate(abas):
        cor = AMARELO if i == aba_selecionada else BRANCO
        surf_aba = fonte.render(nome, True, cor)
        rect_aba = surf_aba.get_rect(center=(inicio_x + i * 250, box_rect.top + 45))
        if i == aba_selecionada:
            pygame.draw.line(tela, AMARELO, (rect_aba.left, rect_aba.bottom), (rect_aba.right, rect_aba.bottom), 3)
        tela.blit(surf_aba, rect_aba)
        areas_abas.append(rect_aba)

    # Conteúdo das Abas
    interativos = []
    if aba_selecionada == 0: interativos = desenhar_aba_geral(box_rect)
    elif aba_selecionada == 1: interativos = desenhar_aba_graficos(box_rect)
    elif aba_selecionada == 2: interativos = desenhar_aba_audio(box_rect)

    return rect_voltar, areas_abas, interativos


# --- 5. LOOP PRINCIPAL ---
while True:
    agora = pygame.time.get_ticks()
    mouse_pos = pygame.mouse.get_pos()
    mouse_clicado = pygame.mouse.get_pressed()[0]
    teclas = pygame.key.get_pressed()
    
    # --- LÓGICA DE DESENHO E ATUALIZAÇÃO CONTÍNUA ---
    if estado_atual == "menu":
        desenhar_menu_principal()
        
        # Navegação de Teclado (Segurando a tecla)
        if agora - tempo_ultima_tecla > DELAY_REPETICAO:
            indice_anterior = indice_selecionado
            if teclas[pygame.K_UP] and indice_selecionado > 0:
                indice_selecionado -= 1
                tempo_ultima_tecla = agora
            elif teclas[pygame.K_DOWN] and indice_selecionado < len(opcoes_main) - 1:
                indice_selecionado += 1
                tempo_ultima_tecla = agora
            
            if indice_selecionado != indice_anterior and som_nav:
                som_nav.play()

    elif estado_atual == "opcoes":
        rect_voltar, areas_abas, interativos = desenhar_tela_opcoes()
        
        # Atualiza Sliders continuamente se aba_selecionada for 2 (Áudio)
        if aba_selecionada == 2:
            if slider_musica.atualizar(mouse_pos, mouse_clicado):
                vol_musica = slider_musica.valor
                pygame.mixer.music.set_volume(vol_musica)
            if slider_sfx.atualizar(mouse_pos, mouse_clicado):
                vol_sfx = slider_sfx.valor

    # FPS Global (Desenha por cima de tudo se ativado)
    if mostrar_fps:
        fps_txt = fonte_p.render(f"FPS: {int(relogio.get_fps())}", True, (0, 255, 0))
        tela.blit(fps_txt, (10, 10))

    # --- PROCESSAMENTO DE EVENTOS (Cliques Únicos) ---
    for evento in pygame.event.get():
        if evento.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

        # TECLADO
        if evento.type == pygame.KEYDOWN:
            if estado_atual == "menu":
                if evento.key in [pygame.K_RETURN, pygame.K_SPACE]:
                    if som_select: som_select.play()
                    if opcoes_main[indice_selecionado] == "Opções":
                        estado_atual = "opcoes" # Muda a tela!
                    elif opcoes_main[indice_selecionado] == "Sair":
                        pygame.time.wait(300)
                        pygame.quit()
                        sys.exit()
            
            elif estado_atual == "opcoes":
                if evento.key == pygame.K_ESCAPE:
                    if som_select: som_select.play()
                    estado_atual = "menu" # Volta pro Menu
                # Trocar de aba com setas
                if evento.key == pygame.K_RIGHT:
                    aba_selecionada = (aba_selecionada + 1) % len(abas)
                    if som_nav: som_nav.play()
                if evento.key == pygame.K_LEFT:
                    aba_selecionada = (aba_selecionada - 1) % len(abas)
                    if som_nav: som_nav.play()

        # MOUSE MOTION (Apenas Menu)
        if evento.type == pygame.MOUSEMOTION and estado_atual == "menu":
            for i, texto in enumerate(opcoes_main):
                rect_teste = fonte.render(texto, True, BRANCO).get_rect(center=(LARGURA // 2, 220 + i * 70))
                rect_teste.width += 150
                rect_teste.x -= 75
                if rect_teste.collidepoint(mouse_pos):
                    if indice_selecionado != i:
                        indice_selecionado = i
                        if som_nav: som_nav.play()

        # MOUSE CLIQUE
        if evento.type == pygame.MOUSEBUTTONDOWN and evento.button == 1:
            if estado_atual == "menu":
                rect_clique = fonte.render(f"> {opcoes_main[indice_selecionado]} <", True, AMARELO).get_rect(center=(LARGURA // 2, 220 + indice_selecionado * 70))
                if rect_clique.collidepoint(mouse_pos):
                    if som_select: som_select.play()
                    if opcoes_main[indice_selecionado] == "Opções":
                        estado_atual = "opcoes"
                    elif opcoes_main[indice_selecionado] == "Sair":
                        pygame.time.wait(300)
                        pygame.quit()
                        sys.exit()
            
            elif estado_atual == "opcoes":
                # Clique na Seta Voltar
                if rect_voltar.collidepoint(mouse_pos):
                    if som_select: som_select.play()
                    estado_atual = "menu"
                
                # Clique nas Abas
                for i, r in enumerate(areas_abas):
                    if r.collidepoint(mouse_pos):
                        if aba_selecionada != i and som_nav: som_nav.play()
                        aba_selecionada = i
                
                # Clique nas opções dentro das abas
                for tipo, rect in interativos:
                    if rect.collidepoint(mouse_pos):
                        if som_select: som_select.play()
                        if tipo == "fps": 
                            mostrar_fps = not mostrar_fps
                        elif tipo == "res": 
                            res_index = (res_index + 1) % len(resolucoes)
                        elif tipo == "modo": 
                            modo_index = (modo_index + 1) % len(modos_tela)

    pygame.display.flip()
    relogio.tick(60)
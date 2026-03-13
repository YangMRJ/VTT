import pygame
import sys

# --- 1. CONFIGURAÇÕES E INICIALIZAÇÃO ---
pygame.init()
pygame.mixer.init()

# Variáveis Globais de Tela
LARGURA, ALTURA = 1280, 720
tela = pygame.display.set_mode((LARGURA, ALTURA), pygame.RESIZABLE)
pygame.display.set_caption("VTT Project")
relogio = pygame.time.Clock()

# Cores
PRETO, BRANCO, AMARELO = (0, 0, 0), (255, 255, 255), (255, 255, 0)
CINZA_ESCURO, CINZA_CLARO = (40, 40, 40), (80, 80, 80)

# Fontes
try:
    fonte_p = pygame.font.Font("Minecraft.ttf", 25)
    fonte = pygame.font.Font("Minecraft.ttf", 40)
    fonte_titulo = pygame.font.Font("Minecraft.ttf", 80)
except:
    fonte_p = pygame.font.SysFont("Arial", 25, bold=True)
    fonte = pygame.font.SysFont("Arial", 40, bold=True)
    fonte_titulo = pygame.font.SysFont("Arial", 80, bold=True)

# --- 2. CLASSES DE UI ---

class Slider:
    def __init__(self, largura, valor_inicial):
        self.rect = pygame.Rect(0, 0, largura, 10) # X e Y serão atualizados no desenho
        self.valor = valor_inicial
    
    def desenhar(self, tela, x, y):
        self.rect.topleft = (x, y)
        circulo_x = self.rect.x + (self.rect.width * self.valor)
        pygame.draw.rect(tela, CINZA_CLARO, self.rect)
        pygame.draw.circle(tela, AMARELO, (int(circulo_x), self.rect.centery), 12)
    
    def atualizar(self, mouse_pos, clique):
        if clique and self.rect.inflate(0, 20).collidepoint(mouse_pos):
            novo_x = max(self.rect.left, min(mouse_pos[0], self.rect.right))
            self.valor = (novo_x - self.rect.left) / self.rect.width
            return True
        return False

class Dropdown:
    def __init__(self, largura, altura, opcoes, indice_inicial=0):
        self.rect = pygame.Rect(0, 0, largura, altura)
        self.opcoes = opcoes
        self.indice_selecionado = indice_inicial
        self.aberto = False
        self.rects_opcoes = []

    def desenhar(self, tela, x, y):
        self.rect.topleft = (x, y)
        # Fundo principal
        pygame.draw.rect(tela, CINZA_CLARO, self.rect)
        pygame.draw.rect(tela, BRANCO, self.rect, 2)
        
        # Texto Selecionado
        texto = fonte_p.render(self.opcoes[self.indice_selecionado], True, BRANCO)
        tela.blit(texto, (self.rect.x + 10, self.rect.centery - texto.get_height()//2))
        
        # Setinha
        seta = "V" if not self.aberto else "^"
        texto_seta = fonte_p.render(seta, True, BRANCO)
        tela.blit(texto_seta, (self.rect.right - 30, self.rect.centery - texto_seta.get_height()//2))

        # Desenha a lista SE estiver aberto
        if self.aberto:
            self.rects_opcoes = []
            for i, op in enumerate(self.opcoes):
                rect_op = pygame.Rect(self.rect.x, self.rect.bottom + i * self.rect.height, self.rect.width, self.rect.height)
                self.rects_opcoes.append(rect_op)
                
                # Highlight se o mouse passar por cima
                cor_fundo = AMARELO if rect_op.collidepoint(pygame.mouse.get_pos()) else CINZA_ESCURO
                cor_texto = PRETO if cor_fundo == AMARELO else BRANCO
                
                pygame.draw.rect(tela, cor_fundo, rect_op)
                pygame.draw.rect(tela, BRANCO, rect_op, 1)
                texto_op = fonte_p.render(op, True, cor_texto)
                tela.blit(texto_op, (rect_op.x + 10, rect_op.centery - texto_op.get_height()//2))

    def tratar_clique(self, mouse_pos):
        if self.aberto:
            for i, rect in enumerate(self.rects_opcoes):
                if rect.collidepoint(mouse_pos):
                    self.indice_selecionado = i
                    self.aberto = False
                    return True # Mudou algo
            self.aberto = False # Clicou fora, fecha
            return False
        else:
            if self.rect.collidepoint(mouse_pos):
                self.aberto = True
                return False

# --- 3. ESTADOS E COMPONENTES ---
estado_atual = "menu"
opcoes_main = ["Host", "Jogar", "Compendio", "Personagens", "Opções", "Sair"]
indice_menu = 0
abas = ["Geral", "Gráficos", "Áudio"]
aba_selecionada = 0

mostrar_fps = False
vol_musica, vol_sfx = 0.5, 0.7

# Instanciando Componentes
slider_musica = Slider(300, vol_musica)
slider_sfx = Slider(300, vol_sfx)

dropdown_res = Dropdown(220, 40, ["1280x720", "1366x768", "1600x900", "1920x1080"], 0)
dropdown_modo = Dropdown(220, 40, ["Window", "Borderless", "Full Screen"], 0)

# --- 4. FUNÇÃO PARA APLICAR TELA ---
def aplicar_display():
    global LARGURA, ALTURA, tela
    res_str = dropdown_res.opcoes[dropdown_res.indice_selecionado]
    LARGURA, ALTURA = map(int, res_str.split('x'))
    
    modo_str = dropdown_modo.opcoes[dropdown_modo.indice_selecionado]
    flags = 0
    if modo_str == "Borderless":
        flags = pygame.NOFRAME
    elif modo_str == "Full Screen":
        flags = pygame.FULLSCREEN
    else:
        flags = pygame.RESIZABLE
        
    tela = pygame.display.set_mode((LARGURA, ALTURA), flags)

# --- 5. FUNÇÕES DE DESENHO ---
def desenhar_opcoes():
    tela.fill(PRETO)
    
    # Caixa Responsiva (se adapta à resolução)
    largura_box = min(1000, LARGURA - 100)
    altura_box = min(550, ALTURA - 100)
    box_rect = pygame.Rect((LARGURA//2 - largura_box//2, ALTURA//2 - altura_box//2 + 30), (largura_box, altura_box))
    
    pygame.draw.rect(tela, CINZA_ESCURO, box_rect, border_radius=10)
    pygame.draw.rect(tela, BRANCO, box_rect, 3, border_radius=10)
    
    # Seta Voltar
    surf_voltar = fonte.render("<", True, AMARELO)
    rect_voltar = surf_voltar.get_rect(topleft=(box_rect.left + 25, box_rect.top + 25))
    tela.blit(surf_voltar, rect_voltar)

    # Centralização Matemática Perfeita das 3 Abas
    centro_x = box_rect.centerx
    espacamento = 250
    # Calcula a posição de cada aba (Esquerda, Centro, Direita)
    posicoes_x = [centro_x - espacamento, centro_x, centro_x + espacamento]
    
    areas_abas = []
    for i, nome in enumerate(abas):
        cor = AMARELO if i == aba_selecionada else BRANCO
        surf_aba = fonte.render(nome, True, cor)
        rect_aba = surf_aba.get_rect(center=(posicoes_x[i], box_rect.top + 45))
        
        if i == aba_selecionada:
            pygame.draw.line(tela, AMARELO, (rect_aba.left, rect_aba.bottom), (rect_aba.right, rect_aba.bottom), 3)
            
        tela.blit(surf_aba, rect_aba)
        areas_abas.append(rect_aba)

    # Conteúdo Geral
    interativos = []
    if aba_selecionada == 0:
        tela.blit(fonte.render("Mostrar FPS:", True, BRANCO), (box_rect.left + 100, box_rect.top + 150))
        check_rect = pygame.Rect(box_rect.left + 400, box_rect.top + 155, 30, 30)
        pygame.draw.rect(tela, BRANCO, check_rect, 2)
        if mostrar_fps:
            pygame.draw.rect(tela, AMARELO, check_rect.inflate(-10, -10))
        interativos.append(("fps", check_rect))
        
    # Conteúdo Áudio
    elif aba_selecionada == 2:
        tela.blit(fonte.render("Música", True, BRANCO), (box_rect.left + 100, box_rect.top + 150))
        slider_musica.desenhar(tela, box_rect.left + 350, box_rect.top + 170)
        
        tela.blit(fonte.render("SFX", True, BRANCO), (box_rect.left + 100, box_rect.top + 250))
        slider_sfx.desenhar(tela, box_rect.left + 350, box_rect.top + 270)

    # Conteúdo Gráficos (Desenhado por último para o Dropdown ficar por cima de tudo)
    elif aba_selecionada == 1:
        tela.blit(fonte.render("Resolução:", True, BRANCO), (box_rect.left + 100, box_rect.top + 150))
        tela.blit(fonte.render("Modo de Tela:", True, BRANCO), (box_rect.left + 100, box_rect.top + 250))
        
        dropdown_res.desenhar(tela, box_rect.left + 400, box_rect.top + 150)
        dropdown_modo.desenhar(tela, box_rect.left + 400, box_rect.top + 250)

    return rect_voltar, areas_abas, interativos


# --- 6. LOOP PRINCIPAL ---
while True:
    mouse_pos = pygame.mouse.get_pos()
    mouse_clicado = pygame.mouse.get_pressed()[0]
    
    if estado_atual == "menu":
        tela.fill(PRETO)
        surf_titulo = fonte_titulo.render("VTT PROJECT", True, BRANCO)
        tela.blit(surf_titulo, surf_titulo.get_rect(center=(LARGURA // 2, 80)))
        
        for i, texto in enumerate(opcoes_main):
            cor = AMARELO if i == indice_menu else BRANCO
            txt_exibido = f"> {texto} <" if i == indice_menu else texto
            surf = fonte.render(txt_exibido, True, cor)
            tela.blit(surf, surf.get_rect(center=(LARGURA // 2, 220 + i * 70)))

    elif estado_atual == "opcoes":
        rect_voltar, areas_abas, interativos = desenhar_opcoes()
        
        # Atualização contínua de sliders
        if aba_selecionada == 2:
            if slider_musica.atualizar(mouse_pos, mouse_clicado):
                pygame.mixer.music.set_volume(slider_musica.valor)
            slider_sfx.atualizar(mouse_pos, mouse_clicado)

    if mostrar_fps:
        tela.blit(fonte_p.render(f"FPS: {int(relogio.get_fps())}", True, (0, 255, 0)), (10, 10))

    # --- PROCESSAMENTO DE EVENTOS ---
    for evento in pygame.event.get():
        if evento.type == pygame.QUIT:
            pygame.quit(); sys.exit()

        if evento.type == pygame.MOUSEBUTTONDOWN and evento.button == 1:
            if estado_atual == "menu":
                for i, texto in enumerate(opcoes_main):
                    rect = fonte.render(texto, True, BRANCO).get_rect(center=(LARGURA // 2, 220 + i * 70)).inflate(100, 20)
                    if rect.collidepoint(mouse_pos):
                        indice_menu = i
                        if texto == "Opções": estado_atual = "opcoes"
                        elif texto == "Sair": pygame.quit(); sys.exit()

            elif estado_atual == "opcoes":
                # Lógica de Interceptação de Clique (Se um Dropdown estiver aberto, ignora o resto)
                dropdown_aberto_interceptou = False
                
                if aba_selecionada == 1:
                    # Verifica Dropdown de Modo PRIMEIRO (ele fica embaixo do de resolução)
                    mudou_modo = dropdown_modo.tratar_clique(mouse_pos)
                    if mudou_modo: aplicar_display()
                    
                    # Verifica Dropdown de Resolução
                    mudou_res = dropdown_res.tratar_clique(mouse_pos)
                    if mudou_res: aplicar_display()
                    
                    dropdown_aberto_interceptou = dropdown_res.aberto or dropdown_modo.aberto

                # Só clica nas abas e botões se os dropdowns não estiverem abertos
                if not dropdown_aberto_interceptou:
                    if rect_voltar.collidepoint(mouse_pos):
                        estado_atual = "menu"
                    
                    for i, r in enumerate(areas_abas):
                        if r.collidepoint(mouse_pos):
                            aba_selecionada = i
                            
                    for tipo, rect in interativos:
                        if rect.collidepoint(mouse_pos) and tipo == "fps":
                            mostrar_fps = not mostrar_fps

        # Teclado Básico para o Menu
        if evento.type == pygame.KEYDOWN and estado_atual == "menu":
            if evento.key == pygame.K_UP and indice_menu > 0: indice_menu -= 1
            elif evento.key == pygame.K_DOWN and indice_menu < len(opcoes_main) - 1: indice_menu += 1
            elif evento.key in [pygame.K_RETURN, pygame.K_SPACE]:
                if opcoes_main[indice_menu] == "Opções": estado_atual = "opcoes"
                elif opcoes_main[indice_menu] == "Sair": pygame.quit(); sys.exit()

    pygame.display.flip()
    relogio.tick(60)
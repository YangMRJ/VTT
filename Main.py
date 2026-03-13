import pygame
import sys

# --- 1. CONFIGURAÇÕES E INICIALIZAÇÃO ---
pygame.init()
pygame.mixer.init()

LARGURA, ALTURA = 1280, 720
tela = pygame.display.set_mode((LARGURA, ALTURA), pygame.RESIZABLE)
pygame.display.set_caption("VTT Project")
relogio = pygame.time.Clock()

PRETO, BRANCO, AMARELO = (0, 0, 0), (255, 255, 255), (255, 255, 0)
CINZA_ESCURO, CINZA_CLARO = (40, 40, 40), (80, 80, 80)

# Fontes (Adicionada fonte menor para Dropdown)
try:
    fonte_dropdown = pygame.font.Font("Minecraft.ttf", 20)
    fonte_p = pygame.font.Font("Minecraft.ttf", 25)
    fonte = pygame.font.Font("Minecraft.ttf", 40)
    fonte_titulo = pygame.font.Font("Minecraft.ttf", 80)
except:
    fonte_dropdown = pygame.font.SysFont("Arial", 20, bold=True)
    fonte_p = pygame.font.SysFont("Arial", 25, bold=True)
    fonte = pygame.font.SysFont("Arial", 40, bold=True)
    fonte_titulo = pygame.font.SysFont("Arial", 80, bold=True)

# Carregando Sons (Verifique se os arquivos estão na pasta)
try:
    som_nav = pygame.mixer.Sound("nav.mp3")
    som_select = pygame.mixer.Sound("select.mp3")
    pygame.mixer.music.load("menu_theme.mp3")
    pygame.mixer.music.set_volume(0.5)
    pygame.mixer.music.play(-1)
except:
    som_nav = som_select = None
    print("Aviso: Sons não encontrados.")

# --- 2. CLASSES DE UI ---

class Slider:
    def __init__(self, largura, valor_inicial):
        self.rect = pygame.Rect(0, 0, largura, 10)
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
    def __init__(self, largura, altura, opcoes, max_visiveis=2):
        self.rect = pygame.Rect(0, 0, largura, altura)
        self.opcoes = opcoes
        self.indice_selecionado = 0
        self.aberto = False
        self.max_visiveis = max_visiveis
        self.scroll_offset = 0
        self.rects_opcoes = []

    def desenhar(self, tela, x, y):
        self.rect.topleft = (x, y)
        
        # Caixa Fechada
        pygame.draw.rect(tela, CINZA_CLARO, self.rect)
        pygame.draw.rect(tela, BRANCO, self.rect, 2)
        # Usando a fonte menor
        texto = fonte_dropdown.render(self.opcoes[self.indice_selecionado], True, BRANCO)
        tela.blit(texto, (self.rect.x + 10, self.rect.centery - texto.get_height()//2))
        
        seta = "V" if not self.aberto else "^"
        texto_seta = fonte_dropdown.render(seta, True, BRANCO)
        tela.blit(texto_seta, (self.rect.right - 25, self.rect.centery - texto_seta.get_height()//2))

        # Lista Aberta
        if self.aberto:
            self.rects_opcoes = []
            visiveis = min(self.max_visiveis, len(self.opcoes))
            lista_rect = pygame.Rect(self.rect.x, self.rect.bottom, self.rect.width, self.rect.height * visiveis)
            
            pygame.draw.rect(tela, CINZA_CLARO, lista_rect)
            pygame.draw.rect(tela, BRANCO, lista_rect, 2)

            for i in range(visiveis):
                indice_real = self.scroll_offset + i
                op = self.opcoes[indice_real]
                rect_op = pygame.Rect(self.rect.x, self.rect.bottom + i * self.rect.height, self.rect.width, self.rect.height)
                self.rects_opcoes.append((rect_op, indice_real)) 
                
                cor_fundo = AMARELO if rect_op.collidepoint(pygame.mouse.get_pos()) else CINZA_ESCURO
                cor_texto = PRETO if cor_fundo == AMARELO else BRANCO
                
                pygame.draw.rect(tela, cor_fundo, rect_op)
                pygame.draw.rect(tela, BRANCO, rect_op, 1)
                texto_op = fonte_dropdown.render(op, True, cor_texto)
                tela.blit(texto_op, (rect_op.x + 10, rect_op.centery - texto_op.get_height()//2))

            if len(self.opcoes) > self.max_visiveis:
                largura_scroll = 15
                scroll_rect = pygame.Rect(self.rect.right - largura_scroll, self.rect.bottom, largura_scroll, lista_rect.height)
                pygame.draw.rect(tela, CINZA_ESCURO, scroll_rect)
                pygame.draw.rect(tela, BRANCO, scroll_rect, 1)
                
                proporcao_thumb = self.max_visiveis / len(self.opcoes)
                altura_thumb = max(20, scroll_rect.height * proporcao_thumb)
                max_scroll = len(self.opcoes) - self.max_visiveis
                proporcao_posicao = self.scroll_offset / max_scroll if max_scroll > 0 else 0
                y_thumb = scroll_rect.y + (scroll_rect.height - altura_thumb) * proporcao_posicao
                pygame.draw.rect(tela, BRANCO, (scroll_rect.x, y_thumb, largura_scroll, altura_thumb))

    def rolar(self, direcao_y):
        if self.aberto and len(self.opcoes) > self.max_visiveis:
            self.scroll_offset -= direcao_y
            max_scroll = len(self.opcoes) - self.max_visiveis
            self.scroll_offset = max(0, min(self.scroll_offset, max_scroll))

    def tratar_clique(self, mouse_pos):
        if self.aberto:
            for rect, indice_real in self.rects_opcoes:
                if rect.collidepoint(mouse_pos):
                    self.indice_selecionado = indice_real
                    self.aberto = False
                    return True # Mudou opção
            
            visiveis = min(self.max_visiveis, len(self.opcoes))
            area_total = pygame.Rect(self.rect.x, self.rect.y, self.rect.width, self.rect.height * (visiveis + 1))
            if not area_total.collidepoint(mouse_pos):
                self.aberto = False
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

slider_musica = Slider(300, vol_musica)
slider_sfx = Slider(300, vol_sfx)

# Ajuste no tamanho dos dropdowns para casar com a fonte menor
dropdown_gui = Dropdown(180, 35, ["1.0x", "1.25x", "1.5x", "2.0x"], max_visiveis=3)
dropdown_res = Dropdown(180, 35, ["800x600", "1280x720", "1366x768", "1600x900", "1920x1080"], max_visiveis=3)
dropdown_modo = Dropdown(180, 35, ["Window", "Borderless", "Full Screen"], max_visiveis=3)

def aplicar_display():
    global LARGURA, ALTURA, tela
    res_str = dropdown_res.opcoes[dropdown_res.indice_selecionado]
    LARGURA, ALTURA = map(int, res_str.split('x'))
    modo_str = dropdown_modo.opcoes[dropdown_modo.indice_selecionado]
    
    flags = 0
    if modo_str == "Borderless": flags = pygame.NOFRAME
    elif modo_str == "Full Screen": flags = pygame.FULLSCREEN
    else: flags = pygame.RESIZABLE
        
    tela = pygame.display.set_mode((LARGURA, ALTURA), flags)

# --- 4. FUNÇÕES DE DESENHO ---
def desenhar_opcoes():
    tela.fill(PRETO)
    
    largura_box, altura_box = min(1000, LARGURA - 100), min(550, ALTURA - 100)
    box_rect = pygame.Rect((LARGURA//2 - largura_box//2, ALTURA//2 - altura_box//2 + 30), (largura_box, altura_box))
    
    pygame.draw.rect(tela, CINZA_ESCURO, box_rect, border_radius=10)
    pygame.draw.rect(tela, BRANCO, box_rect, 3, border_radius=10)
    
    rect_voltar = fonte.render("<", True, AMARELO).get_rect(topleft=(box_rect.left + 25, box_rect.top + 25))
    tela.blit(fonte.render("<", True, AMARELO), rect_voltar)

    posicoes_x = [box_rect.centerx - 250, box_rect.centerx, box_rect.centerx + 250]
    areas_abas = []
    for i, nome in enumerate(abas):
        cor = AMARELO if i == aba_selecionada else BRANCO
        surf_aba = fonte.render(nome, True, cor)
        rect_aba = surf_aba.get_rect(center=(posicoes_x[i], box_rect.top + 45))
        if i == aba_selecionada:
            pygame.draw.line(tela, AMARELO, (rect_aba.left, rect_aba.bottom), (rect_aba.right, rect_aba.bottom), 3)
        tela.blit(surf_aba, rect_aba)
        areas_abas.append(rect_aba)

    interativos = []
    if aba_selecionada == 0:
        # Checkbox FPS
        tela.blit(fonte.render("Mostrar FPS:", True, BRANCO), (box_rect.left + 100, box_rect.top + 150))
        check_rect = pygame.Rect(box_rect.left + 400, box_rect.top + 155, 30, 30)
        pygame.draw.rect(tela, BRANCO, check_rect, 2)
        if mostrar_fps: pygame.draw.rect(tela, AMARELO, check_rect.inflate(-10, -10))
        interativos.append(("fps", check_rect))
        
        # GUI Scale (Aumentada a distância)
        tela.blit(fonte.render("GUI Scale:", True, BRANCO), (box_rect.left + 100, box_rect.top + 300))
        dropdown_gui.desenhar(tela, box_rect.left + 400, box_rect.top + 300)
        
    elif aba_selecionada == 2:
        tela.blit(fonte.render("Música", True, BRANCO), (box_rect.left + 100, box_rect.top + 150))
        slider_musica.desenhar(tela, box_rect.left + 350, box_rect.top + 170)
        tela.blit(fonte.render("SFX", True, BRANCO), (box_rect.left + 100, box_rect.top + 300))
        slider_sfx.desenhar(tela, box_rect.left + 350, box_rect.top + 320)

    elif aba_selecionada == 1:
        # Aumentada a distância vertical (Y=150 para Res, Y=300 para Modo)
        tela.blit(fonte.render("Resolução:", True, BRANCO), (box_rect.left + 100, box_rect.top + 150))
        tela.blit(fonte.render("Modo de Tela:", True, BRANCO), (box_rect.left + 100, box_rect.top + 300))
        
        dropdown_modo.desenhar(tela, box_rect.left + 400, box_rect.top + 300)
        dropdown_res.desenhar(tela, box_rect.left + 400, box_rect.top + 150)

    return rect_voltar, areas_abas, interativos


# --- 5. LOOP PRINCIPAL ---
while True:
    mouse_pos = pygame.mouse.get_pos()
    mouse_clicado = pygame.mouse.get_pressed()[0]
    
    if estado_atual == "menu":
        tela.fill(PRETO)
        surf_titulo = fonte_titulo.render("VTT PROJECT", True, BRANCO)
        tela.blit(surf_titulo, surf_titulo.get_rect(center=(LARGURA // 2, 80)))
        for i, texto in enumerate(opcoes_main):
            cor = AMARELO if i == indice_menu else BRANCO
            txt = f"> {texto} <" if i == indice_menu else texto
            tela.blit(fonte.render(txt, True, cor), fonte.render(txt, True, cor).get_rect(center=(LARGURA // 2, 220 + i * 70)))

    elif estado_atual == "opcoes":
        rect_voltar, areas_abas, interativos = desenhar_opcoes()
        
        # --- ATUALIZAÇÃO DO ÁUDIO EM TEMPO REAL ---
        if aba_selecionada == 2:
            if slider_musica.atualizar(mouse_pos, mouse_clicado):
                pygame.mixer.music.set_volume(slider_musica.valor)
            if slider_sfx.atualizar(mouse_pos, mouse_clicado):
                vol_sfx = slider_sfx.valor
                if som_nav: som_nav.set_volume(vol_sfx)
                if som_select: som_select.set_volume(vol_sfx)

    if mostrar_fps:
        tela.blit(fonte_p.render(f"FPS: {int(relogio.get_fps())}", True, (0, 255, 0)), (10, 10))

    for evento in pygame.event.get():
        if evento.type == pygame.QUIT:
            pygame.quit(); sys.exit()
            
        if evento.type == pygame.MOUSEWHEEL:
            if estado_atual == "opcoes":
                if aba_selecionada == 0: dropdown_gui.rolar(evento.y)
                elif aba_selecionada == 1:
                    dropdown_res.rolar(evento.y)
                    dropdown_modo.rolar(evento.y)

        if evento.type == pygame.MOUSEBUTTONDOWN and evento.button == 1:
            if estado_atual == "menu":
                for i, texto in enumerate(opcoes_main):
                    if fonte.render(texto, True, BRANCO).get_rect(center=(LARGURA // 2, 220 + i * 70)).inflate(100, 20).collidepoint(mouse_pos):
                        indice_menu = i
                        if som_select: som_select.play() # Som restaurado aqui
                        if texto == "Opções": estado_atual = "opcoes"
                        elif texto == "Sair": pygame.quit(); sys.exit()

            elif estado_atual == "opcoes":
                dropdown_aberto_interceptou = False
                
                # --- LÓGICA DE EXCLUSIVIDADE DOS DROPDOWNS ---
                if aba_selecionada == 0:
                    if dropdown_gui.aberto:
                        if dropdown_gui.tratar_clique(mouse_pos) and som_select: som_select.play()
                        dropdown_aberto_interceptou = True
                    elif dropdown_gui.rect.collidepoint(mouse_pos):
                        dropdown_gui.tratar_clique(mouse_pos)
                        dropdown_aberto_interceptou = True
                        if som_select: som_select.play()

                elif aba_selecionada == 1:
                    # Se o de cima está aberto, manda o clique só pra ele
                    if dropdown_res.aberto:
                        if dropdown_res.tratar_clique(mouse_pos): 
                            if som_select: som_select.play()
                            aplicar_display()
                        dropdown_aberto_interceptou = True
                    # Senão, se o de baixo está aberto, manda pra ele
                    elif dropdown_modo.aberto:
                        if dropdown_modo.tratar_clique(mouse_pos): 
                            if som_select: som_select.play()
                            aplicar_display()
                        dropdown_aberto_interceptou = True
                    # Se nenhum está aberto, verifica em qual clicou (cima tem prioridade)
                    else:
                        if dropdown_res.rect.collidepoint(mouse_pos):
                            dropdown_res.tratar_clique(mouse_pos)
                            dropdown_aberto_interceptou = True
                            if som_select: som_select.play()
                        elif dropdown_modo.rect.collidepoint(mouse_pos):
                            dropdown_modo.tratar_clique(mouse_pos)
                            dropdown_aberto_interceptou = True
                            if som_select: som_select.play()

                # Se nenhum dropdown roubou o clique, testa o resto (botão voltar, abas, checkbox)
                if not dropdown_aberto_interceptou:
                    if rect_voltar.collidepoint(mouse_pos):
                        if som_select: som_select.play()
                        estado_atual = "menu"
                    
                    for i, r in enumerate(areas_abas):
                        if r.collidepoint(mouse_pos):
                            if aba_selecionada != i and som_select: som_select.play()
                            aba_selecionada = i
                            
                    for tipo, rect in interativos:
                        if rect.collidepoint(mouse_pos) and tipo == "fps":
                            if som_select: som_select.play()
                            mostrar_fps = not mostrar_fps

        if evento.type == pygame.KEYDOWN and estado_atual == "menu":
            if evento.key == pygame.K_UP and indice_menu > 0: indice_menu -= 1
            elif evento.key == pygame.K_DOWN and indice_menu < len(opcoes_main) - 1: indice_menu += 1
            elif evento.key in [pygame.K_RETURN, pygame.K_SPACE]:
                if som_select: som_select.play()
                if opcoes_main[indice_menu] == "Opções": estado_atual = "opcoes"
                elif opcoes_main[indice_menu] == "Sair": pygame.quit(); sys.exit()

    pygame.display.flip()
    relogio.tick(60)
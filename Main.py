import pygame
import sys

# --- 1. CONFIGURAÇÕES E INICIALIZAÇÃO ---
pygame.init()
pygame.mixer.init()

LARGURA, ALTURA = 1280, 720
tela = pygame.display.set_mode((LARGURA, ALTURA), pygame.RESIZABLE)
pygame.display.set_caption("VTT Project")
relogio = pygame.time.Clock()

BASE_W, BASE_H = 1280, 720
tela_virtual = pygame.Surface((BASE_W, BASE_H))

PRETO, BRANCO, AMARELO = (0, 0, 0), (255, 255, 255), (255, 255, 0)
CINZA_ESCURO, CINZA_CLARO = (40, 40, 40), (80, 80, 80)

# Gerenciador de Fontes Dinâmico
escala_fonte_atual = -1
fonte_dropdown = fonte_p = fonte = fonte_titulo = None

def carregar_fontes(escala):
    global fonte_dropdown, fonte_p, fonte, fonte_titulo, escala_fonte_atual
    if escala == escala_fonte_atual: return # Evita recarregar sem necessidade
    escala_fonte_atual = escala
    
    try:
        fonte_dropdown = pygame.font.Font("Minecraft.ttf", max(10, int(20 * escala)))
        fonte_p = pygame.font.Font("Minecraft.ttf", max(12, int(25 * escala)))
        fonte = pygame.font.Font("Minecraft.ttf", max(16, int(40 * escala)))
        fonte_titulo = pygame.font.Font("Minecraft.ttf", max(30, int(80 * escala)))
    except:
        fonte_dropdown = pygame.font.SysFont("Arial", max(10, int(20 * escala)), bold=True)
        fonte_p = pygame.font.SysFont("Arial", max(12, int(25 * escala)), bold=True)
        fonte = pygame.font.SysFont("Arial", max(16, int(40 * escala)), bold=True)
        fonte_titulo = pygame.font.SysFont("Arial", max(30, int(80 * escala)), bold=True)

# Carrega a fonte inicial (Escala 1.0)
carregar_fontes(1.0)

try:
    som_nav = pygame.mixer.Sound("nav.mp3")
    som_select = pygame.mixer.Sound("select.mp3")
    pygame.mixer.music.load("menu_theme.mp3")
    pygame.mixer.music.set_volume(0.5)
    pygame.mixer.music.play(-1)
except:
    som_nav = som_select = None

# --- 2. CLASSES DE UI ---

class Slider:
    def __init__(self, largura, min_val, max_val, valor_inicial, tipo="int"):
        self.largura = largura
        self.min_val = min_val
        self.max_val = max_val
        self.valor = valor_inicial
        self.tipo = tipo # "int" (0-100) ou "float" (0.5-2.0)
        
        self.rect = pygame.Rect(0, 0, largura, 10)
        self.rect_texto = pygame.Rect(0, 0, 70, 35) # Caixa de input
        self.editando = False
        self.texto_input = ""

    def obter_pos_x(self):
        proporcao = (self.valor - self.min_val) / (self.max_val - self.min_val)
        return self.rect.x + (self.largura * proporcao)

    def desenhar(self, surface, x, y):
        self.rect.topleft = (x, y)
        self.rect_texto.midleft = (self.rect.right + 20, self.rect.centery)
        
        # Desenha a trilha
        pygame.draw.rect(surface, CINZA_CLARO, self.rect)
        
        # Desenha o Thumb Pixelado (Cruz/Octógono em vez de círculo perfeito)
        cx, cy = int(self.obter_pos_x()), self.rect.centery
        r = 10
        pygame.draw.rect(surface, AMARELO, (cx - r, cy - r + 4, r*2, r*2 - 8))
        pygame.draw.rect(surface, AMARELO, (cx - r + 4, cy - r, r*2 - 8, r*2))
        
        # Desenha a caixa de texto
        cor_caixa = AMARELO if self.editando else BRANCO
        pygame.draw.rect(surface, PRETO, self.rect_texto)
        pygame.draw.rect(surface, cor_caixa, self.rect_texto, 2)
        
        txt_exibir = self.texto_input if self.editando else (f"{int(self.valor)}" if self.tipo == "int" else f"{self.valor:.1f}")
        surf_txt = fonte_dropdown.render(txt_exibir, True, cor_caixa)
        surface.blit(surf_txt, surf_txt.get_rect(center=self.rect_texto.center))

    def atualizar(self, mouse_pos, clique):
        # Arrastar o slider (só funciona se não estiver digitando)
        if clique and self.rect.inflate(0, 30).collidepoint(mouse_pos) and not self.editando:
            novo_x = max(self.rect.left, min(mouse_pos[0], self.rect.right))
            proporcao = (novo_x - self.rect.left) / self.largura
            self.valor = self.min_val + proporcao * (self.max_val - self.min_val)
            if self.tipo == "int": self.valor = round(self.valor)
            return True
        return False

    def tratar_clique(self, mouse_pos):
        # Clicar na caixinha para digitar
        if self.rect_texto.collidepoint(mouse_pos):
            self.editando = True
            self.texto_input = ""
            return True
        else:
            if self.editando: self.confirmar_texto()
            self.editando = False
        return False

    def tratar_teclado(self, evento):
        if not self.editando: return False
        
        if evento.key == pygame.K_RETURN:
            self.confirmar_texto()
            self.editando = False
        elif evento.key == pygame.K_BACKSPACE:
            self.texto_input = self.texto_input[:-1]
        else:
            char = evento.unicode
            # Aceita apenas números e ponto
            if char.isdigit() or (char == '.' and self.tipo == "float"):
                self.texto_input += char
        return True # Interceptou o teclado

    def confirmar_texto(self):
        try:
            if self.texto_input.strip() != "":
                novo_val = float(self.texto_input)
                self.valor = max(self.min_val, min(self.max_val, novo_val))
                if self.tipo == "int": self.valor = round(self.valor)
        except: pass

class Dropdown:
    def __init__(self, largura, altura, opcoes, indice_inicial=0, max_visiveis=2):
        self.rect = pygame.Rect(0, 0, largura, altura)
        self.opcoes = opcoes
        self.indice_selecionado = indice_inicial
        self.aberto = False
        self.max_visiveis = max_visiveis
        self.scroll_offset = 0
        self.rects_opcoes = []

    def desenhar(self, surface, x, y, mouse_pos):
        self.rect.topleft = (x, y)
        pygame.draw.rect(surface, CINZA_CLARO, self.rect)
        pygame.draw.rect(surface, BRANCO, self.rect, 2)
        texto = fonte_dropdown.render(self.opcoes[self.indice_selecionado], True, BRANCO)
        surface.blit(texto, (self.rect.x + 10, self.rect.centery - texto.get_height()//2))
        
        seta = "V" if not self.aberto else "^"
        texto_seta = fonte_dropdown.render(seta, True, BRANCO)
        surface.blit(texto_seta, (self.rect.right - 25, self.rect.centery - texto_seta.get_height()//2))

        if self.aberto:
            self.rects_opcoes = []
            visiveis = min(self.max_visiveis, len(self.opcoes))
            lista_rect = pygame.Rect(self.rect.x, self.rect.bottom, self.rect.width, self.rect.height * visiveis)
            pygame.draw.rect(surface, CINZA_CLARO, lista_rect)
            pygame.draw.rect(surface, BRANCO, lista_rect, 2)

            for i in range(visiveis):
                indice_real = self.scroll_offset + i
                op = self.opcoes[indice_real]
                rect_op = pygame.Rect(self.rect.x, self.rect.bottom + i * self.rect.height, self.rect.width, self.rect.height)
                self.rects_opcoes.append((rect_op, indice_real)) 
                
                cor_fundo = AMARELO if rect_op.collidepoint(mouse_pos) else CINZA_ESCURO
                cor_texto = PRETO if cor_fundo == AMARELO else BRANCO
                pygame.draw.rect(surface, cor_fundo, rect_op)
                pygame.draw.rect(surface, BRANCO, rect_op, 1)
                texto_op = fonte_dropdown.render(op, True, cor_texto)
                surface.blit(texto_op, (rect_op.x + 10, rect_op.centery - texto_op.get_height()//2))

            if len(self.opcoes) > self.max_visiveis:
                largura_scroll = 15
                scroll_rect = pygame.Rect(self.rect.right - largura_scroll, self.rect.bottom, largura_scroll, lista_rect.height)
                pygame.draw.rect(surface, CINZA_ESCURO, scroll_rect)
                pygame.draw.rect(surface, BRANCO, scroll_rect, 1)
                proporcao_thumb = self.max_visiveis / len(self.opcoes)
                altura_thumb = max(20, scroll_rect.height * proporcao_thumb)
                max_scroll = len(self.opcoes) - self.max_visiveis
                proporcao_posicao = self.scroll_offset / max_scroll if max_scroll > 0 else 0
                y_thumb = scroll_rect.y + (scroll_rect.height - altura_thumb) * proporcao_posicao
                pygame.draw.rect(surface, BRANCO, (scroll_rect.x, y_thumb, largura_scroll, altura_thumb))

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
                    return True
            visiveis = min(self.max_visiveis, len(self.opcoes))
            area_total = pygame.Rect(self.rect.x, self.rect.y, self.rect.width, self.rect.height * (visiveis + 1))
            if not area_total.collidepoint(mouse_pos): self.aberto = False
            return False
        else:
            if self.rect.collidepoint(mouse_pos):
                self.aberto = True
                return False

# --- 3. ESTADOS E COMPONENTES ---
estado_atual = "menu"
opcoes_main = ["Host", "Jogar", "Compendio", "Personagens", "Opções", "Sair"]
indice_menu, indice_hover = 0, -1
abas = ["Geral", "Gráficos", "Áudio"]
aba_selecionada = 0
mostrar_fps = False
gui_scale = 1.0

# Sliders (Largura, Mínimo, Máximo, Inicial, Tipo)
slider_musica = Slider(250, 0, 100, 50, "int")
slider_sfx = Slider(250, 0, 100, 70, "int")
slider_fonte = Slider(250, 0.5, 2.0, 1.0, "float")
todos_os_sliders = [slider_musica, slider_sfx, slider_fonte]

dropdown_gui = Dropdown(180, 35, ["0.5x", "1.0x", "1.5x", "2.0x"], indice_inicial=1, max_visiveis=2)
dropdown_res = Dropdown(180, 35, ["800x600", "1280x720", "1366x768", "1600x900", "1920x1080"], indice_inicial=1, max_visiveis=2)
dropdown_modo = Dropdown(180, 35, ["Window", "Borderless", "Full Screen"], indice_inicial=0, max_visiveis=2)

def aplicar_display():
    global LARGURA, ALTURA, tela
    res_str = dropdown_res.opcoes[dropdown_res.indice_selecionado]
    LARGURA, ALTURA = map(int, res_str.split('x'))
    modo_str = dropdown_modo.opcoes[dropdown_modo.indice_selecionado]
    
    flags = pygame.NOFRAME if modo_str == "Borderless" else pygame.FULLSCREEN if modo_str == "Full Screen" else pygame.RESIZABLE
    tela = pygame.display.set_mode((LARGURA, ALTURA), flags)


# --- 4. FUNÇÕES DE DESENHO DA TELA VIRTUAL ---
def desenhar_opcoes(mouse_pos):
    tela_virtual.fill(PRETO)
    largura_box, altura_box = 1000, 550
    box_rect = pygame.Rect((BASE_W//2 - largura_box//2, BASE_H//2 - altura_box//2 + 30), (largura_box, altura_box))
    
    pygame.draw.rect(tela_virtual, CINZA_ESCURO, box_rect, border_radius=10)
    pygame.draw.rect(tela_virtual, BRANCO, box_rect, 3, border_radius=10)
    
    rect_voltar = fonte.render("<", True, AMARELO).get_rect(topleft=(box_rect.left + 25, box_rect.top + 25))
    tela_virtual.blit(fonte.render("<", True, AMARELO), rect_voltar)

    posicoes_x = [box_rect.centerx - 250, box_rect.centerx, box_rect.centerx + 250]
    areas_abas = []
    for i, nome in enumerate(abas):
        cor = AMARELO if i == aba_selecionada else BRANCO
        surf_aba = fonte.render(nome, True, cor)
        rect_aba = surf_aba.get_rect(center=(posicoes_x[i], box_rect.top + 45))
        if i == aba_selecionada:
            pygame.draw.line(tela_virtual, AMARELO, (rect_aba.left, rect_aba.bottom), (rect_aba.right, rect_aba.bottom), 3)
        tela_virtual.blit(surf_aba, rect_aba)
        areas_abas.append(rect_aba)

    interativos = []
    if aba_selecionada == 0:
        # FPS
        tela_virtual.blit(fonte_p.render("Mostrar FPS:", True, BRANCO), (box_rect.left + 100, box_rect.top + 120))
        check_rect = pygame.Rect(box_rect.left + 350, box_rect.top + 120, 30, 30)
        pygame.draw.rect(tela_virtual, BRANCO, check_rect, 2)
        if mostrar_fps: pygame.draw.rect(tela_virtual, AMARELO, check_rect.inflate(-10, -10))
        interativos.append(("fps", check_rect))
        
        # GUI
        tela_virtual.blit(fonte_p.render("GUI Scale:", True, BRANCO), (box_rect.left + 100, box_rect.top + 220))
        dropdown_gui.desenhar(tela_virtual, box_rect.left + 350, box_rect.top + 215, mouse_pos)
        
        # FONTE
        tela_virtual.blit(fonte_p.render("Tamanho Fonte:", True, BRANCO), (box_rect.left + 100, box_rect.top + 320))
        slider_fonte.desenhar(tela_virtual, box_rect.left + 350, box_rect.top + 330)

    elif aba_selecionada == 2:
        tela_virtual.blit(fonte_p.render("Música", True, BRANCO), (box_rect.left + 100, box_rect.top + 150))
        slider_musica.desenhar(tela_virtual, box_rect.left + 350, box_rect.top + 160)
        
        tela_virtual.blit(fonte_p.render("SFX", True, BRANCO), (box_rect.left + 100, box_rect.top + 250))
        slider_sfx.desenhar(tela_virtual, box_rect.left + 350, box_rect.top + 260)

    elif aba_selecionada == 1:
        tela_virtual.blit(fonte_p.render("Resolução:", True, BRANCO), (box_rect.left + 100, box_rect.top + 150))
        dropdown_res.desenhar(tela_virtual, box_rect.left + 350, box_rect.top + 145, mouse_pos)
        
        tela_virtual.blit(fonte_p.render("Modo de Tela:", True, BRANCO), (box_rect.left + 100, box_rect.top + 250))
        dropdown_modo.desenhar(tela_virtual, box_rect.left + 350, box_rect.top + 245, mouse_pos)

    return rect_voltar, areas_abas, interativos


# --- 5. LOOP PRINCIPAL ---
while True:
    real_mouse_pos = pygame.mouse.get_pos()
    mouse_clicado = pygame.mouse.get_pressed()[0]
    
    scaled_w, scaled_h = int(BASE_W * gui_scale), int(BASE_H * gui_scale)
    offset_x, offset_y = LARGURA//2 - scaled_w//2, ALTURA//2 - scaled_h//2
    
    # Mapeia o mouse da tela real para a virtual
    v_mouse_x = (real_mouse_pos[0] - offset_x) / gui_scale
    v_mouse_y = (real_mouse_pos[1] - offset_y) / gui_scale
    mouse_pos = (v_mouse_x, v_mouse_y) 
    
    # 5.1 Atualiza Fontes se o slider mudar
    carregar_fontes(slider_fonte.valor)

    # 5.2 RENDERIZAÇÃO DA INTERFACE VIRTUAL
    if estado_atual == "menu":
        tela_virtual.fill(PRETO)
        surf_titulo = fonte_titulo.render("VTT PROJECT", True, BRANCO)
        tela_virtual.blit(surf_titulo, surf_titulo.get_rect(center=(BASE_W // 2, 80)))
        
        novo_hover = -1
        for i, texto in enumerate(opcoes_main):
            rect_teste = fonte.render(texto, True, BRANCO).get_rect(center=(BASE_W // 2, 220 + i * 70)).inflate(100, 20)
            if rect_teste.collidepoint(mouse_pos): novo_hover = i
            
            cor = AMARELO if i == indice_menu else BRANCO
            txt = f"> {texto} <" if i == indice_menu else texto
            tela_virtual.blit(fonte.render(txt, True, cor), fonte.render(txt, True, cor).get_rect(center=(BASE_W // 2, 220 + i * 70)))
        
        if novo_hover != -1 and novo_hover != indice_hover and novo_hover != indice_menu:
            indice_menu = novo_hover
            if som_nav: som_nav.play()
        indice_hover = novo_hover

    elif estado_atual == "opcoes":
        rect_voltar, areas_abas, interativos = desenhar_opcoes(mouse_pos)
        
        # Atualiza Sliders (Arrastar)
        if aba_selecionada == 2:
            if slider_musica.atualizar(mouse_pos, mouse_clicado): pygame.mixer.music.set_volume(slider_musica.valor / 100)
            if slider_sfx.atualizar(mouse_pos, mouse_clicado):
                if som_nav: som_nav.set_volume(slider_sfx.valor / 100)
                if som_select: som_select.set_volume(slider_sfx.valor / 100)
        elif aba_selecionada == 0:
            slider_fonte.atualizar(mouse_pos, mouse_clicado)

    # 5.3 ESCALA E DESENHO NA TELA REAL
    tela.fill(PRETO)
    surf_scaled = pygame.transform.scale(tela_virtual, (scaled_w, scaled_h))
    tela.blit(surf_scaled, (offset_x, offset_y))

    # O FPS AGORA É DESENHADO DIRETAMENTE NA TELA REAL (Nunca escala e fica travado no canto)
    if mostrar_fps:
        fps_txt = fonte_p.render(f"FPS: {int(relogio.get_fps())}", True, (0, 255, 0))
        tela.blit(fps_txt, (10, 10))

    # --- PROCESSAMENTO DE EVENTOS ---
    for evento in pygame.event.get():
        if evento.type == pygame.QUIT:
            pygame.quit(); sys.exit()
            
        if evento.type == pygame.MOUSEWHEEL and estado_atual == "opcoes":
            if aba_selecionada == 0: dropdown_gui.rolar(evento.y)
            elif aba_selecionada == 1:
                dropdown_res.rolar(evento.y)
                dropdown_modo.rolar(evento.y)

        if evento.type == pygame.KEYDOWN:
            # Tenta mandar a tecla para os sliders de texto primeiro
            tecla_interceptada = False
            for s in todos_os_sliders:
                if s.tratar_teclado(evento):
                    tecla_interceptada = True
                    # Se confirmou no áudio, já atualiza o sistema
                    if not s.editando: 
                        if s == slider_musica: pygame.mixer.music.set_volume(s.valor / 100)
                        elif s == slider_sfx and som_select: som_select.set_volume(s.valor / 100)
            
            # Se ninguém estiver digitando, navega no menu normal
            if not tecla_interceptada and estado_atual == "menu":
                indice_antigo = indice_menu
                if evento.key == pygame.K_UP and indice_menu > 0: indice_menu -= 1
                elif evento.key == pygame.K_DOWN and indice_menu < len(opcoes_main) - 1: indice_menu += 1
                if indice_menu != indice_antigo and som_nav: som_nav.play()

                if evento.key in [pygame.K_RETURN, pygame.K_SPACE]:
                    if som_select: som_select.play()
                    if opcoes_main[indice_menu] == "Opções": estado_atual = "opcoes"
                    elif opcoes_main[indice_menu] == "Sair": pygame.quit(); sys.exit()

        if evento.type == pygame.MOUSEBUTTONDOWN and evento.button == 1:
            # Trata clique nas caixas de texto dos sliders primeiro
            clicou_em_texto = False
            if estado_atual == "opcoes":
                sliders_aba = []
                if aba_selecionada == 0: sliders_aba = [slider_fonte]
                elif aba_selecionada == 2: sliders_aba = [slider_musica, slider_sfx]
                
                for s in sliders_aba:
                    if s.tratar_clique(mouse_pos):
                        clicou_em_texto = True
                        if som_select: som_select.play()
                    # Atualiza áudio se acabou de confirmar clicando fora
                    if not s.editando:
                        if s == slider_musica: pygame.mixer.music.set_volume(s.valor / 100)
                        elif s == slider_sfx and som_select: som_select.set_volume(s.valor / 100)
            
            if clicou_em_texto: continue # Se clicou num input de texto, ignora o resto

            if estado_atual == "menu":
                for i, texto in enumerate(opcoes_main):
                    if fonte.render(texto, True, BRANCO).get_rect(center=(BASE_W // 2, 220 + i * 70)).inflate(100, 20).collidepoint(mouse_pos):
                        if som_select: som_select.play()
                        if texto == "Opções": estado_atual = "opcoes"
                        elif texto == "Sair": pygame.quit(); sys.exit()

            elif estado_atual == "opcoes":
                dropdown_aberto_interceptou = False
                if aba_selecionada == 0:
                    if dropdown_gui.aberto:
                        if dropdown_gui.tratar_clique(mouse_pos):
                            if som_select: som_select.play()
                            gui_scale = float(dropdown_gui.opcoes[dropdown_gui.indice_selecionado].replace("x", ""))
                        dropdown_aberto_interceptou = True
                    elif dropdown_gui.rect.collidepoint(mouse_pos):
                        dropdown_gui.tratar_clique(mouse_pos)
                        dropdown_aberto_interceptou = True
                        if som_select: som_select.play()
                elif aba_selecionada == 1:
                    if dropdown_res.aberto:
                        if dropdown_res.tratar_clique(mouse_pos): 
                            if som_select: som_select.play()
                            aplicar_display()
                        dropdown_aberto_interceptou = True
                    elif dropdown_modo.aberto:
                        if dropdown_modo.tratar_clique(mouse_pos): 
                            if som_select: som_select.play()
                            aplicar_display()
                        dropdown_aberto_interceptou = True
                    else:
                        if dropdown_res.rect.collidepoint(mouse_pos):
                            dropdown_res.tratar_clique(mouse_pos); dropdown_aberto_interceptou = True
                            if som_select: som_select.play()
                        elif dropdown_modo.rect.collidepoint(mouse_pos):
                            dropdown_modo.tratar_clique(mouse_pos); dropdown_aberto_interceptou = True
                            if som_select: som_select.play()

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

    pygame.display.flip()
    relogio.tick(60)
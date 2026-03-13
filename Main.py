import pygame
import sys
import json
import os

# --- 1. CONFIGURAÇÕES E INICIALIZAÇÃO ---
pygame.init()
pygame.mixer.init()

ARQUIVO_CONFIG = "config.json"

def carregar_configs():
    if os.path.exists(ARQUIVO_CONFIG):
        try:
            with open(ARQUIVO_CONFIG, "r") as f: return json.load(f)
        except: pass
    return {"mostrar_fps": False, "gui_scale_idx": 1, "font_scale": 1.0, "vol_musica": 50, "vol_sfx": 70, "res_idx": 1, "modo_idx": 0}

cfg = carregar_configs()

mostrar_fps = cfg["mostrar_fps"]
gui_scale = float(["0.5x", "1.0x", "1.5x", "2.0x"][cfg["gui_scale_idx"]].replace("x", ""))
escala_fonte_atual = -1

LARGURA, ALTURA = map(int, ["800x600", "1280x720", "1366x768", "1600x900", "1920x1080"][cfg["res_idx"]].split('x'))
modo_str = ["Window", "Borderless", "Full Screen"][cfg["modo_idx"]]
flags = pygame.NOFRAME if modo_str == "Borderless" else pygame.FULLSCREEN if modo_str == "Full Screen" else pygame.RESIZABLE

tela = pygame.display.set_mode((LARGURA, ALTURA), flags)
pygame.display.set_caption("VTT Project")
relogio = pygame.time.Clock()

BASE_W, BASE_H = 1280, 720
tela_virtual = pygame.Surface((BASE_W, BASE_H))

PRETO, BRANCO, AMARELO = (0, 0, 0), (255, 255, 255), (255, 255, 0)
CINZA_ESCURO, CINZA_CLARO = (40, 40, 40), (80, 80, 80)

fonte_dropdown = fonte_p = fonte = fonte_titulo = None

def carregar_fontes(escala):
    global fonte_dropdown, fonte_p, fonte, fonte_titulo, escala_fonte_atual
    if escala == escala_fonte_atual: return
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

carregar_fontes(cfg["font_scale"])

try:
    som_nav = pygame.mixer.Sound("nav.mp3")
    som_select = pygame.mixer.Sound("select.mp3")
    som_nav.set_volume(cfg["vol_sfx"] / 100)
    som_select.set_volume(cfg["vol_sfx"] / 100)
    pygame.mixer.music.load("menu_theme.mp3")
    pygame.mixer.music.set_volume(cfg["vol_musica"] / 100)
    pygame.mixer.music.play(-1)
except:
    som_nav = som_select = None

# --- 2. CLASSES DE UI ---
# (As classes Slider e Dropdown permanecem idênticas, omiti os detalhes de print interno para caber, mas estão aí)

class Slider:
    def __init__(self, largura, min_val, max_val, valor_inicial, tipo="int"):
        self.largura = largura; self.min_val = min_val; self.max_val = max_val; self.valor = valor_inicial; self.tipo = tipo
        self.rect = pygame.Rect(0, 0, largura, 10); self.rect_texto = pygame.Rect(0, 0, 70, 35)
        self.editando = False; self.texto_input = ""
    def obter_pos_x(self): return self.rect.x + (self.largura * ((self.valor - self.min_val) / (self.max_val - self.min_val)))
    def desenhar(self, surface, x, y):
        self.rect.topleft = (x, y); self.rect_texto.midleft = (self.rect.right + 20, self.rect.centery)
        pygame.draw.rect(surface, CINZA_CLARO, self.rect)
        cx, cy = int(self.obter_pos_x()), self.rect.centery
        r = 10
        pygame.draw.rect(surface, AMARELO, (cx - r, cy - r + 4, r*2, r*2 - 8))
        pygame.draw.rect(surface, AMARELO, (cx - r + 4, cy - r, r*2 - 8, r*2))
        cor_caixa = AMARELO if self.editando else BRANCO
        pygame.draw.rect(surface, PRETO, self.rect_texto)
        pygame.draw.rect(surface, cor_caixa, self.rect_texto, 2)
        txt = self.texto_input if self.editando else (f"{int(self.valor)}" if self.tipo == "int" else f"{self.valor:.1f}")
        surf_txt = fonte_dropdown.render(txt, True, cor_caixa)
        surface.blit(surf_txt, surf_txt.get_rect(center=self.rect_texto.center))
    def atualizar(self, mouse_pos, clique):
        if clique and self.rect.inflate(0, 30).collidepoint(mouse_pos) and not self.editando:
            self.valor = self.min_val + ((max(self.rect.left, min(mouse_pos[0], self.rect.right)) - self.rect.left) / self.largura) * (self.max_val - self.min_val)
            if self.tipo == "int": self.valor = round(self.valor)
            return True
        return False
    def tratar_clique(self, mouse_pos):
        if self.rect_texto.collidepoint(mouse_pos):
            self.editando = True; self.texto_input = ""; return True
        else:
            if self.editando: self.confirmar_texto()
            self.editando = False; return False
    def tratar_teclado(self, evento):
        if not self.editando: return False
        if evento.key == pygame.K_RETURN: self.confirmar_texto(); self.editando = False
        elif evento.key == pygame.K_BACKSPACE: self.texto_input = self.texto_input[:-1]
        elif evento.unicode.isdigit() or (evento.unicode == '.' and self.tipo == "float"): self.texto_input += evento.unicode
        return True
    def confirmar_texto(self):
        try:
            if self.texto_input.strip():
                self.valor = max(self.min_val, min(self.max_val, float(self.texto_input)))
                if self.tipo == "int": self.valor = round(self.valor)
        except: pass

class Dropdown:
    def __init__(self, largura, altura, opcoes, indice_inicial=0, max_visiveis=2):
        self.rect = pygame.Rect(0, 0, largura, altura); self.opcoes = opcoes; self.indice_selecionado = indice_inicial
        self.aberto = False; self.max_visiveis = max_visiveis; self.scroll_offset = 0; self.rects_opcoes = []
    def desenhar(self, surface, x, y, mouse_pos):
        self.rect.topleft = (x, y)
        pygame.draw.rect(surface, CINZA_CLARO, self.rect); pygame.draw.rect(surface, BRANCO, self.rect, 2)
        txt = fonte_dropdown.render(self.opcoes[self.indice_selecionado], True, BRANCO)
        surface.blit(txt, (self.rect.x + 10, self.rect.centery - txt.get_height()//2))
        seta = fonte_dropdown.render("V" if not self.aberto else "^", True, BRANCO)
        surface.blit(seta, (self.rect.right - 25, self.rect.centery - seta.get_height()//2))
        if self.aberto:
            self.rects_opcoes = []
            visiveis = min(self.max_visiveis, len(self.opcoes))
            lista_rect = pygame.Rect(self.rect.x, self.rect.bottom, self.rect.width, self.rect.height * visiveis)
            pygame.draw.rect(surface, CINZA_CLARO, lista_rect); pygame.draw.rect(surface, BRANCO, lista_rect, 2)
            for i in range(visiveis):
                idx = self.scroll_offset + i
                r_op = pygame.Rect(self.rect.x, self.rect.bottom + i * self.rect.height, self.rect.width, self.rect.height)
                self.rects_opcoes.append((r_op, idx))
                cor_f = AMARELO if r_op.collidepoint(mouse_pos) else CINZA_ESCURO
                pygame.draw.rect(surface, cor_f, r_op); pygame.draw.rect(surface, BRANCO, r_op, 1)
                t_op = fonte_dropdown.render(self.opcoes[idx], True, PRETO if cor_f == AMARELO else BRANCO)
                surface.blit(t_op, (r_op.x + 10, r_op.centery - t_op.get_height()//2))
            if len(self.opcoes) > self.max_visiveis:
                sr = pygame.Rect(self.rect.right - 15, self.rect.bottom, 15, lista_rect.height)
                pygame.draw.rect(surface, CINZA_ESCURO, sr); pygame.draw.rect(surface, BRANCO, sr, 1)
                th = max(20, sr.height * (self.max_visiveis / len(self.opcoes)))
                py = sr.y + (sr.height - th) * (self.scroll_offset / (len(self.opcoes) - self.max_visiveis) if len(self.opcoes) > self.max_visiveis else 0)
                pygame.draw.rect(surface, BRANCO, (sr.x, py, 15, th))
    def rolar(self, direcao_y):
        if self.aberto and len(self.opcoes) > self.max_visiveis:
            self.scroll_offset = max(0, min(self.scroll_offset - direcao_y, len(self.opcoes) - self.max_visiveis))
    def tratar_clique(self, mouse_pos):
        if self.aberto:
            for r, idx in self.rects_opcoes:
                if r.collidepoint(mouse_pos): self.indice_selecionado = idx; self.aberto = False; return True
            if not pygame.Rect(self.rect.x, self.rect.y, self.rect.width, self.rect.height * (min(self.max_visiveis, len(self.opcoes)) + 1)).collidepoint(mouse_pos): self.aberto = False
            return False
        else:
            if self.rect.collidepoint(mouse_pos): self.aberto = True; return False

# --- 3. ESTADOS E COMPONENTES INICIAIS ---
estado_atual = "menu"
opcoes_main = ["Host", "Jogar", "Compêndio", "Personagens", "Opções", "Sair"]
indice_menu, indice_hover = 0, -1

abas_opcoes = ["Geral", "Gráficos", "Áudio"]
aba_selecionada = 0
slider_musica = Slider(250, 0, 100, cfg["vol_musica"], "int")
slider_sfx = Slider(250, 0, 100, cfg["vol_sfx"], "int")
slider_fonte = Slider(250, 0.5, 2.0, cfg["font_scale"], "float")
todos_os_sliders = [slider_musica, slider_sfx, slider_fonte]

dropdown_gui = Dropdown(180, 35, ["0.5x", "1.0x", "1.5x", "2.0x"], indice_inicial=cfg["gui_scale_idx"], max_visiveis=2)
dropdown_res = Dropdown(180, 35, ["800x600", "1280x720", "1366x768", "1600x900", "1920x1080"], indice_inicial=cfg["res_idx"], max_visiveis=2)
dropdown_modo = Dropdown(180, 35, ["Window", "Borderless", "Full Screen"], indice_inicial=cfg["modo_idx"], max_visiveis=2)

# --- NOVO SISTEMA DO COMPÊNDIO ---
ARQUIVO_COMPENDIO = "compendio.json"
categorias_compendio = ["Raças", "Classes", "Antecedentes", "Magias", "Itens", "Bestiário"]
cat_compendio_idx = 0 
item_selecionado = None

def carregar_compendio():
    if os.path.exists(ARQUIVO_COMPENDIO):
        try:
            # encoding="utf-8" é vital para ler Raças, Clérigo, etc.
            with open(ARQUIVO_COMPENDIO, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Erro ao ler compendio.json: {e}")
    # Se der erro ou não existir, cria um vazio
    return {cat: [] for cat in categorias_compendio}

dados_compendio = carregar_compendio()

def salvar_configs():
    novas_configs = {
        "mostrar_fps": mostrar_fps, "gui_scale_idx": dropdown_gui.indice_selecionado, "font_scale": slider_fonte.valor,
        "vol_musica": slider_musica.valor, "vol_sfx": slider_sfx.valor, "res_idx": dropdown_res.indice_selecionado, "modo_idx": dropdown_modo.indice_selecionado
    }
    with open(ARQUIVO_CONFIG, "w") as f: json.dump(novas_configs, f, indent=4)

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
    box_rect = pygame.Rect((BASE_W//2 - 500, BASE_H//2 - 275 + 30), (1000, 550))
    pygame.draw.rect(tela_virtual, CINZA_ESCURO, box_rect, border_radius=10)
    pygame.draw.rect(tela_virtual, BRANCO, box_rect, 3, border_radius=10)
    
    rect_voltar = fonte.render("<", True, AMARELO).get_rect(topleft=(box_rect.left + 25, box_rect.top + 25))
    tela_virtual.blit(fonte.render("<", True, AMARELO), rect_voltar)

    pos_x = [box_rect.centerx - 250, box_rect.centerx, box_rect.centerx + 250]
    areas_abas = []
    for i, nome in enumerate(abas_opcoes):
        cor = AMARELO if i == aba_selecionada else BRANCO
        surf_aba = fonte.render(nome, True, cor)
        rect_aba = surf_aba.get_rect(center=(pos_x[i], box_rect.top + 45))
        if i == aba_selecionada: pygame.draw.line(tela_virtual, AMARELO, (rect_aba.left, rect_aba.bottom), (rect_aba.right, rect_aba.bottom), 3)
        tela_virtual.blit(surf_aba, rect_aba)
        areas_abas.append(rect_aba)

    interativos = []
    if aba_selecionada == 0:
        tela_virtual.blit(fonte_p.render("Mostrar FPS:", True, BRANCO), (box_rect.left + 100, box_rect.top + 120))
        check_rect = pygame.Rect(box_rect.left + 350, box_rect.top + 120, 30, 30)
        pygame.draw.rect(tela_virtual, BRANCO, check_rect, 2)
        if mostrar_fps: pygame.draw.rect(tela_virtual, AMARELO, check_rect.inflate(-10, -10))
        interativos.append(("fps", check_rect))
        tela_virtual.blit(fonte_p.render("GUI Scale:", True, BRANCO), (box_rect.left + 100, box_rect.top + 220))
        dropdown_gui.desenhar(tela_virtual, box_rect.left + 350, box_rect.top + 215, mouse_pos)
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

def desenhar_texto_multilinha(surface, texto, fonte_usada, cor, x, y, largura_maxima):
    """Função mágica para quebrar o texto se ele for maior que a tela"""
    palavras = texto.split(' ')
    linhas = []
    linha_atual = []
    
    for palavra in palavras:
        # Se for uma quebra de linha manual do JSON (\n)
        if '\n' in palavra:
            partes = palavra.split('\n')
            linha_atual.append(partes[0])
            linhas.append(' '.join(linha_atual))
            linha_atual = [partes[1]]
            continue
            
        teste_linha = ' '.join(linha_atual + [palavra])
        largura_teste, _ = fonte_usada.size(teste_linha)
        
        if largura_teste <= largura_maxima:
            linha_atual.append(palavra)
        else:
            linhas.append(' '.join(linha_atual))
            linha_atual = [palavra]
            
    linhas.append(' '.join(linha_atual))
    
    altura_y = y
    for linha in linhas:
        if linha.strip(): # Só desenha se não for linha vazia
            surf = fonte_usada.render(linha, True, cor)
            surface.blit(surf, (x, altura_y))
        altura_y += fonte_usada.get_linesize()
        
    return altura_y # Retorna onde o texto parou no eixo Y


def desenhar_compendio(mouse_pos):
    tela_virtual.fill(PRETO)
    box_rect = pygame.Rect((BASE_W//2 - 550, BASE_H//2 - 300), (1100, 600))
    pygame.draw.rect(tela_virtual, CINZA_ESCURO, box_rect, border_radius=10)
    pygame.draw.rect(tela_virtual, BRANCO, box_rect, 3, border_radius=10)
    
    rect_voltar = fonte.render("<", True, AMARELO).get_rect(topleft=(box_rect.left + 25, box_rect.top + 25))
    tela_virtual.blit(fonte.render("<", True, AMARELO), rect_voltar)

    surf_titulo = fonte.render("COMPÊNDIO D&D 2024", True, BRANCO)
    tela_virtual.blit(surf_titulo, surf_titulo.get_rect(center=(box_rect.centerx, box_rect.top + 45)))
    pygame.draw.line(tela_virtual, BRANCO, (box_rect.left, box_rect.top + 80), (box_rect.right, box_rect.top + 80), 2)

    largura_sidebar = 250
    pygame.draw.line(tela_virtual, BRANCO, (box_rect.left + largura_sidebar, box_rect.top + 80), (box_rect.left + largura_sidebar, box_rect.bottom), 2)

    # --- SIDEBAR ---
    rects_categorias = []
    y_cat = box_rect.top + 100
    for i, cat in enumerate(categorias_compendio):
        cor_txt = AMARELO if i == cat_compendio_idx else BRANCO
        surf_cat = fonte_p.render(cat, True, cor_txt)
        rect_cat = surf_cat.get_rect(topleft=(box_rect.left + 30, y_cat))
        if rect_cat.inflate(20, 10).collidepoint(mouse_pos) and i != cat_compendio_idx:
            surf_cat = fonte_p.render(cat, True, CINZA_CLARO)
        tela_virtual.blit(surf_cat, rect_cat)
        rects_categorias.append((rect_cat.inflate(20, 10), i))
        y_cat += 50

    # --- CONTEÚDO (Lado Direito) ---
    area_conteudo_x = box_rect.left + largura_sidebar + 30
    area_conteudo_y = box_rect.top + 100
    largura_max_texto = box_rect.width - largura_sidebar - 60

    categoria_atual = categorias_compendio[cat_compendio_idx]
    lista_itens = dados_compendio.get(categoria_atual, [])
    
    rects_itens = [] # Para clicar nos cards

    # SE ESTIVERMOS VENDO OS DETALHES DE UM ITEM
    if item_selecionado is not None:
        # Botão interno de voltar para a lista
        rect_voltar_lista = fonte_p.render("< Voltar para Lista", True, AMARELO).get_rect(topleft=(area_conteudo_x, area_conteudo_y))
        tela_virtual.blit(fonte_p.render("< Voltar para Lista", True, AMARELO), rect_voltar_lista)
        
        y_detalhe = area_conteudo_y + 40
        
        # Título (Ex: Guerreiro)
        tela_virtual.blit(fonte.render(item_selecionado.get("nome", "Desconhecido"), True, AMARELO), (area_conteudo_x, y_detalhe))
        y_detalhe += 45
        
        # Subtítulo / Atributos básicos
        tela_virtual.blit(fonte_dropdown.render(item_selecionado.get("subtitulo", ""), True, CINZA_CLARO), (area_conteudo_x, y_detalhe))
        y_detalhe += 30
        
        # Descrição com Word Wrap!
        y_detalhe = desenhar_texto_multilinha(tela_virtual, item_selecionado.get("descricao", ""), fonte_p, BRANCO, area_conteudo_x, y_detalhe, largura_max_texto)
        y_detalhe += 20
        
        # Linha de separação
        pygame.draw.line(tela_virtual, CINZA_ESCURO, (area_conteudo_x, y_detalhe), (box_rect.right - 30, y_detalhe), 2)
        y_detalhe += 20
        
        # Atributos e Traços
        tela_virtual.blit(fonte_p.render("Características Principais:", True, AMARELO), (area_conteudo_x, y_detalhe))
        y_detalhe += 35
        y_detalhe = desenhar_texto_multilinha(tela_virtual, item_selecionado.get("atributos", ""), fonte_dropdown, CINZA_CLARO, area_conteudo_x, y_detalhe, largura_max_texto)
        y_detalhe += 20
        y_detalhe = desenhar_texto_multilinha(tela_virtual, item_selecionado.get("tracos", ""), fonte_dropdown, BRANCO, area_conteudo_x, y_detalhe, largura_max_texto)

        return rect_voltar, rects_categorias, rects_itens, rect_voltar_lista

    # SE ESTIVERMOS VENDO A LISTA (Cards)
    else:
        tela_virtual.blit(fonte_p.render(f"{categoria_atual} Disponíveis:", True, AMARELO), (area_conteudo_x, area_conteudo_y))
        
        if len(lista_itens) > 0:
            coluna_1_x = area_conteudo_x
            coluna_2_x = area_conteudo_x + 350
            y_item = area_conteudo_y + 60
            
            for i, dados_item in enumerate(lista_itens):
                x_atual = coluna_1_x if i % 2 == 0 else coluna_2_x
                if i > 0 and i % 2 == 0: y_item += 50
                
                # Pegar o nome do JSON (Se for dict pega a chave 'nome', se for string pega a própria string pra evitar erro)
                nome_exibir = dados_item.get("nome", "Sem Nome") if isinstance(dados_item, dict) else dados_item
                
                rect_card = pygame.Rect(x_atual, y_item, 300, 40)
                
                # Efeito Hover no Card
                cor_card = AMARELO if rect_card.collidepoint(mouse_pos) else CINZA_CLARO
                cor_txt_card = PRETO if cor_card == AMARELO else BRANCO
                
                pygame.draw.rect(tela_virtual, cor_card, rect_card, border_radius=5)
                tela_virtual.blit(fonte_p.render(nome_exibir, True, cor_txt_card), (x_atual + 10, y_item + 8))
                
                # Guarda o rect e os DADOS COMPLETOS desse item para o clique
                rects_itens.append((rect_card, dados_item))
                
        else:
            texto = f"Banco de dados de {categoria_atual} vazio."
            tela_virtual.blit(fonte_p.render(texto, True, CINZA_CLARO), (area_conteudo_x, area_conteudo_y + 60))

        return rect_voltar, rects_categorias, rects_itens, None

# --- 5. LOOP PRINCIPAL ---
while True:
    real_mouse_pos = pygame.mouse.get_pos()
    mouse_clicado = pygame.mouse.get_pressed()[0]
    scaled_w, scaled_h = int(BASE_W * gui_scale), int(BASE_H * gui_scale)
    offset_x, offset_y = LARGURA//2 - scaled_w//2, ALTURA//2 - scaled_h//2
    mouse_pos = ((real_mouse_pos[0] - offset_x) / gui_scale, (real_mouse_pos[1] - offset_y) / gui_scale) 
    
    carregar_fontes(slider_fonte.valor)

    if estado_atual == "menu":
        tela_virtual.fill(PRETO)
        surf_titulo = fonte_titulo.render("VTT PROJECT", True, BRANCO)
        tela_virtual.blit(surf_titulo, surf_titulo.get_rect(center=(BASE_W // 2, 80)))
        
        novo_hover = -1
        for i, texto in enumerate(opcoes_main):
            rect_teste = fonte.render(texto, True, BRANCO).get_rect(center=(BASE_W // 2, 220 + i * 70)).inflate(100, 20)
            if rect_teste.collidepoint(mouse_pos): 
                novo_hover = i
            cor = AMARELO if i == indice_menu else BRANCO
            txt = f"> {texto} <" if i == indice_menu else texto
            tela_virtual.blit(fonte.render(txt, True, cor), fonte.render(txt, True, cor).get_rect(center=(BASE_W // 2, 220 + i * 70)))
        
        if novo_hover != -1 and novo_hover != indice_hover and novo_hover != indice_menu:
            indice_menu = novo_hover
            if som_nav: 
                som_nav.play()
        indice_hover = novo_hover

    elif estado_atual == "opcoes":
        rect_voltar, areas_abas, interativos = desenhar_opcoes(mouse_pos)
        if aba_selecionada == 2:
            if slider_musica.atualizar(mouse_pos, mouse_clicado): 
                pygame.mixer.music.set_volume(slider_musica.valor / 100)
            if slider_sfx.atualizar(mouse_pos, mouse_clicado):
                if som_nav: som_nav.set_volume(slider_sfx.valor / 100)
                if som_select: som_select.set_volume(slider_sfx.valor / 100)
        elif aba_selecionada == 0: 
            slider_fonte.atualizar(mouse_pos, mouse_clicado)

    elif estado_atual == "compendio":
        rect_voltar, rects_categorias = desenhar_compendio(mouse_pos)

    tela.fill(PRETO)
    tela.blit(pygame.transform.scale(tela_virtual, (scaled_w, scaled_h)), (offset_x, offset_y))
    if mostrar_fps: 
        tela.blit(fonte_p.render(f"FPS: {int(relogio.get_fps())}", True, (0, 255, 0)), (10, 10))

    # --- PROCESSOS DE EVENTOS ---
    for evento in pygame.event.get():
        if evento.type == pygame.QUIT: 
            salvar_configs()
            pygame.quit()
            sys.exit()
            
        if evento.type == pygame.MOUSEWHEEL and estado_atual == "opcoes":
            if aba_selecionada == 0: 
                dropdown_gui.rolar(evento.y)
            elif aba_selecionada == 1: 
                dropdown_res.rolar(evento.y)
                dropdown_modo.rolar(evento.y)

        if evento.type == pygame.MOUSEBUTTONUP and evento.button == 1:
            if estado_atual == "opcoes": 
                salvar_configs()

        if evento.type == pygame.KEYDOWN:
            tecla_interceptada = False
            for s in todos_os_sliders:
                if s.tratar_teclado(evento):
                    tecla_interceptada = True
                    if not s.editando: 
                        if s == slider_musica: 
                            pygame.mixer.music.set_volume(s.valor / 100)
                        elif s == slider_sfx and som_select: 
                            som_select.set_volume(s.valor / 100)
                        salvar_configs()
            
            if not tecla_interceptada and estado_atual == "menu":
                indice_antigo = indice_menu
                if evento.key == pygame.K_UP and indice_menu > 0: 
                    indice_menu -= 1
                elif evento.key == pygame.K_DOWN and indice_menu < len(opcoes_main) - 1: 
                    indice_menu += 1
                
                if indice_menu != indice_antigo and som_nav: 
                    som_nav.play()

                if evento.key in [pygame.K_RETURN, pygame.K_SPACE]:
                    if som_select: 
                        som_select.play()
                    if opcoes_main[indice_menu] == "Opções": 
                        estado_atual = "opcoes"
                    elif opcoes_main[indice_menu] == "Compêndio": 
                        estado_atual = "compendio"
                    elif opcoes_main[indice_menu] == "Sair": 
                        salvar_configs()
                        pygame.quit()
                        sys.exit()

        if evento.type == pygame.MOUSEBUTTONDOWN and evento.button == 1:
            clicou_em_texto = False
            if estado_atual == "opcoes":
                sliders_aba = [slider_fonte] if aba_selecionada == 0 else [slider_musica, slider_sfx] if aba_selecionada == 2 else []
                for s in sliders_aba:
                    if s.tratar_clique(mouse_pos):
                        clicou_em_texto = True
                        if som_select: 
                            som_select.play()
                    if not s.editando:
                        if s == slider_musica: 
                            pygame.mixer.music.set_volume(s.valor / 100)
                        elif s == slider_sfx and som_select: 
                            som_select.set_volume(s.valor / 100)
                        salvar_configs()
            
            if clicou_em_texto: 
                continue

            if estado_atual == "menu":
                for i, texto in enumerate(opcoes_main):
                    if fonte.render(texto, True, BRANCO).get_rect(center=(BASE_W // 2, 220 + i * 70)).inflate(100, 20).collidepoint(mouse_pos):
                        if som_select: 
                            som_select.play()
                        if texto == "Opções": 
                            estado_atual = "opcoes"
                        elif texto == "Compêndio": 
                            estado_atual = "compendio"
                        elif texto == "Sair": 
                            salvar_configs()
                            pygame.quit()
                            sys.exit()

            elif estado_atual == "opcoes":
                dropdown_aberto_interceptou = False
                if aba_selecionada == 0:
                    if dropdown_gui.aberto:
                        if dropdown_gui.tratar_clique(mouse_pos):
                            if som_select: som_select.play()
                            gui_scale = float(dropdown_gui.opcoes[dropdown_gui.indice_selecionado].replace("x", ""))
                            salvar_configs()
                        dropdown_aberto_interceptou = True
                    elif dropdown_gui.rect.collidepoint(mouse_pos):
                        dropdown_gui.tratar_clique(mouse_pos)
                        dropdown_aberto_interceptou = True
                        if som_select: 
                            som_select.play()
                            
                elif aba_selecionada == 1:
                    if dropdown_res.aberto:
                        if dropdown_res.tratar_clique(mouse_pos): 
                            if som_select: som_select.play()
                            aplicar_display()
                            salvar_configs()
                        dropdown_aberto_interceptou = True
                    elif dropdown_modo.aberto:
                        if dropdown_modo.tratar_clique(mouse_pos): 
                            if som_select: som_select.play()
                            aplicar_display()
                            salvar_configs()
                        dropdown_aberto_interceptou = True
                    else:
                        if dropdown_res.rect.collidepoint(mouse_pos):
                            dropdown_res.tratar_clique(mouse_pos)
                            dropdown_aberto_interceptou = True
                            if som_select: som_select.play()
                        elif dropdown_modo.rect.collidepoint(mouse_pos):
                            dropdown_modo.tratar_clique(mouse_pos)
                            dropdown_aberto_interceptou = True
                            if som_select: som_select.play()

                if not dropdown_aberto_interceptou:
                    if rect_voltar.collidepoint(mouse_pos):
                        if som_select: som_select.play()
                        estado_atual = "menu"
                    for i, r in enumerate(areas_abas):
                        if r.collidepoint(mouse_pos):
                            if aba_selecionada != i and som_select: 
                                som_select.play()
                            aba_selecionada = i
                    for tipo, rect in interativos:
                        if rect.collidepoint(mouse_pos) and tipo == "fps":
                            if som_select: som_select.play()
                            mostrar_fps = not mostrar_fps
                            salvar_configs()

            elif estado_atual == "compendio":
                if rect_voltar.collidepoint(mouse_pos):
                    if som_select: som_select.play()
                    estado_atual = "menu"
                
                for rect, idx in rects_categorias:
                    if rect.collidepoint(mouse_pos):
                        if cat_compendio_idx != idx and som_select: 
                            som_select.play()
                        cat_compendio_idx = idx

    pygame.display.flip()
    relogio.tick(60)
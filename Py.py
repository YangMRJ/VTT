import pygame
import json
import os

pygame.init()
pygame.mixer.init()

ARQUIVO_CONFIG = "settings.json"

def carregar_config():
    padrao = {"vol_musica": 0.5, "vol_sfx": 0.5, "res_idx": 0, "video_modo": "JANELA", "personagens": [], "char_selecionado": 0}
    if os.path.exists(ARQUIVO_CONFIG):
        try:
            with open(ARQUIVO_CONFIG, "r") as f: 
                dados = json.load(f)
                if "personagens" in dados:
                    for i, p in enumerate(dados["personagens"]):
                        if isinstance(p, str): dados["personagens"][i] = {"nome": p}
                        # Injeta chaves D&D atualizadas com background
                        dnd_keys = {
                            "raca": "Humano", "classe": "Guerreiro", "background": "Heroi do Povo", "nivel": 1,
                            "str": 10, "dex": 10, "con": 10, "int": 10, "wis": 10, "cha": 10,
                            "hp": 10, "ca": 10, "iniciativa": 0, "deslocamento": 9,
                            "atletismo": 0, "furtividade": 0, "percepcao": 0, "persuasao": 0
                        }
                        for k, v in dnd_keys.items():
                            if k not in dados["personagens"][i]: dados["personagens"][i][k] = v
                return {**padrao, **dados}
        except: return padrao
    return padrao

def salvar_config(dados):
    with open(ARQUIVO_CONFIG, "w") as f: json.dump(dados, f)

config = carregar_config()
vol_musica, vol_sfx = config["vol_musica"], config["vol_sfx"]
res_opcoes = [(1024, 768), (1280, 720), (1366, 768), (1600, 900), (1920, 1080)]
res_idx, video_modo = config["res_idx"], config["video_modo"]
personagens = config["personagens"]
char_sel = config["char_selecionado"]

RACAS = ["Humano", "Elfo", "Anao", "Orc", "Halfling", "Draconato"]
CLASSES = ["Guerreiro", "Mago", "Ladino", "Clerigo", "Paladino", "Bardo"]
BACKGROUNDS = ["Acolito", "Criminoso", "Heroi do Povo", "Nobre", "Sabio", "Soldado"]

def aplicar_video():
    w, h = res_opcoes[res_idx]
    if video_modo == "BORDERLESS":
        os.environ['SDL_VIDEO_WINDOW_POS'] = "0,0"
        info = pygame.display.Info()
        return pygame.display.set_mode((info.current_w, info.current_h), pygame.NOFRAME)
    elif video_modo == "FULLSCREEN": return pygame.display.set_mode((w, h), pygame.FULLSCREEN)
    else:
        os.environ['SDL_VIDEO_CENTERED'] = '1'
        return pygame.display.set_mode((w, h))

tela = aplicar_video()
relogio = pygame.time.Clock()

# --- AUDIO ---
try:
    pygame.mixer.music.load("menu_theme.mp3")
    pygame.mixer.music.set_volume(vol_musica)
    pygame.mixer.music.play(-1)
    sfx_nav = pygame.mixer.Sound("nav.mp3")
    sfx_sel = pygame.mixer.Sound("select.mp3")
    sfx_nav.set_volume(vol_sfx); sfx_sel.set_volume(vol_sfx)
except: sfx_nav = sfx_sel = None

try:
    fonte = pygame.font.Font("Minecraft.ttf", 35)
    fonte_p = pygame.font.Font("Minecraft.ttf", 20)
    fonte_pp = pygame.font.Font("Minecraft.ttf", 16)
except:
    fonte = pygame.font.SysFont("Arial", 35); fonte_p = pygame.font.SysFont("Arial", 20); fonte_pp = pygame.font.SysFont("Arial", 16)

estado = "MENU"
sub_estado_char = "LISTA" 
opcoes_menu = ["Host", "Jogar", "Personagem", "Options", "Sair"]
sel_menu = 0

campo_ativo = None 
input_texto = ""

# Variáveis para a tela de Criação
criacao_nome = ""
criacao_raca_idx = 0
criacao_classe_idx = 0
criacao_bg_idx = 0
campo_criacao = "nome"

def desenhar_texto(texto, f, cor, x, y, centralizar=True):
    img = f.render(texto, True, cor)
    rect = img.get_rect(center=(x, y)) if centralizar else img.get_rect(topleft=(x, y))
    tela.blit(img, rect)
    return rect

def desenhar_bloco(x, y, w, h, titulo):
    pygame.draw.rect(tela, (25, 25, 30), (x, y, w, h))
    pygame.draw.rect(tela, (80, 80, 90), (x, y, w, h), 2)
    pygame.draw.rect(tela, (40, 40, 45), (x, y, w, 30))
    desenhar_texto(titulo, fonte_pp, (200, 200, 200), x + w//2, y + 15)

def desenhar_campo(dict_personagem, chave, label, x, y, m_pos):
    global campo_ativo
    ativo = (campo_ativo == chave)
    cor_texto = (255, 255, 0) if ativo else (200, 200, 200)
    
    desenhar_texto(label, fonte_pp, (130, 130, 130), x, y, centralizar=False)
    
    valor_str = str(dict_personagem.get(chave, 0))
    if ativo: valor_str = f"< {valor_str} >" 
    
    r_valor = desenhar_texto(valor_str, fonte_p, cor_texto, x + 120, y - 2, centralizar=False)
    
    rect_clique = pygame.Rect(x, y - 5, 250, 25)
    if rect_clique.collidepoint(m_pos):
        pygame.draw.rect(tela, (255, 255, 255), rect_clique, 1) 
        
    return rect_clique

def tocar_sfx(som):
    if som: som.play()

# --- LOOP PRINCIPAL ---
rodando = True
while rodando:
    m_pos = pygame.mouse.get_pos()
    m_click = False
    
    tela.fill((15, 15, 20))
    
    for ev in pygame.event.get():
        if ev.type == pygame.QUIT: rodando = False
        if ev.type == pygame.MOUSEBUTTONDOWN and ev.button == 1: m_click = True
        
        if ev.type == pygame.KEYDOWN:
            if sub_estado_char == "CRIAR" and campo_criacao == "nome":
                if ev.key == pygame.K_BACKSPACE: criacao_nome = criacao_nome[:-1]
                elif ev.key != pygame.K_RETURN and ev.key != pygame.K_ESCAPE and len(criacao_nome) < 15:
                    criacao_nome += ev.unicode
            elif sub_estado_char == "DELETAR":
                if ev.key == pygame.K_BACKSPACE: input_texto = input_texto[:-1]
                elif ev.key != pygame.K_RETURN and ev.key != pygame.K_ESCAPE and len(input_texto) < 15:
                    input_texto += ev.unicode
            
            if estado == "MENU":
                if ev.key in [pygame.K_w, pygame.K_UP]: sel_menu = (sel_menu - 1) % len(opcoes_menu); tocar_sfx(sfx_nav)
                elif ev.key in [pygame.K_s, pygame.K_DOWN]: sel_menu = (sel_menu + 1) % len(opcoes_menu); tocar_sfx(sfx_nav)
                elif ev.key == pygame.K_RETURN: estado = opcoes_menu[sel_menu].upper(); tocar_sfx(sfx_sel)
            
            elif estado == "PERSONAGEM" and sub_estado_char == "CRIAR":
                if ev.key == pygame.K_LEFT:
                    if campo_criacao == "raca": criacao_raca_idx = (criacao_raca_idx - 1) % len(RACAS); tocar_sfx(sfx_nav)
                    elif campo_criacao == "classe": criacao_classe_idx = (criacao_classe_idx - 1) % len(CLASSES); tocar_sfx(sfx_nav)
                    elif campo_criacao == "bg": criacao_bg_idx = (criacao_bg_idx - 1) % len(BACKGROUNDS); tocar_sfx(sfx_nav)
                if ev.key == pygame.K_RIGHT:
                    if campo_criacao == "raca": criacao_raca_idx = (criacao_raca_idx + 1) % len(RACAS); tocar_sfx(sfx_nav)
                    elif campo_criacao == "classe": criacao_classe_idx = (criacao_classe_idx + 1) % len(CLASSES); tocar_sfx(sfx_nav)
                    elif campo_criacao == "bg": criacao_bg_idx = (criacao_bg_idx + 1) % len(BACKGROUNDS); tocar_sfx(sfx_nav)

            elif estado == "PERSONAGEM" and sub_estado_char == "EDITAR" and campo_ativo:
                p = personagens[char_sel]
                if ev.key == pygame.K_LEFT:
                    if campo_ativo in ["str", "dex", "con", "int", "wis", "cha", "hp", "ca"]: p[campo_ativo] = max(1, p[campo_ativo] - 1); tocar_sfx(sfx_nav)
                    elif campo_ativo in ["iniciativa", "atletismo", "furtividade", "percepcao", "persuasao"]: p[campo_ativo] -= 1; tocar_sfx(sfx_nav)
                    elif campo_ativo == "deslocamento": p["deslocamento"] = max(0, p["deslocamento"] - 1.5); tocar_sfx(sfx_nav)
                
                if ev.key == pygame.K_RIGHT:
                    if campo_ativo in ["str", "dex", "con", "int", "wis", "cha", "hp", "ca"]: p[campo_ativo] = min(100, p[campo_ativo] + 1); tocar_sfx(sfx_nav)
                    elif campo_ativo in ["iniciativa", "atletismo", "furtividade", "percepcao", "persuasao"]: p[campo_ativo] += 1; tocar_sfx(sfx_nav)
                    elif campo_ativo == "deslocamento": p["deslocamento"] += 1.5; tocar_sfx(sfx_nav)
            
            elif estado == "PERSONAGEM" and sub_estado_char == "DELETAR" and ev.key == pygame.K_RETURN:
                if input_texto.lower() == "delete":
                    personagens.pop(char_sel)
                    char_sel = 0; sub_estado_char = "LISTA"
                    tocar_sfx(sfx_sel)
                else:
                    sub_estado_char = "EDITAR"
                    tocar_sfx(sfx_sel)

            if ev.key == pygame.K_ESCAPE:
                tocar_sfx(sfx_sel)
                if sub_estado_char in ["EDITAR", "CRIAR", "DELETAR"]: 
                    sub_estado_char = "LISTA"; campo_ativo = None
                else: estado = "MENU"
                salvar_config({"vol_musica": vol_musica, "vol_sfx": vol_sfx, "res_idx": res_idx, "video_modo": video_modo, "personagens": personagens, "char_selecionado": char_sel})

    # --- RENDERIZAÇÃO ---
    largura_t = tela.get_width()
    
    if estado == "MENU":
        desenhar_texto("MEU RPG", fonte, (255, 255, 255), largura_t//2, 100)
        for i, opt in enumerate(opcoes_menu):
            c = (255, 255, 0) if i == sel_menu else (180, 180, 180)
            r = desenhar_texto(f">{opt}<" if i == sel_menu else opt, fonte, c, largura_t//2, 250 + i * 65)
            if r.collidepoint(m_pos) and m_click:
                estado = opt.upper()
                if estado == "SAIR": rodando = False

    elif estado == "PERSONAGEM":
        if sub_estado_char == "LISTA":
            desenhar_texto("SELECIONE O PERSONAGEM", fonte, (255, 255, 255), largura_t//2, 80)
            
            r_novo = desenhar_texto("> CRIAR NOVO <", fonte_p, (100,255,100), largura_t//2, 150)
            if r_novo.collidepoint(m_pos) and m_click:
                sub_estado_char = "CRIAR"
                criacao_nome = f"Heroi {len(personagens)+1}"
                criacao_raca_idx = 0
                criacao_classe_idx = 0
                criacao_bg_idx = 0
                campo_criacao = "nome"
                tocar_sfx(sfx_sel)
            
            for i, p in enumerate(personagens):
                cor = (255, 255, 0) if char_sel == i else (180, 180, 180)
                txt = f"{'[X] ' if char_sel == i else '[  ] '}{p['nome']} - {p['raca']} {p['classe']} (Nv.{p.get('nivel',1)})"
                
                r_txt = fonte_p.render(txt, True, cor)
                rect_hover = r_txt.get_rect(center=(largura_t//2, 220 + i * 45))
                if rect_hover.collidepoint(m_pos):
                    txt = f">{txt}<"
                    if m_click:
                        char_sel = i; sub_estado_char = "EDITAR"; tocar_sfx(sfx_sel)
                
                desenhar_texto(txt, fonte_p, cor, largura_t//2, 220 + i * 45)

        elif sub_estado_char == "CRIAR":
            desenhar_texto("CRIAR NOVO PERSONAGEM", fonte, (255, 255, 255), largura_t//2, 100)
            desenhar_texto("Use o Mouse para selecionar e as Setas para trocar.", fonte_pp, (130,130,130), largura_t//2, 140)

            c_nome = (255, 255, 0) if campo_criacao == "nome" else (200, 200, 200)
            r_nome = desenhar_texto(f"NOME: {criacao_nome}", fonte_p, c_nome, largura_t//2, 200)
            if r_nome.collidepoint(m_pos) and m_click: campo_criacao = "nome"; tocar_sfx(sfx_nav)

            c_raca = (255, 255, 0) if campo_criacao == "raca" else (200, 200, 200)
            r_raca = desenhar_texto(f"RACA: < {RACAS[criacao_raca_idx]} >", fonte_p, c_raca, largura_t//2, 250)
            if r_raca.collidepoint(m_pos) and m_click: campo_criacao = "raca"; tocar_sfx(sfx_nav)

            c_classe = (255, 255, 0) if campo_criacao == "classe" else (200, 200, 200)
            r_classe = desenhar_texto(f"CLASSE: < {CLASSES[criacao_classe_idx]} >", fonte_p, c_classe, largura_t//2, 300)
            if r_classe.collidepoint(m_pos) and m_click: campo_criacao = "classe"; tocar_sfx(sfx_nav)

            c_bg = (255, 255, 0) if campo_criacao == "bg" else (200, 200, 200)
            r_bg = desenhar_texto(f"ANTECEDENTE: < {BACKGROUNDS[criacao_bg_idx]} >", fonte_p, c_bg, largura_t//2, 350)
            if r_bg.collidepoint(m_pos) and m_click: campo_criacao = "bg"; tocar_sfx(sfx_nav)

            r_confirmar = desenhar_texto("[ SALVAR PERSONAGEM ]", fonte_p, (100, 255, 100), largura_t//2, 450)
            if r_confirmar.collidepoint(m_pos) and m_click:
                novo_p = {
                    "nome": criacao_nome if criacao_nome.strip() != "" else "Sem Nome",
                    "raca": RACAS[criacao_raca_idx], "classe": CLASSES[criacao_classe_idx], "background": BACKGROUNDS[criacao_bg_idx],
                    "nivel": 1,
                    "str": 10, "dex": 10, "con": 10, "int": 10, "wis": 10, "cha": 10,
                    "hp": 10, "ca": 10, "iniciativa": 0, "deslocamento": 9,
                    "atletismo": 0, "furtividade": 0, "percepcao": 0, "persuasao": 0
                }
                personagens.append(novo_p)
                char_sel = len(personagens) - 1
                sub_estado_char = "LISTA"
                salvar_config({"vol_musica": vol_musica, "vol_sfx": vol_sfx, "res_idx": res_idx, "video_modo": video_modo, "personagens": personagens, "char_selecionado": char_sel})
                tocar_sfx(sfx_sel)

        elif sub_estado_char == "EDITAR":
            p = personagens[char_sel]
            
            desenhar_texto(f"FICHA DE PERSONAGEM", fonte, (255, 255, 255), largura_t//2, 40)
            
            ficha_x = (largura_t - 800) // 2
            
            b1_x, b1_y, b1_w, b1_h = ficha_x, 90, 400, 190   # Altura aumentada para caber 5 itens
            b2_x, b2_y, b2_w, b2_h = ficha_x, 290, 250, 260  # Y deslocado p/ baixo (era 260, virou 290)
            b3_x, b3_y, b3_w, b3_h = ficha_x + 260, 290, 540, 100  # Y virou 290
            b4_x, b4_y, b4_w, b4_h = ficha_x + 260, 400, 540, 150  # Y virou 400
            
            desenhar_bloco(b1_x, b1_y, b1_w, b1_h, "INFO BASICA")
            desenhar_bloco(b2_x, b2_y, b2_w, b2_h, "ATRIBUTOS")
            desenhar_bloco(b3_x, b3_y, b3_w, b3_h, "COMBATE")
            desenhar_bloco(b4_x, b4_y, b4_w, b4_h, "PERICIAS")
            
            # --- TEXTOS FIXOS (Read-Only) ---
            # Todos alinhados à esquerda (b1_x + 20), pulando de 30 em 30 pixels (45, 75, 105, 135, 165)
            desenhar_texto(f"NOME: {p['nome']}", fonte_p, (200, 200, 200), b1_x + 20, b1_y + 45, False)
            desenhar_texto(f"RACA: {p['raca']}", fonte_p, (200, 200, 200), b1_x + 20, b1_y + 75, False)
            desenhar_texto(f"CLASSE: {p['classe']}", fonte_p, (200, 200, 200), b1_x + 20, b1_y + 105, False)
            desenhar_texto(f"ANTECEDENTE: {p.get('background', 'Nenhum')}", fonte_p, (180, 180, 255), b1_x + 20, b1_y + 135, False)
            desenhar_texto(f"NIVEL: {p.get('nivel', 1)}", fonte_p, (100, 255, 100), b1_x + 20, b1_y + 165, False)
            
            # --- CAMPOS EDITÁVEIS (Stats e Combate) ---
            campos = [
                ("str", "FORCA:", b2_x + 20, b2_y + 45), ("dex", "DESTREZA:", b2_x + 20, b2_y + 80),
                ("con", "CONSTITUICAO:", b2_x + 20, b2_y + 115), ("int", "INTELIGENCIA:", b2_x + 20, b2_y + 150),
                ("wis", "SABEDORIA:", b2_x + 20, b2_y + 185), ("cha", "CARISMA:", b2_x + 20, b2_y + 220),
                
                ("hp", "HP MAX:", b3_x + 20, b3_y + 45), ("ca", "ARMADURA (CA):", b3_x + 20, b3_y + 70),
                ("iniciativa", "INICIATIVA:", b3_x + 280, b3_y + 45), ("deslocamento", "DESLOCAMENTO:", b3_x + 280, b3_y + 70),
                
                ("atletismo", "ATLETISMO:", b4_x + 20, b4_y + 45), ("furtividade", "FURTIVIDADE:", b4_x + 20, b4_y + 70),
                ("percepcao", "PERCEPCAO:", b4_x + 280, b4_y + 45), ("persuasao", "PERSUASAO:", b4_x + 280, b4_y + 70),
            ]
            
            for chave, label, cx, cy in campos:
                rect_click = desenhar_campo(p, chave, label, cx, cy, m_pos)
                if rect_click.collidepoint(m_pos) and m_click:
                    campo_ativo = chave; tocar_sfx(sfx_nav)
            
            r_back = desenhar_texto("[ VOLTAR ]", fonte_p, (150, 150, 150), ficha_x + 200, b4_y + b4_h + 40)
            if r_back.collidepoint(m_pos) and m_click: sub_estado_char = "LISTA"; campo_ativo = None; tocar_sfx(sfx_sel)
            
            r_del = desenhar_texto("[ DELETAR PERSONAGEM ]", fonte_p, (255, 80, 80), ficha_x + 600, b4_y + b4_h + 40)
            if r_del.collidepoint(m_pos) and m_click:
                sub_estado_char = "DELETAR"; input_texto = ""; tocar_sfx(sfx_sel)

        elif sub_estado_char == "DELETAR":
            tela.fill((60, 0, 0))
            desenhar_texto("ZONA DE PERIGO", fonte, (255, 50, 50), largura_t//2, 100)
            desenhar_texto("Para deletar este personagem para sempre,", fonte_p, (200, 200, 200), largura_t//2, 180)
            desenhar_texto("digite 'delete' e aperte ENTER:", fonte_p, (200, 200, 200), largura_t//2, 210)
            
            desenhar_texto(f"[ {input_texto} ]", fonte, (255, 255, 0), largura_t//2, 300)
            
            r_cancel = desenhar_texto("[ CANCELAR ]", fonte_p, (150, 150, 150), largura_t//2, 450)
            if r_cancel.collidepoint(m_pos) and m_click:
                sub_estado_char = "EDITAR"; tocar_sfx(sfx_sel)

    elif estado == "OPTIONS":
        desenhar_texto("EM BREVE...", fonte, (255, 255, 255), largura_t//2, tela.get_height()//2)
        if desenhar_texto("VOLTAR", fonte_p, (150,150,150), largura_t//2, tela.get_height()-50).collidepoint(m_pos) and m_click:
            estado = "MENU"

    pygame.display.flip()
    relogio.tick(60)

pygame.quit()
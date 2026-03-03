import pygame
import json
import os
import sys
import random
import tkinter as tk
from tkinter import filedialog

pygame.init()
pygame.mixer.init()

ARQUIVO_CONFIG = "settings.json"

SKILLS_LIST = [
    ("Acrobatics", "dex"), ("Animal Handling", "wis"), ("Arcana", "int"),
    ("Athletics", "str"), ("Deception", "cha"), ("History", "int"),
    ("Insight", "wis"), ("Intimidation", "cha"), ("Investigation", "int"),
    ("Medicine", "wis"), ("Nature", "int"), ("Perception", "wis"),
    ("Performance", "cha"), ("Persuasion", "cha"), ("Religion", "int"),
    ("Sleight Of Hand", "dex"), ("Stealth", "dex"), ("Survival", "wis")
]

def carregar_config():
    padrao = {"vol_musica": 0.5, "vol_sfx": 0.5, "res_idx": 0, "video_modo": "JANELA", "personagens": [], "char_selecionado": 0, "show_fps": False}
    if os.path.exists(ARQUIVO_CONFIG):
        try:
            with open(ARQUIVO_CONFIG, "r") as f: 
                dados = json.load(f)
                if "personagens" in dados:
                    for i, p in enumerate(dados["personagens"]):
                        if isinstance(p, str): dados["personagens"][i] = {"nome": p}
                        
                        if "hp" in dados["personagens"][i] and "hp_max" not in dados["personagens"][i]:
                            dados["personagens"][i]["hp_max"] = dados["personagens"][i]["hp"]
                            dados["personagens"][i]["hp_atual"] = dados["personagens"][i]["hp"]

                        dnd_keys = {
                            "raca": "Humano", "classe": "Guerreiro", "background": "Viajante", "nivel": 1,
                            "xp": 0, "proficiencia": 2, "iniciativa": 0, "inspiracao": False, "imagem": "",
                            "hp_max": 10, "hp_atual": 10, "hp_temp": 0, "hp_input": 1, "hit_dice_atual": 1,
                            "str": 10, "dex": 10, "con": 10, "int": 10, "wis": 10, "cha": 10, "ca": 10, "deslocamento": 30,
                            "ca_armor": 0, "ca_dex": 0, "ca_shield": 0,
                            "speed_swim": 0, "speed_fly": 0, "speed_climb": 0,
                            "save_str": 0, "save_dex": 0, "save_con": 0, "save_int": 0, "save_wis": 0, "save_cha": 0,
                            "combate_ataques": [], "combate_efeitos": [], "combate_acoes": [], "combate_maestrias": []
                        }
                        
                        for s_name, _ in SKILLS_LIST:
                            dnd_keys[f"skill_{s_name.lower().replace(' ', '_')}"] = 0

                        for k, v in dnd_keys.items():
                            if k not in dados["personagens"][i]: dados["personagens"][i][k] = v
                        
                        for a_idx, atk in enumerate(dados["personagens"][i]["combate_ataques"]):
                            if isinstance(atk, str) or "atk_abilidade" not in atk:
                                old_name = atk if isinstance(atk, str) else atk.get("nome", "Ataque")
                                dados["personagens"][i]["combate_ataques"][a_idx] = {
                                    "nome": old_name, "tipo": "Melee", "distancia": "5 ft.",
                                    "atk_abilidade": "str", "atk_bonus": 0, "atk_prof": 2,
                                    "dmg1_dado": "1d8", "dmg1_abilidade": "str", "dmg1_tipo": "Slashing",
                                    "dmg2_dado": "", "dmg2_abilidade": "none", "dmg2_tipo": "", "descricao": ""
                                }

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
show_fps = config.get("show_fps", False)

RACAS = ["Humano", "Elfo", "Anao", "Orc", "Halfling", "Draconato"]
CLASSES = ["Guerreiro", "Mago", "Ladino", "Clerigo", "Paladino", "Bardo", "Barbaro"]
BACKGROUNDS = ["Acolito", "Criminoso", "Viajante", "Nobre", "Sabio", "Soldado"]
DADOS_DE_VIDA = {"Mago": "D6", "Bardo": "D8", "Clerigo": "D8", "Ladino": "D8", "Guerreiro": "D10", "Paladino": "D10", "Barbaro": "D12"}

image_cache = {}

def escolher_imagem():
    root = tk.Tk()
    root.withdraw() 
    root.wm_attributes('-topmost', 1) 
    file_path = filedialog.askopenfilename(title="Selecione o Portrait", filetypes=[("Imagens", "*.png *.jpg *.jpeg *.bmp")])
    root.destroy()
    return file_path

def obter_imagem_portrait(caminho, size):
    if not caminho or not os.path.exists(caminho): return None
    if caminho not in image_cache:
        try:
            img = pygame.image.load(caminho).convert_alpha()
            img = pygame.transform.smoothscale(img, (size, size)) 
            image_cache[caminho] = img
        except: return None
    return image_cache[caminho]

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

try:
    pygame.mixer.music.load("menu_theme.mp3")
    pygame.mixer.music.set_volume(vol_musica)
    pygame.mixer.music.play(-1)
    sfx_nav = pygame.mixer.Sound("nav.mp3")
    sfx_sel = pygame.mixer.Sound("select.mp3")
    sfx_nav.set_volume(vol_sfx); sfx_sel.set_volume(vol_sfx)
except: sfx_nav = sfx_sel = None

try:
    fonte_xg = pygame.font.Font("Minecraft.ttf", 36)
    fonte_g = pygame.font.Font("Minecraft.ttf", 28)
    fonte = pygame.font.Font("Minecraft.ttf", 20)
    fonte_p = pygame.font.Font("Minecraft.ttf", 15)
    fonte_pp = pygame.font.Font("Minecraft.ttf", 12)
except:
    fonte_xg = pygame.font.SysFont("Arial", 36, bold=True)
    fonte_g = pygame.font.SysFont("Arial", 28, bold=True)
    fonte = pygame.font.SysFont("Arial", 20, bold=True)
    fonte_p = pygame.font.SysFont("Arial", 16)
    fonte_pp = pygame.font.SysFont("Arial", 12)

estado = "MENU"
sub_estado_char = "LISTA" 
opcoes_menu = ["Host", "Jogar", "Personagem", "Options", "Sair"]
opcoes_cat = ["Audio", "Graficos"]
modos_video = ["JANELA", "FULLSCREEN", "BORDERLESS"]

sel_menu, sel_cat, sel_sub = 0, 0, 0
campo_ativo = None 
input_texto = ""
input_numerico = "" 

criacao_nome = ""
criacao_raca_idx, criacao_classe_idx, criacao_bg_idx = 0, 0, 0
campo_criacao = "nome"

msg_alerta = ""
msg_alerta_timer = 0

dropdown_aberto = None
dropdown_pos = (0, 0)
aba_ativa = "COMBATE" 

scroll_y = 0
editando_aba_lista = None
aba_input_texto = ""
ataque_em_edicao = -1 
scroll_maximo = -2200

def calcular_xp_necessaria(nivel): return nivel * 1000
def get_mod(valor): return (valor - 10) // 2

def desenhar_texto(texto, f, cor, x, y, centralizar=True):
    img = f.render(texto, True, cor)
    rect = img.get_rect(center=(x, y)) if centralizar else img.get_rect(topleft=(x, y))
    tela.blit(img, rect)
    return rect

def desenhar_slider(y, volume, ativo):
    barra_x = (tela.get_width() - 300) // 2
    pygame.draw.rect(tela, (40, 40, 45), (barra_x, y, 300, 6))
    marcador_x = barra_x + int(volume * 300)
    tam = 16
    rect_m = pygame.Rect(marcador_x - tam//2, y + 3 - tam//2, tam, tam)
    cor_m = (255, 255, 255) if ativo else (180, 180, 180)
    pygame.draw.rect(tela, cor_m, rect_m)
    pygame.draw.rect(tela, (210, 210, 210) if ativo else (130, 130, 130), rect_m, 2)

def desenhar_bloco(x, y, w, h, titulo):
    pygame.draw.rect(tela, (25, 25, 30), (x, y, w, h))
    pygame.draw.rect(tela, (80, 80, 90), (x, y, w, h), 2)
    pygame.draw.rect(tela, (40, 40, 45), (x, y, w, 30))
    desenhar_texto(titulo, fonte_p, (200, 200, 200), x + w//2, y + 15)

def desenhar_campo_inline(atk_dict, chave, label, x, y, w, is_cycle=False, m_pos=(0,0), m_click=False, dd_aberto=False):
    global campo_ativo
    active_key = "atkfield_" + chave
    ativo = (campo_ativo == active_key)
    desenhar_texto(label, fonte_pp, (150,150,150), x, y, False)
    
    rect = pygame.Rect(x, y+15, w, 25)
    pygame.draw.rect(tela, (40,40,40), rect)
    pygame.draw.rect(tela, (255,255,0) if ativo else (100,100,100), rect, 1)

    if rect.collidepoint(m_pos) and m_click and not dd_aberto:
        campo_ativo = active_key
        tocar_sfx(sfx_nav)

    val = str(atk_dict.get(chave, ""))
    if is_cycle: val = f"< {val} >"
    elif ativo: val += "|"

    if len(val) > int(w/8) and not is_cycle: val = "..." + val[-(int(w/8)):]
    
    desenhar_texto(val, fonte_p, (255,255,255) if ativo else (200,200,200), x+5, y+20, False)
    return rect

def salvar_valor_numerico():
    global campo_ativo, input_numerico, personagens, char_sel
    if campo_ativo in ["hp_temp", "hp_input"] and input_numerico != "":
        try: personagens[char_sel][campo_ativo] = int(input_numerico)
        except: pass

def tocar_sfx(som):
    if som: som.play()

# --- LOOP PRINCIPAL ---
rodando = True
while rodando:
    dt = relogio.tick(60) 
    m_pos = pygame.mouse.get_pos()
    m_click = False
    teclado_confirmar = False
    
    tela.fill((15, 15, 20))
    
    for ev in pygame.event.get():
        if ev.type == pygame.QUIT: rodando = False
        if ev.type == pygame.MOUSEBUTTONDOWN and ev.button == 1: m_click = True
        
        if ev.type == pygame.MOUSEWHEEL:
            if estado == "PERSONAGEM" and sub_estado_char == "EDITAR" and not dropdown_aberto:
                scroll_y += ev.y * 40
                scroll_y = min(0, scroll_y) 
                scroll_y = max(scroll_maximo, scroll_y)

        if ev.type == pygame.KEYDOWN:
            if sub_estado_char == "CRIAR" and campo_criacao == "nome":
                if ev.key == pygame.K_BACKSPACE: criacao_nome = criacao_nome[:-1]
                elif ev.key != pygame.K_RETURN and ev.key != pygame.K_ESCAPE and len(criacao_nome) < 15: criacao_nome += ev.unicode
            elif sub_estado_char == "DELETAR":
                if ev.key == pygame.K_BACKSPACE: input_texto = input_texto[:-1]
                elif ev.key != pygame.K_RETURN and ev.key != pygame.K_ESCAPE and len(input_texto) < 15: input_texto += ev.unicode
            
            elif estado == "PERSONAGEM" and sub_estado_char == "EDITAR" and campo_ativo and campo_ativo.startswith("atkfield_"):
                real_key = campo_ativo.replace("atkfield_", "")
                if ataque_em_edicao != -1:
                    atk = personagens[char_sel]["combate_ataques"][ataque_em_edicao]
                    is_text_field = real_key in ["nome", "distancia", "dmg1_dado", "dmg1_tipo", "dmg2_dado", "dmg2_tipo", "descricao"]
                    
                    if is_text_field:
                        if ev.key == pygame.K_BACKSPACE: atk[real_key] = atk.get(real_key, "")[:-1]
                        elif ev.key == pygame.K_RETURN: campo_ativo = None
                        elif ev.unicode.isprintable() and len(atk.get(real_key, "")) < 40: atk[real_key] = atk.get(real_key, "") + ev.unicode
                    
                    elif real_key == "atk_bonus":
                        if ev.key == pygame.K_LEFT: atk[real_key] -= 1; tocar_sfx(sfx_nav)
                        elif ev.key == pygame.K_RIGHT: atk[real_key] += 1; tocar_sfx(sfx_nav)
                        
                    else:
                        opts = []
                        if real_key == "tipo": opts = ["Melee", "Ranged", "Spell"]
                        elif real_key in ["atk_abilidade", "dmg1_abilidade", "dmg2_abilidade"]: opts = ["none", "str", "dex", "con", "int", "wis", "cha"]
                        elif real_key == "atk_prof": opts = [0, 1, 2, 3] 

                        if opts:
                            idx = opts.index(atk.get(real_key, opts[0])) if atk.get(real_key, opts[0]) in opts else 0
                            if ev.key == pygame.K_LEFT: atk[real_key] = opts[(idx - 1) % len(opts)]; tocar_sfx(sfx_nav)
                            elif ev.key == pygame.K_RIGHT: atk[real_key] = opts[(idx + 1) % len(opts)]; tocar_sfx(sfx_nav)

            elif estado == "PERSONAGEM" and sub_estado_char == "EDITAR" and editando_aba_lista:
                if ev.key == pygame.K_BACKSPACE: aba_input_texto = aba_input_texto[:-1]
                elif ev.key == pygame.K_RETURN:
                    if aba_input_texto.strip() != "":
                        personagens[char_sel][editando_aba_lista].append({"nome": aba_input_texto.strip()})
                        salvar_config(config)
                    editando_aba_lista = None; aba_input_texto = ""; tocar_sfx(sfx_sel)
                elif ev.unicode.isprintable() and len(aba_input_texto) < 40: 
                    aba_input_texto += ev.unicode

            elif estado == "PERSONAGEM" and sub_estado_char == "EDITAR" and campo_ativo in ["hp_temp", "hp_input"]:
                if ev.key == pygame.K_BACKSPACE: input_numerico = input_numerico[:-1]
                elif ev.key == pygame.K_RETURN: salvar_valor_numerico(); campo_ativo = None
                elif ev.unicode.isnumeric() and len(input_numerico) < 4: input_numerico += ev.unicode

            if estado == "MENU":
                if ev.key in [pygame.K_w, pygame.K_UP]: sel_menu = (sel_menu - 1) % len(opcoes_menu); tocar_sfx(sfx_nav)
                elif ev.key in [pygame.K_s, pygame.K_DOWN]: sel_menu = (sel_menu + 1) % len(opcoes_menu); tocar_sfx(sfx_nav)
                elif ev.key == pygame.K_RETURN: teclado_confirmar = True
            
            elif estado == "OPTIONS":
                if ev.key in [pygame.K_w, pygame.K_UP]: sel_cat = (sel_cat - 1) % len(opcoes_cat); tocar_sfx(sfx_nav)
                elif ev.key in [pygame.K_s, pygame.K_DOWN]: sel_cat = (sel_cat + 1) % len(opcoes_cat); tocar_sfx(sfx_nav)
                elif ev.key == pygame.K_RETURN: teclado_confirmar = True
                
            elif estado in ["AUDIO_SETTINGS", "GRAPHICS_SETTINGS"]:
                max_sub = 2 if estado == "AUDIO_SETTINGS" else 3
                if ev.key in [pygame.K_w, pygame.K_UP]: sel_sub = (sel_sub - 1) % max_sub; tocar_sfx(sfx_nav)
                elif ev.key in [pygame.K_s, pygame.K_DOWN]: sel_sub = (sel_sub + 1) % max_sub; tocar_sfx(sfx_nav)
                elif ev.key == pygame.K_RETURN: teclado_confirmar = True
            
            elif estado == "PERSONAGEM" and sub_estado_char == "CRIAR":
                if ev.key == pygame.K_LEFT:
                    if campo_criacao == "raca": criacao_raca_idx = (criacao_raca_idx - 1) % len(RACAS); tocar_sfx(sfx_nav)
                    elif campo_criacao == "classe": criacao_classe_idx = (criacao_classe_idx - 1) % len(CLASSES); tocar_sfx(sfx_nav)
                    elif campo_criacao == "bg": criacao_bg_idx = (criacao_bg_idx - 1) % len(BACKGROUNDS); tocar_sfx(sfx_nav)
                if ev.key == pygame.K_RIGHT:
                    if campo_criacao == "raca": criacao_raca_idx = (criacao_raca_idx + 1) % len(RACAS); tocar_sfx(sfx_nav)
                    elif campo_criacao == "classe": criacao_classe_idx = (criacao_classe_idx + 1) % len(CLASSES); tocar_sfx(sfx_nav)
                    elif campo_criacao == "bg": criacao_bg_idx = (criacao_bg_idx + 1) % len(BACKGROUNDS); tocar_sfx(sfx_nav)

            elif estado == "PERSONAGEM" and sub_estado_char == "EDITAR" and campo_ativo and not editando_aba_lista and not campo_ativo.startswith("atkfield_"):
                p = personagens[char_sel]
                if ev.key == pygame.K_LEFT:
                    salvar_valor_numerico()
                    if campo_ativo == "xp": p["xp"] = max(0, p["xp"] - 100); tocar_sfx(sfx_nav)
                    elif campo_ativo == "hp_atual": p["hp_atual"] = max(0, p["hp_atual"] - 1); tocar_sfx(sfx_nav)
                    elif campo_ativo == "hp_max": p["hp_max"] = max(1, p["hp_max"] - 1); tocar_sfx(sfx_nav)
                    elif campo_ativo in ["str", "dex", "con", "int", "wis", "cha", "ca", "ca_armor", "ca_dex", "ca_shield"]: 
                        p[campo_ativo] = max(-10, p.get(campo_ativo, 0) - 1); tocar_sfx(sfx_nav)
                    elif campo_ativo in ["deslocamento", "speed_swim", "speed_fly", "speed_climb"]: 
                        p[campo_ativo] = max(0, p.get(campo_ativo, 0) - 5); tocar_sfx(sfx_nav)
                
                if ev.key == pygame.K_RIGHT:
                    salvar_valor_numerico()
                    if campo_ativo == "xp": p["xp"] += 100; tocar_sfx(sfx_nav)
                    elif campo_ativo == "hp_atual": p["hp_atual"] = min(p["hp_max"], p["hp_atual"] + 1); tocar_sfx(sfx_nav)
                    elif campo_ativo == "hp_max": p["hp_max"] += 1; tocar_sfx(sfx_nav)
                    elif campo_ativo in ["str", "dex", "con", "int", "wis", "cha", "ca", "ca_armor", "ca_dex", "ca_shield"]: 
                        p[campo_ativo] = min(100, p.get(campo_ativo, 0) + 1); tocar_sfx(sfx_nav)
                    elif campo_ativo in ["deslocamento", "speed_swim", "speed_fly", "speed_climb"]: 
                        p[campo_ativo] += 5; tocar_sfx(sfx_nav)
            
            elif estado == "PERSONAGEM" and sub_estado_char == "DELETAR" and ev.key == pygame.K_RETURN:
                if input_texto.lower() == "delete":
                    personagens.pop(char_sel); char_sel = 0; sub_estado_char = "LISTA"; tocar_sfx(sfx_sel)
                else: sub_estado_char = "EDITAR"; tocar_sfx(sfx_sel)

            if ev.key == pygame.K_ESCAPE:
                salvar_valor_numerico(); tocar_sfx(sfx_sel)
                if campo_ativo and campo_ativo.startswith("atkfield_"):
                    ataque_em_edicao = -1; campo_ativo = None
                elif editando_aba_lista:
                    editando_aba_lista = None; aba_input_texto = ""
                elif dropdown_aberto:
                    dropdown_aberto = None 
                elif estado == "PERSONAGEM" and sub_estado_char in ["EDITAR", "CRIAR", "DELETAR"]: 
                    sub_estado_char = "LISTA"; campo_ativo = None; scroll_y = 0
                elif estado in ["AUDIO_SETTINGS", "GRAPHICS_SETTINGS"]: estado = "OPTIONS"
                else: estado = "MENU"
                salvar_config(config)

    if dropdown_aberto and m_click:
        dd_rect = pygame.Rect(dropdown_pos[0], dropdown_pos[1], 110, 100) 
        if dd_rect.collidepoint(m_pos):
            idx = (m_pos[1] - dropdown_pos[1]) // 25
            if 0 <= idx < 4:
                personagens[char_sel][f"save_{dropdown_aberto}"] = idx
                tocar_sfx(sfx_sel)
        dropdown_aberto = None; m_click = False 

    largura_t = tela.get_width()
    
    if estado == "MENU":
        desenhar_texto("MEU RPG", fonte_g, (255, 255, 255), largura_t//2, 100)
        for i, opt in enumerate(opcoes_menu):
            c = (255, 255, 0) if i == sel_menu else (180, 180, 180)
            r = desenhar_texto(f">{opt}<" if i == sel_menu else opt, fonte, c, largura_t//2, 250 + i * 65)
            if r.collidepoint(m_pos):
                if sel_menu != i: sel_menu = i; tocar_sfx(sfx_nav)
                if m_click: teclado_confirmar = True
        if teclado_confirmar:
            tocar_sfx(sfx_sel)
            if opcoes_menu[sel_menu].upper() == "SAIR": rodando = False
            else: estado = opcoes_menu[sel_menu].upper()

    elif estado == "PERSONAGEM":
        if sub_estado_char == "LISTA":
            desenhar_texto("SELECIONE O PERSONAGEM", fonte_g, (255, 255, 255), largura_t//2, 80)
            r_novo = desenhar_texto("> CRIAR NOVO <", fonte, (100,255,100), largura_t//2, 150)
            if r_novo.collidepoint(m_pos) and m_click:
                sub_estado_char = "CRIAR"; criacao_nome = f"Heroi {len(personagens)+1}"
                criacao_raca_idx = 0; criacao_classe_idx = 0; criacao_bg_idx = 0; campo_criacao = "nome"; tocar_sfx(sfx_sel)
            
            for i, p in enumerate(personagens):
                cor = (255, 255, 0) if char_sel == i else (180, 180, 180)
                txt = f"{'[X] ' if char_sel == i else '[  ] '}{p['nome']} - {p.get('raca','')} {p.get('classe','')} (Nv.{p.get('nivel',1)})"
                r_txt = fonte.render(txt, True, cor)
                rect_hover = r_txt.get_rect(center=(largura_t//2, 220 + i * 45))
                if rect_hover.collidepoint(m_pos):
                    txt = f">{txt}<"
                    if m_click: char_sel = i; sub_estado_char = "EDITAR"; scroll_y = 0; tocar_sfx(sfx_sel)
                desenhar_texto(txt, fonte, cor, largura_t//2, 220 + i * 45)

        elif sub_estado_char == "CRIAR":
            desenhar_texto("CRIAR NOVO PERSONAGEM", fonte_g, (255, 255, 255), largura_t//2, 100)
            desenhar_texto("Use o Mouse para selecionar e as Setas para trocar.", fonte_p, (130,130,130), largura_t//2, 140)

            c_nome = (255, 255, 0) if campo_criacao == "nome" else (200, 200, 200)
            r_nome = desenhar_texto(f"NOME: {criacao_nome}", fonte, c_nome, largura_t//2, 200)
            if r_nome.collidepoint(m_pos) and m_click: campo_criacao = "nome"; tocar_sfx(sfx_nav)

            c_raca = (255, 255, 0) if campo_criacao == "raca" else (200, 200, 200)
            r_raca = desenhar_texto(f"RACA: < {RACAS[criacao_raca_idx]} >", fonte, c_raca, largura_t//2, 250)
            if r_raca.collidepoint(m_pos) and m_click: campo_criacao = "raca"; tocar_sfx(sfx_nav)

            c_classe = (255, 255, 0) if campo_criacao == "classe" else (200, 200, 200)
            r_classe = desenhar_texto(f"CLASSE: < {CLASSES[criacao_classe_idx]} >", fonte, c_classe, largura_t//2, 300)
            if r_classe.collidepoint(m_pos) and m_click: campo_criacao = "classe"; tocar_sfx(sfx_nav)

            c_bg = (255, 255, 0) if campo_criacao == "bg" else (200, 200, 200)
            r_bg = desenhar_texto(f"ANTECEDENTE: < {BACKGROUNDS[criacao_bg_idx]} >", fonte, c_bg, largura_t//2, 350)
            if r_bg.collidepoint(m_pos) and m_click: campo_criacao = "bg"; tocar_sfx(sfx_nav)

            r_confirmar = desenhar_texto("[ SALVAR PERSONAGEM ]", fonte, (100, 255, 100), largura_t//2, 450)
            if r_confirmar.collidepoint(m_pos) and m_click:
                novo_p = {
                    "nome": criacao_nome if criacao_nome.strip() != "" else "Sem Nome",
                    "raca": RACAS[criacao_raca_idx], "classe": CLASSES[criacao_classe_idx], "background": BACKGROUNDS[criacao_bg_idx],
                    "nivel": 1, "xp": 0, "proficiencia": 2, "iniciativa": 0, "inspiracao": False, "imagem": "",
                    "hp_max": 10, "hp_atual": 10, "hp_temp": 0, "hp_input": 1, "hit_dice_atual": 1,
                    "str": 10, "dex": 10, "con": 10, "int": 10, "wis": 10, "cha": 10, "ca": 10, "deslocamento": 30,
                    "ca_armor": 0, "ca_dex": 0, "ca_shield": 0, "speed_swim": 0, "speed_fly": 0, "speed_climb": 0,
                    "save_str": 0, "save_dex": 0, "save_con": 0, "save_int": 0, "save_wis": 0, "save_cha": 0,
                    "combate_ataques": [], "combate_efeitos": [], "combate_acoes": [], "combate_maestrias": []
                }
                for s_name, _ in SKILLS_LIST: novo_p[f"skill_{s_name.lower().replace(' ', '_')}"] = 0
                personagens.append(novo_p); char_sel = len(personagens) - 1; sub_estado_char = "LISTA"
                salvar_config(config); tocar_sfx(sfx_sel)

        elif sub_estado_char == "EDITAR":
            p = personagens[char_sel]
            
            total_w = 910
            start_x = (largura_t - total_w) // 2
            start_y = 50 + scroll_y
            
            # ==========================================
            # BLOCO 1: MAIN INFO (Esquerda)
            # ==========================================
            box_x, box_y = start_x, start_y
            box_w, box_h = 420, 200
            
            pygame.draw.rect(tela, (20, 20, 20), (box_x, box_y, box_w, box_h))
            pygame.draw.rect(tela, (150, 130, 80), (box_x, box_y, box_w, box_h), 1)

            port_x, port_y = box_x + 15, box_y + 15
            port_size = 110
            port_rect = pygame.Rect(port_x, port_y, port_size, port_size)
            img_surface = obter_imagem_portrait(p.get('imagem', ''), port_size)
            
            if img_surface:
                tela.blit(img_surface, (port_x, port_y))
                pygame.draw.rect(tela, (180, 40, 40), port_rect, 2)
            else:
                pygame.draw.rect(tela, (40, 40, 40), port_rect)
                pygame.draw.rect(tela, (180, 40, 40), port_rect, 2)
                desenhar_texto("Upload", fonte_p, (150, 150, 150), port_rect.centerx, port_rect.centery)

            if port_rect.collidepoint(m_pos):
                pygame.draw.rect(tela, (255, 255, 255), port_rect, 1) 
                if m_click and not dropdown_aberto:
                    salvar_valor_numerico(); novo_caminho = escolher_imagem()
                    if novo_caminho: p['imagem'] = novo_caminho; tocar_sfx(sfx_sel); m_click = False
            
            los_cx, los_cy = port_x + port_size // 2, port_y + port_size
            l_size = 18
            pygame.draw.polygon(tela, (180, 40, 40), [(los_cx, los_cy - l_size), (los_cx + l_size, los_cy), (los_cx, los_cy + l_size), (los_cx - l_size, los_cy)]) 
            desenhar_texto(str(p.get('nivel', 1)), fonte_p, (255, 255, 255), los_cx, los_cy + 2)

            txt_x, txt_y = port_x + port_size + 20, port_y
            desenhar_texto(p['nome'].upper(), fonte_g, (220, 180, 100), txt_x, txt_y - 5, centralizar=False)
            pygame.draw.line(tela, (100, 90, 70), (txt_x, txt_y + 25), (box_x + box_w - 20, txt_y + 25))

            linha_espaco = 22
            xp_atual = p.get('xp', 0); xp_nec = calcular_xp_necessaria(p.get('nivel', 1))

            desenhar_texto(f"{p.get('classe', '')} {p.get('nivel', 1)}", fonte_p, (180,180,180), txt_x, txt_y + 35, False)
            desenhar_texto(f"{p.get('raca', '')} / {p.get('background', '')}", fonte_p, (180,180,180), txt_x, txt_y + 35 + linha_espaco*1, False)
            
            rect_xp = pygame.Rect(txt_x, txt_y + 35 + linha_espaco*2 - 5, 200, 20)
            if rect_xp.collidepoint(m_pos):
                pygame.draw.rect(tela, (255, 255, 255), rect_xp, 1)
                if m_click and not dropdown_aberto: salvar_valor_numerico(); campo_ativo = "xp"; tocar_sfx(sfx_nav); m_click = False
            
            cor_xp = (255, 255, 0) if campo_ativo == "xp" else (150, 150, 200)
            desenhar_texto(f"< Exp: {xp_atual}/{xp_nec} >" if campo_ativo=="xp" else f"Exp: {xp_atual}/{xp_nec}", fonte_p, cor_xp, txt_x, txt_y + 35 + linha_espaco*2, False)
            desenhar_texto(f"Proficiency Bonus +{p.get('proficiencia', 2)}", fonte_p, (120, 120, 120), txt_x, txt_y + 35 + linha_espaco*3, False)

            btn_y = box_y + box_h - 40; btn_h = 28
            
            lv_up_rect = pygame.Rect(box_x + 15, btn_y, 110, btn_h)
            cor_lv_up = (200, 180, 100) if lv_up_rect.collidepoint(m_pos) else (150, 130, 80)
            pygame.draw.rect(tela, (30, 30, 30), lv_up_rect); pygame.draw.rect(tela, cor_lv_up, lv_up_rect, 1)
            desenhar_texto("LEVEL UP", fonte_p, cor_lv_up, lv_up_rect.centerx, lv_up_rect.centery + 2)
            if lv_up_rect.collidepoint(m_pos) and m_click and not dropdown_aberto:
                salvar_valor_numerico()
                if xp_atual >= xp_nec: p['nivel'] += 1; msg_alerta = "NIVEL AUMENTADO!"; msg_alerta_timer = 2000; tocar_sfx(sfx_sel)
                else: msg_alerta = "XP INSUFICIENTE!"; msg_alerta_timer = 2000; tocar_sfx(sfx_nav)
                m_click = False

            insp_rect = pygame.Rect(box_x + 140, btn_y, 125, btn_h)
            is_hover_insp = insp_rect.collidepoint(m_pos)
            cor_insp = (255, 255, 255) if p.get('inspiracao', False) else (120, 120, 120)
            if is_hover_insp: cor_insp = (200, 200, 200) 
            pygame.draw.rect(tela, (30, 30, 30), insp_rect); pygame.draw.rect(tela, cor_insp, insp_rect, 1)
            desenhar_texto("INSPIRATION", fonte_p, cor_insp, insp_rect.centerx, insp_rect.centery + 2)
            if is_hover_insp and m_click and not dropdown_aberto: salvar_valor_numerico(); p['inspiracao'] = not p.get('inspiracao', False); tocar_sfx(sfx_sel); m_click = False

            init_rect = pygame.Rect(box_x + 280, btn_y, 125, btn_h)
            is_hover_init = init_rect.collidepoint(m_pos)
            pygame.draw.rect(tela, (200, 40, 40) if is_hover_init else (160, 30, 30), init_rect, border_radius=4)
            desenhar_texto(f"INITIATIVE +{p.get('iniciativa', 0)}", fonte_p, (255, 255, 255), init_rect.centerx - 2, init_rect.centery + 2)
            if is_hover_init and m_click and not dropdown_aberto:
                salvar_valor_numerico(); tot = random.randint(1, 20) + p.get('iniciativa', 0)
                msg_alerta = f"Iniciativa Rolada: {tot}"; msg_alerta_timer = 3000; tocar_sfx(sfx_sel); m_click = False
                print("-" * 30); print(f"[{p['nome']}] ROLOU INICIATIVA!"); print(f"D20: {tot - p.get('iniciativa', 0)} | Mod: +{p.get('iniciativa', 0)} | Total: {tot}"); print("-" * 30)

            # ==========================================
            # BLOCO 2: HIT POINTS (Direita) 
            # ==========================================
            hp_box_x = box_x + box_w + 20
            hp_box_y = box_y
            hp_box_w = 470
            hp_box_h = 200
            
            pygame.draw.rect(tela, (20, 20, 20), (hp_box_x, hp_box_y, hp_box_w, hp_box_h))
            pygame.draw.rect(tela, (150, 130, 80), (hp_box_x, hp_box_y, hp_box_w, hp_box_h), 1)
            
            desenhar_texto("HIT POINTS", fonte_p, (220, 180, 100), hp_box_x + 15, hp_box_y + 15, False)
            pygame.draw.line(tela, (100, 90, 70), (hp_box_x + 15, hp_box_y + 35), (hp_box_x + hp_box_w - 15, hp_box_y + 35))

            hp_main_rect = pygame.Rect(hp_box_x + 15, hp_box_y + 45, 160, 50)
            pygame.draw.rect(tela, (30, 30, 30), hp_main_rect); pygame.draw.rect(tela, (100, 100, 100), hp_main_rect, 1)
            
            rect_hp_at = pygame.Rect(hp_main_rect.x, hp_main_rect.y, 75, 50)
            if rect_hp_at.collidepoint(m_pos) and m_click and not dropdown_aberto: salvar_valor_numerico(); campo_ativo = "hp_atual"; tocar_sfx(sfx_nav); m_click = False
            cor_hp_at = (255, 255, 0) if campo_ativo == "hp_atual" else (255, 255, 255)
            
            rect_hp_mx = pygame.Rect(hp_main_rect.x + 85, hp_main_rect.y, 75, 50)
            if rect_hp_mx.collidepoint(m_pos) and m_click and not dropdown_aberto: salvar_valor_numerico(); campo_ativo = "hp_max"; tocar_sfx(sfx_nav); m_click = False
            cor_hp_mx = (255, 255, 0) if campo_ativo == "hp_max" else (255, 255, 255)

            desenhar_texto(str(p.get('hp_atual', 10)), fonte_g, cor_hp_at, hp_main_rect.x + 35, hp_main_rect.centery)
            desenhar_texto("/", fonte_g, (150, 150, 150), hp_main_rect.centerx, hp_main_rect.centery)
            desenhar_texto(str(p.get('hp_max', 10)), fonte_g, cor_hp_mx, hp_main_rect.x + 125, hp_main_rect.centery)
            
            perc_hp = p.get('hp_atual', 10) / max(1, p.get('hp_max', 10))
            pygame.draw.rect(tela, (40, 200, 80), (hp_main_rect.x, hp_main_rect.bottom - 4, int(160 * perc_hp), 4))
            desenhar_texto("Current", fonte_p, (150, 150, 150), hp_main_rect.x + 35, hp_main_rect.bottom + 10)
            desenhar_texto("Max", fonte_p, (150, 150, 150), hp_main_rect.x + 125, hp_main_rect.bottom + 10)

            hp_tmp_rect = pygame.Rect(hp_box_x + 190, hp_box_y + 45, 60, 50)
            pygame.draw.rect(tela, (30, 30, 30), hp_tmp_rect); pygame.draw.rect(tela, (100, 100, 100), hp_tmp_rect, 1)
            if hp_tmp_rect.collidepoint(m_pos) and m_click and not dropdown_aberto: 
                salvar_valor_numerico(); campo_ativo = "hp_temp"; input_numerico = str(p.get('hp_temp', 0)); tocar_sfx(sfx_nav); m_click = False
            cor_hp_tmp = (255, 255, 0) if campo_ativo == "hp_temp" else (255, 255, 0) if p.get('hp_temp', 0) > 0 else (150, 150, 150)
            str_tmp = input_numerico if campo_ativo == "hp_temp" else str(p.get('hp_temp', 0))
            desenhar_texto(str_tmp, fonte_g, cor_hp_tmp, hp_tmp_rect.centerx, hp_tmp_rect.centery)
            desenhar_texto("Temp", fonte_p, (150, 150, 150), hp_tmp_rect.centerx, hp_tmp_rect.bottom + 10)

            dmg_rect = pygame.Rect(hp_box_x + 280, hp_box_y + 52, 35, 35)
            val_rect = pygame.Rect(hp_box_x + 325, hp_box_y + 52, 50, 35)
            heal_rect = pygame.Rect(hp_box_x + 385, hp_box_y + 52, 35, 35)
            
            is_hover_dmg = dmg_rect.collidepoint(m_pos)
            pygame.draw.rect(tela, (200, 50, 50) if is_hover_dmg else (150, 40, 40), dmg_rect, border_radius=4)
            desenhar_texto("D", fonte, (255, 255, 255), dmg_rect.centerx, dmg_rect.centery)
            desenhar_texto("Dmg", fonte_p, (150, 150, 150), dmg_rect.centerx, dmg_rect.bottom + 12)

            pygame.draw.rect(tela, (40, 40, 40), val_rect); pygame.draw.rect(tela, (100, 100, 100), val_rect, 1)
            if val_rect.collidepoint(m_pos) and m_click and not dropdown_aberto: 
                salvar_valor_numerico(); campo_ativo = "hp_input"; input_numerico = str(p.get('hp_input', 1)); tocar_sfx(sfx_nav); m_click = False
            cor_hp_inp = (255, 255, 0) if campo_ativo == "hp_input" else (255, 255, 255)
            str_inp = input_numerico if campo_ativo == "hp_input" else str(p.get('hp_input', 1))
            desenhar_texto(str_inp, fonte, cor_hp_inp, val_rect.centerx, val_rect.centery)
            
            is_hover_heal = heal_rect.collidepoint(m_pos)
            pygame.draw.rect(tela, (50, 200, 100) if is_hover_heal else (40, 150, 80), heal_rect, border_radius=4)
            desenhar_texto("H", fonte, (255, 255, 255), heal_rect.centerx, heal_rect.centery)
            desenhar_texto("Heal", fonte_p, (150, 150, 150), heal_rect.centerx, heal_rect.bottom + 12)

            if is_hover_dmg and m_click and not dropdown_aberto:
                salvar_valor_numerico(); campo_ativo = None; dano_restante = p.get('hp_input', 1)
                if p['hp_temp'] > 0:
                    absorvido = min(p['hp_temp'], dano_restante)
                    p['hp_temp'] -= absorvido; dano_restante -= absorvido
                p['hp_atual'] = max(0, p['hp_atual'] - dano_restante); tocar_sfx(sfx_sel); m_click = False
            
            if is_hover_heal and m_click and not dropdown_aberto:
                salvar_valor_numerico(); campo_ativo = None
                p['hp_atual'] = min(p['hp_max'], p['hp_atual'] + p.get('hp_input', 1)); tocar_sfx(sfx_sel); m_click = False

            pygame.draw.line(tela, (100, 90, 70), (hp_box_x + 15, hp_box_y + 120), (hp_box_x + hp_box_w - 15, hp_box_y + 120))

            desenhar_texto("Hit Dice", fonte_p, (150, 150, 150), hp_box_x + 15, hp_box_y + 145, False)
            hd_class = DADOS_DE_VIDA.get(p.get('classe', 'Guerreiro'), "D8")
            hd_desc_rect = pygame.Rect(hp_box_x + 85, hp_box_y + 135, 50, 35)
            pygame.draw.rect(tela, (50, 50, 60), hd_desc_rect); pygame.draw.rect(tela, (100, 100, 120), hd_desc_rect, 1)
            desenhar_texto(hd_class, fonte_p, (200, 200, 200), hd_desc_rect.centerx, hd_desc_rect.centery + 2)
            
            hd_val_rect = pygame.Rect(hp_box_x + 145, hp_box_y + 135, 70, 35)
            is_hover_hd = hd_val_rect.collidepoint(m_pos)
            pygame.draw.rect(tela, (40, 40, 40), hd_val_rect); pygame.draw.rect(tela, (255,255,255) if is_hover_hd else (100, 100, 100), hd_val_rect, 1)
            
            hd_max = p.get('nivel', 1); hd_atual = p.get('hit_dice_atual', hd_max)
            desenhar_texto(f"{hd_atual} / {hd_max}", fonte, (255, 255, 255), hd_val_rect.centerx, hd_val_rect.centery)
            if is_hover_hd and m_click and not dropdown_aberto:
                salvar_valor_numerico()
                if hd_atual > 0:
                    p['hit_dice_atual'] -= 1; mod_con = get_mod(p.get('con', 10)); dado_faces = int(hd_class.replace('D', ''))
                    cura = random.randint(1, dado_faces) + mod_con
                    p['hp_atual'] = min(p['hp_max'], p['hp_atual'] + max(1, cura)) 
                    msg_alerta = f"Hit Die Rolado: Cura +{max(1, cura)}!"; msg_alerta_timer = 3000; tocar_sfx(sfx_sel)
                else: msg_alerta = "Sem Hit Dice restantes!"; msg_alerta_timer = 2000; tocar_sfx(sfx_nav)
                m_click = False

            short_rect = pygame.Rect(hp_box_x + 280, hp_box_y + 138, 70, 30)
            long_rect = pygame.Rect(hp_box_x + 360, hp_box_y + 138, 70, 30)
            is_hover_sh = short_rect.collidepoint(m_pos)
            pygame.draw.rect(tela, (60, 60, 60) if is_hover_sh else (40, 40, 40), short_rect, border_radius=4); pygame.draw.rect(tela, (120, 120, 120), short_rect, 1, border_radius=4)
            desenhar_texto("Short", fonte_p, (220, 220, 220), short_rect.centerx, short_rect.centery + 2)

            is_hover_lg = long_rect.collidepoint(m_pos)
            pygame.draw.rect(tela, (60, 60, 60) if is_hover_lg else (40, 40, 40), long_rect, border_radius=4); pygame.draw.rect(tela, (120, 120, 120), long_rect, 1, border_radius=4)
            desenhar_texto("Long", fonte_p, (220, 220, 220), long_rect.centerx, long_rect.centery + 2)
            
            if is_hover_sh and m_click and not dropdown_aberto: salvar_valor_numerico(); msg_alerta = "Descanso Curto!"; msg_alerta_timer = 2000; tocar_sfx(sfx_sel); m_click = False
            if is_hover_lg and m_click and not dropdown_aberto: 
                salvar_valor_numerico(); p['hp_atual'] = p['hp_max']; p['hp_temp'] = 0; p['hit_dice_atual'] = p['nivel']
                msg_alerta = "HP/Hit Dice Restaurados!"; msg_alerta_timer = 3000; tocar_sfx(sfx_sel); m_click = False

            # ==========================================
            # BLOCO 3 E 4: ABILITIES E AC/SPEED
            # ==========================================
            row2_y = box_y + box_h + 20 
            ab_w, ab_h = 620, 170
            ac_w, ac_h = 270, 200
            
            # --- ABILITIES E SAVES (Esquerda) ---
            pygame.draw.rect(tela, (20, 20, 20), (start_x, row2_y, ab_w, ab_h))
            pygame.draw.rect(tela, (150, 130, 80), (start_x, row2_y, ab_w, ab_h), 1)
            desenhar_texto("ABILITIES & SAVES", fonte_p, (220, 180, 100), start_x + 15, row2_y + 15, False)
            pygame.draw.line(tela, (100, 90, 70), (start_x + 15, row2_y + 35), (start_x + ab_w - 15, row2_y + 35))

            atributos = [("str", "STR"), ("dex", "DEX"), ("con", "CON"), ("int", "INT"), ("wis", "WIS"), ("cha", "CHA")]
            col_w = ab_w // 6
            prof_bonus = p.get('proficiencia', 2)
            
            for idx, (k, nome_attr) in enumerate(atributos):
                col_cx = start_x + (idx * col_w) + (col_w // 2)
                
                desenhar_texto(nome_attr, fonte_p, (200, 200, 200), col_cx - 20, row2_y + 55)
                rect_attr = pygame.Rect(col_cx + 5, row2_y + 45, 30, 20)
                if rect_attr.collidepoint(m_pos):
                    pygame.draw.rect(tela, (255, 255, 255), rect_attr, 1)
                    if m_click and not dropdown_aberto: salvar_valor_numerico(); campo_ativo = k; tocar_sfx(sfx_nav); m_click = False
                cor_attr = (255, 255, 0) if campo_ativo == k else (255, 255, 255)
                desenhar_texto(str(p.get(k, 10)), fonte, cor_attr, col_cx + 20, row2_y + 55)

                desenhar_texto("Mod", fonte_pp, (130, 130, 130), col_cx - 19, row2_y + 85)
                desenhar_texto("Save", fonte_pp, (130, 130, 130), col_cx + 21, row2_y + 85)

                base_mod = get_mod(p.get(k, 10))
                mod_str = f"+{base_mod}" if base_mod >= 0 else str(base_mod)
                mod_rect = pygame.Rect(col_cx - 35, row2_y + 100, 32, 35)
                if mod_rect.collidepoint(m_pos):
                    pygame.draw.rect(tela, (255, 255, 255), mod_rect, 1, border_radius=4)
                    if m_click and not dropdown_aberto:
                        salvar_valor_numerico(); rolagem = random.randint(1, 20); tot = rolagem + base_mod
                        msg_alerta = f"{nome_attr} Check: {tot}"; msg_alerta_timer = 3000; tocar_sfx(sfx_sel); m_click = False
                        print("-" * 30); print(f"[{p['nome']}] ROLOU {nome_attr} CHECK!"); print(f"D20: {rolagem} | Mod: {mod_str} | Total: {tot}"); print("-" * 30)
                else: pygame.draw.rect(tela, (40, 40, 40), mod_rect, border_radius=4)
                desenhar_texto(mod_str, fonte, (255, 255, 255), col_cx - 19, row2_y + 118)

                save_k = f"save_{k}"
                save_state = p.get(save_k, 0) 
                if save_state == 0: s_bonus = 0; s_bg = (60, 40, 40); s_letra = "U"
                elif save_state == 1: s_bonus = prof_bonus // 2; s_bg = (100, 80, 30); s_letra = "H"
                elif save_state == 2: s_bonus = prof_bonus; s_bg = (150, 40, 40); s_letra = "P"
                else: s_bonus = prof_bonus * 2; s_bg = (180, 150, 40); s_letra = "E"
                
                tot_save = base_mod + s_bonus
                tot_save_str = f"+{tot_save}" if tot_save >= 0 else str(tot_save)
                
                save_rect = pygame.Rect(col_cx + 5, row2_y + 100, 32, 35)
                if save_rect.collidepoint(m_pos):
                    pygame.draw.rect(tela, (255, 255, 255), save_rect, 1, border_radius=4)
                    if m_click and not dropdown_aberto:
                        salvar_valor_numerico(); rolagem = random.randint(1, 20); tot = rolagem + tot_save
                        msg_alerta = f"{nome_attr} Save: {tot}"; msg_alerta_timer = 3000; tocar_sfx(sfx_sel); m_click = False
                        print("-" * 30); print(f"[{p['nome']}] ROLOU {nome_attr} SAVE!"); print(f"D20: {rolagem} | Save: {tot_save_str} | Total: {tot}"); print("-" * 30)
                else: pygame.draw.rect(tela, s_bg, save_rect, border_radius=4)
                desenhar_texto(tot_save_str, fonte, (255, 255, 255), col_cx + 21, row2_y + 118)
                
                btn_dd_rect = pygame.Rect(col_cx + 5, row2_y + 140, 32, 16)
                is_hover_btn_dd = btn_dd_rect.collidepoint(m_pos)
                pygame.draw.rect(tela, (60, 60, 60) if is_hover_btn_dd else (40, 40, 40), btn_dd_rect, border_radius=2)
                pygame.draw.rect(tela, (100, 100, 100), btn_dd_rect, 1, border_radius=2)
                desenhar_texto(f"{s_letra} v", fonte_pp, (200, 200, 200), btn_dd_rect.centerx, btn_dd_rect.centery + 1)
                if is_hover_btn_dd and m_click: dropdown_aberto = k; dropdown_pos = (btn_dd_rect.x, btn_dd_rect.bottom); m_click = False

            # --- AC / SPEED (Direita) ---
            ac_x = start_x + ab_w + 20
            pygame.draw.rect(tela, (20, 20, 20), (ac_x, row2_y, ac_w, ac_h))
            pygame.draw.rect(tela, (150, 130, 80), (ac_x, row2_y, ac_w, ac_h), 1)
            desenhar_texto("AC & SPEED", fonte_p, (220, 180, 100), ac_x + 15, row2_y + 15, False)
            pygame.draw.line(tela, (100, 90, 70), (ac_x + 15, row2_y + 35), (ac_x + ac_w - 15, row2_y + 35))

            def desenhar_mini_campo(chave, label, x, y):
                global campo_ativo, m_click
                desenhar_texto(label, fonte_p, (150, 150, 150), x, y, False)
                val_str = str(p.get(chave, 0))
                cor_v = (255, 255, 0) if campo_ativo == chave else (200, 200, 200)
                desenhar_texto(val_str, fonte_p, cor_v, x + 70, y, False)
                rect_clk = pygame.Rect(x + 65, y - 2, 40, 20)
                if rect_clk.collidepoint(m_pos):
                    pygame.draw.rect(tela, (255, 255, 255), rect_clk, 1)
                    if m_click and not dropdown_aberto: salvar_valor_numerico(); campo_ativo = chave; tocar_sfx(sfx_nav); m_click = False

            ac_cx = ac_x + 65
            desenhar_texto("ARMOR CLASS", fonte_pp, (200, 200, 200), ac_cx, row2_y + 55)
            rect_ca = pygame.Rect(ac_cx - 25, row2_y + 65, 50, 40)
            pygame.draw.rect(tela, (40, 40, 40), rect_ca, border_radius=4)
            pygame.draw.rect(tela, (150, 150, 150) if campo_ativo != "ca" else (255, 255, 0), rect_ca, 1, border_radius=4)
            if rect_ca.collidepoint(m_pos) and m_click and not dropdown_aberto: salvar_valor_numerico(); campo_ativo = "ca"; tocar_sfx(sfx_nav); m_click = False
            desenhar_texto(str(p.get("ca", 10)), fonte_g, (255, 255, 0) if campo_ativo == "ca" else (255, 255, 255), ac_cx, row2_y + 85)

            desenhar_mini_campo("ca_armor", "Armor", ac_x + 15, row2_y + 120)
            desenhar_mini_campo("ca_dex", "Dex", ac_x + 15, row2_y + 145)
            desenhar_mini_campo("ca_shield", "Shield", ac_x + 15, row2_y + 170)

            sp_cx = ac_x + 205
            desenhar_texto("SPEED (ft)", fonte_pp, (200, 200, 200), sp_cx, row2_y + 55)
            rect_sp = pygame.Rect(sp_cx - 25, row2_y + 65, 50, 40)
            pygame.draw.rect(tela, (40, 40, 40), rect_sp, border_radius=4)
            pygame.draw.rect(tela, (150, 150, 150) if campo_ativo != "deslocamento" else (255, 255, 0), rect_sp, 1, border_radius=4)
            if rect_sp.collidepoint(m_pos) and m_click and not dropdown_aberto: salvar_valor_numerico(); campo_ativo = "deslocamento"; tocar_sfx(sfx_nav); m_click = False
            desenhar_texto(str(p.get("deslocamento", 30)), fonte_g, (255, 255, 0) if campo_ativo == "deslocamento" else (255, 255, 255), sp_cx, row2_y + 85)

            desenhar_mini_campo("speed_swim", "Swim", ac_x + 155, row2_y + 120)
            desenhar_mini_campo("speed_fly", "Fly", ac_x + 155, row2_y + 145)
            desenhar_mini_campo("speed_climb", "Climb", ac_x + 155, row2_y + 170)

            # ==========================================
            # BLOCO 5: SISTEMA DE ABAS (Tabs) (Lado Esquerdo)
            # ==========================================
            tab_x = start_x
            tab_y = row2_y + ab_h + 20 
            tab_w = ab_w # Fica na coluna da esquerda
            
            if aba_ativa == "COMBATE":
                calc_h = 60 
                calc_h += 25
                for idx_item, atk in enumerate(p.get("combate_ataques", [])):
                    if idx_item == ataque_em_edicao: calc_h += 380 
                    else: calc_h += 35
                calc_h += 15
                
                for q_key in ["combate_efeitos", "combate_acoes", "combate_maestrias"]:
                    calc_h += 25 
                    calc_h += len(p.get(q_key, [])) * 26 
                    if editando_aba_lista == q_key: calc_h += 26 
                    calc_h += 15 
                tab_h = max(220, calc_h)
            else: tab_h = 220

            pygame.draw.rect(tela, (20, 20, 20), (tab_x, tab_y, tab_w, tab_h))
            pygame.draw.rect(tela, (150, 130, 80), (tab_x, tab_y, tab_w, tab_h), 1)

            tabs = ["COMBATE", "SPELLS", "INVENTARIO", "TALENTOS", "NOTAS"]
            tab_widths = [100, 90, 120, 110, 80] 
            current_tx = tab_x + 15

            for i, t in enumerate(tabs):
                t_rect = pygame.Rect(current_tx, tab_y + 10, tab_widths[i], 30)
                is_active = (aba_ativa == t)
                is_hover = t_rect.collidepoint(m_pos)
                
                cor_txt = (220, 180, 100) if is_active else ((255, 255, 255) if is_hover else (150, 150, 150))
                if is_hover and m_click and not dropdown_aberto:
                    salvar_valor_numerico(); aba_ativa = t; tocar_sfx(sfx_nav); m_click = False
                    
                desenhar_texto(t, fonte_p, cor_txt, t_rect.centerx, t_rect.centery)
                if is_active: pygame.draw.line(tela, (220, 180, 100), (t_rect.left + 5, t_rect.bottom), (t_rect.right - 5, t_rect.bottom), 2)
                current_tx += tab_widths[i]

            pygame.draw.line(tela, (100, 90, 70), (tab_x + 15, tab_y + 45), (tab_x + tab_w - 15, tab_y + 45))

            if aba_ativa == "COMBATE":
                current_qy = tab_y + 60
                qx = tab_x + 20
                
                desenhar_texto("ATAQUES", fonte_p, (200, 200, 200), qx, current_qy, False)
                pygame.draw.line(tela, (80, 80, 80), (qx, current_qy + 20), (qx + tab_w - 40, current_qy + 20)) 
                
                add_atk_rect = pygame.Rect(qx + tab_w - 60, current_qy, 20, 20)
                if add_atk_rect.collidepoint(m_pos):
                    pygame.draw.rect(tela, (60, 100, 60), add_atk_rect, border_radius=4)
                    if m_click and not dropdown_aberto:
                        p["combate_ataques"].append({
                            "nome": "New Attack", "tipo": "Melee", "distancia": "5 ft.", "atk_abilidade": "none", "atk_bonus": 0, "atk_prof": 0,
                            "dmg1_dado": "", "dmg1_abilidade": "none", "dmg1_tipo": "", "dmg2_dado": "", "dmg2_abilidade": "none", "dmg2_tipo": "", "descricao": ""
                        })
                        ataque_em_edicao = len(p["combate_ataques"]) - 1
                        tocar_sfx(sfx_sel); m_click = False
                else: pygame.draw.rect(tela, (40, 80, 40), add_atk_rect, border_radius=4)
                desenhar_texto("+", fonte_p, (255, 255, 255), add_atk_rect.centerx, add_atk_rect.centery)
                
                current_qy += 25
                
                for idx_item, atk in enumerate(p.get("combate_ataques", [])):
                    if idx_item == ataque_em_edicao:
                        exp_rect = pygame.Rect(qx, current_qy, tab_w - 40, 370)
                        pygame.draw.rect(tela, (25, 25, 30), exp_rect, border_radius=8)
                        pygame.draw.rect(tela, (100, 100, 100), exp_rect, 1, border_radius=8)

                        desenhar_texto(f"EDIT: {atk.get('nome', '').upper()}", fonte_p, (255, 255, 255), qx + 10, current_qy + 15, False)
                        
                        btn_done = pygame.Rect(qx + tab_w - 110, current_qy + 5, 60, 25)
                        if btn_done.collidepoint(m_pos):
                            pygame.draw.rect(tela, (80, 120, 80), btn_done, border_radius=4)
                            if m_click and not dropdown_aberto: ataque_em_edicao = -1; campo_ativo = None; tocar_sfx(sfx_sel); m_click = False
                        else: pygame.draw.rect(tela, (60, 100, 60), btn_done, border_radius=4)
                        desenhar_texto("DONE", fonte_pp, (255, 255, 255), btn_done.centerx, btn_done.centery)

                        cy = current_qy + 45
                        desenhar_campo_inline(atk, "nome", "NAME:", qx + 10, cy, 180, m_pos=m_pos, m_click=m_click, dd_aberto=dropdown_aberto)
                        desenhar_campo_inline(atk, "tipo", "TYPE:", qx + 200, cy, 120, is_cycle=True, m_pos=m_pos, m_click=m_click, dd_aberto=dropdown_aberto)
                        desenhar_campo_inline(atk, "distancia", "REACH/RANGE:", qx + 330, cy, 120, m_pos=m_pos, m_click=m_click, dd_aberto=dropdown_aberto)

                        cy += 55
                        desenhar_campo_inline(atk, "atk_abilidade", "ATTACK ABILITY:", qx + 10, cy, 150, is_cycle=True, m_pos=m_pos, m_click=m_click, dd_aberto=dropdown_aberto)
                        desenhar_campo_inline(atk, "atk_bonus", "BONUS:", qx + 170, cy, 80, is_cycle=True, m_pos=m_pos, m_click=m_click, dd_aberto=dropdown_aberto)
                        
                        prof_str = ["Untrained", "Half", "Proficient", "Expertise"][atk.get("atk_prof", 0)]
                        desenhar_texto("PROFICIENCY:", fonte_pp, (150,150,150), qx + 260, cy, False)
                        p_rect = pygame.Rect(qx + 260, cy + 15, 120, 25)
                        pygame.draw.rect(tela, (40,40,40), p_rect); pygame.draw.rect(tela, (255,255,0) if campo_ativo == "atkfield_atk_prof" else (100,100,100), p_rect, 1)
                        if p_rect.collidepoint(m_pos) and m_click and not dropdown_aberto: campo_ativo = "atkfield_atk_prof"; tocar_sfx(sfx_nav); m_click = False
                        desenhar_texto(f"< {prof_str} >", fonte_p, (255,255,255) if campo_ativo == "atkfield_atk_prof" else (200,200,200), p_rect.x+5, p_rect.y+13, False)

                        cy += 55
                        desenhar_campo_inline(atk, "dmg1_dado", "DMG 1 DICE:", qx + 10, cy, 100, m_pos=m_pos, m_click=m_click, dd_aberto=dropdown_aberto)
                        desenhar_campo_inline(atk, "dmg1_abilidade", "ABILITY:", qx + 120, cy, 100, is_cycle=True, m_pos=m_pos, m_click=m_click, dd_aberto=dropdown_aberto)
                        desenhar_campo_inline(atk, "dmg1_tipo", "TYPE:", qx + 230, cy, 120, m_pos=m_pos, m_click=m_click, dd_aberto=dropdown_aberto)

                        cy += 55
                        desenhar_campo_inline(atk, "dmg2_dado", "DMG 2 DICE:", qx + 10, cy, 100, m_pos=m_pos, m_click=m_click, dd_aberto=dropdown_aberto)
                        desenhar_campo_inline(atk, "dmg2_abilidade", "ABILITY:", qx + 120, cy, 100, is_cycle=True, m_pos=m_pos, m_click=m_click, dd_aberto=dropdown_aberto)
                        desenhar_campo_inline(atk, "dmg2_tipo", "TYPE:", qx + 230, cy, 120, m_pos=m_pos, m_click=m_click, dd_aberto=dropdown_aberto)

                        cy += 55
                        desenhar_campo_inline(atk, "descricao", "DESCRIPTION:", qx + 10, cy, 500, m_pos=m_pos, m_click=m_click, dd_aberto=dropdown_aberto)

                        cy += 55
                        btn_rem = pygame.Rect(qx + 10, cy, 100, 25)
                        is_hover_rem = btn_rem.collidepoint(m_pos)
                        pygame.draw.rect(tela, (150, 50, 50) if is_hover_rem else (100, 40, 40), btn_rem, border_radius=4)
                        desenhar_texto("[-] Remove", fonte_p, (255, 255, 255), btn_rem.centerx, btn_rem.centery)
                        if is_hover_rem and m_click and not dropdown_aberto:
                            p["combate_ataques"].pop(idx_item); ataque_em_edicao = -1; campo_ativo = None; tocar_sfx(sfx_sel); m_click = False; break

                        current_qy += 380
                    else:
                        nome = atk.get("nome", "Attack")
                        mod = 0
                        if atk.get("atk_abilidade", "none") != "none": mod = get_mod(p.get(atk["atk_abilidade"], 10))
                        prof_idx = atk.get("atk_prof", 0)
                        if prof_idx == 1: mod += prof_bonus // 2
                        elif prof_idx == 2: mod += prof_bonus
                        elif prof_idx == 3: mod += prof_bonus * 2
                        mod += atk.get("atk_bonus", 0)
                        hit_str = f"+{mod} To Hit" if mod >= 0 else f"{mod} To Hit"

                        dmg_str = atk.get("dmg1_dado", "")
                        if dmg_str:
                            if atk.get("dmg1_abilidade", "none") != "none":
                                m1 = get_mod(p.get(atk["dmg1_abilidade"], 10))
                                dmg_str += f"+{m1}" if m1 >= 0 else str(m1)
                            if atk.get("dmg1_tipo", ""): dmg_str += f" {atk['dmg1_tipo']}"
                        
                        row_rect = pygame.Rect(qx, current_qy, tab_w - 40, 35) 
                        if row_rect.collidepoint(m_pos):
                            pygame.draw.rect(tela, (40, 40, 45), row_rect, border_radius=4)
                            if m_click and not dropdown_aberto: ataque_em_edicao = idx_item; tocar_sfx(sfx_sel); m_click = False

                        text_y = current_qy + 8 
                        desenhar_texto(nome, fonte_p, (220, 220, 220), qx + 5, text_y, False)
                        desenhar_texto(atk.get("distancia", "--"), fonte_pp, (150, 150, 150), qx + 180, text_y + 2, False)
                        desenhar_texto(hit_str, fonte_p, (200, 100, 100), qx + 280, text_y, False)
                        desenhar_texto(dmg_str, fonte_p, (150, 150, 150), qx + 400, text_y, False)
                        desenhar_texto("v", fonte_p, (150, 150, 150), qx + tab_w - 60, text_y)
                        
                        pygame.draw.line(tela, (50, 50, 50), (qx, current_qy + 35), (qx + tab_w - 40, current_qy + 35))
                        current_qy += 35 
                current_qy += 15

                quads = [("EFEITOS", "combate_efeitos"), ("AÇÕES", "combate_acoes"), ("MAESTRIAS", "combate_maestrias")]
                for q_title, q_key in quads:
                    desenhar_texto(q_title, fonte_p, (200, 200, 200), qx, current_qy, False)
                    pygame.draw.line(tela, (80, 80, 80), (qx, current_qy + 20), (qx + tab_w - 40, current_qy + 20)) 
                    
                    add_rect = pygame.Rect(qx + tab_w - 60, current_qy, 20, 20)
                    is_hover_add = add_rect.collidepoint(m_pos)
                    pygame.draw.rect(tela, (60, 100, 60) if is_hover_add else (40, 80, 40), add_rect, border_radius=4)
                    desenhar_texto("+", fonte_p, (255, 255, 255), add_rect.centerx, add_rect.centery)
                    
                    if is_hover_add and m_click and not dropdown_aberto:
                        editando_aba_lista = q_key; aba_input_texto = ""; tocar_sfx(sfx_sel); m_click = False
                        
                    current_qy += 25
                    
                    item_list = p.get(q_key, [])
                    for idx_item, itm in enumerate(item_list):
                        desenhar_texto(itm["nome"], fonte_pp, (180, 180, 180), qx + 5, current_qy + 6) 
                        del_rect = pygame.Rect(qx + tab_w - 60, current_qy + 3, 20, 20) 
                        if del_rect.collidepoint(m_pos):
                            pygame.draw.rect(tela, (200, 50, 50), del_rect, border_radius=4)
                            if m_click and not dropdown_aberto:
                                item_list.pop(idx_item); tocar_sfx(sfx_sel); m_click = False; break
                        else:
                            desenhar_texto("x", fonte_pp, (100, 50, 50), del_rect.centerx, del_rect.centery)
                        current_qy += 26 

                    if editando_aba_lista == q_key:
                        pygame.draw.rect(tela, (40, 40, 40), (qx, current_qy, tab_w - 90, 22))
                        pygame.draw.rect(tela, (255, 255, 0), (qx, current_qy, tab_w - 90, 22), 1)
                        desenhar_texto(aba_input_texto + "|", fonte_pp, (255, 255, 255), qx + 5, current_qy + 11)
                        current_qy += 26
                    current_qy += 15
            else:
                desenhar_texto(f"Area de {aba_ativa} em construcao...", fonte_p, (100, 100, 100), tab_x + tab_w//2, tab_y + 120)

            # ==========================================
            # BLOCO 6: SKILLS (Direita, abaixo de AC/SPEED)
            # ==========================================
            sk_x = ac_x
            sk_y = row2_y + ac_h + 20
            sk_w = ac_w
            sk_h = 50 + len(SKILLS_LIST) * 30 + 10

            pygame.draw.rect(tela, (20, 20, 20), (sk_x, sk_y, sk_w, sk_h))
            pygame.draw.rect(tela, (150, 130, 80), (sk_x, sk_y, sk_w, sk_h), 1)
            desenhar_texto("SKILLS", fonte_p, (220, 180, 100), sk_x + 15, sk_y + 15, False)
            pygame.draw.line(tela, (100, 90, 70), (sk_x + 15, sk_y + 35), (sk_x + sk_w - 15, sk_y + 35))

            current_sy = sk_y + 50
            for s_name, s_attr in SKILLS_LIST:
                s_key = f"skill_{s_name.lower().replace(' ', '_')}"
                s_state = p.get(s_key, 0)

                desenhar_texto(s_name, fonte_p, (220, 220, 220), sk_x + 15, current_sy, False)
                desenhar_texto(s_attr.upper(), fonte_pp, (150, 150, 150), sk_x + 140, current_sy + 2, False)

                base_mod = get_mod(p.get(s_attr, 10))
                if s_state == 0: s_bonus = 0
                elif s_state == 1: s_bonus = prof_bonus // 2
                elif s_state == 2: s_bonus = prof_bonus
                else: s_bonus = prof_bonus * 2
                
                tot_mod = base_mod + s_bonus
                tot_mod_str = f"+{tot_mod}" if tot_mod >= 0 else str(tot_mod)

                mod_rect = pygame.Rect(sk_x + 180, current_sy - 5, 35, 25)
                if mod_rect.collidepoint(m_pos):
                    pygame.draw.rect(tela, (255, 255, 255), mod_rect, 1, border_radius=4)
                    if m_click and not dropdown_aberto:
                        salvar_valor_numerico()
                        rolagem = random.randint(1, 20); tot = rolagem + tot_mod
                        msg_alerta = f"{s_name} Check: {tot}"; msg_alerta_timer = 3000; tocar_sfx(sfx_sel); m_click = False
                        print("-" * 30); print(f"[{p['nome']}] ROLOU {s_name.upper()}!"); print(f"D20: {rolagem} | Mod: {tot_mod_str} | Total: {tot}"); print("-" * 30)
                else:
                    pygame.draw.rect(tela, (40, 40, 40) if s_state == 0 else (100, 30, 30), mod_rect, border_radius=4)
                    pygame.draw.rect(tela, (100, 100, 100) if s_state == 0 else (150, 50, 50), mod_rect, 1, border_radius=4)
                    
                desenhar_texto(tot_mod_str, fonte_p, (255, 255, 255), mod_rect.centerx, mod_rect.centery)

                prof_rect = pygame.Rect(sk_x + 230, current_sy - 2, 20, 20)
                prof_center = prof_rect.center

                if prof_rect.collidepoint(m_pos) and m_click and not dropdown_aberto:
                    salvar_valor_numerico(); p[s_key] = (s_state + 1) % 4; tocar_sfx(sfx_nav); m_click = False

                if s_state == 0: pygame.draw.circle(tela, (80, 80, 80), prof_center, 7, 1) 
                elif s_state == 1: pygame.draw.circle(tela, (200, 150, 50), prof_center, 7) 
                elif s_state == 2: pygame.draw.circle(tela, (150, 40, 40), prof_center, 7) 
                elif s_state == 3: pygame.draw.circle(tela, (220, 180, 100), prof_center, 7); pygame.draw.circle(tela, (255, 255, 255), prof_center, 7, 1)

                current_sy += 30

            # Atualiza Scroll Máximo com base em qual coluna foi mais longa
            max_y_content = max(tab_y + tab_h, sk_y + sk_h)
            scroll_maximo = min(0, - (max_y_content - tela.get_height() + 200))

            # --- DROPDOWN (Sobrepondo tudo) ---
            if dropdown_aberto:
                dd_x, dd_y = dropdown_pos
                dd_w, dd_h = 110, 100
                pygame.draw.rect(tela, (30, 30, 30), (dd_x, dd_y, dd_w, dd_h))
                pygame.draw.rect(tela, (200, 200, 200), (dd_x, dd_y, dd_w, dd_h), 1)
                opcoes_dd = ["[U] Untrained", "[H] Half Prof", "[P] Proficient", "[E] Expertise"]
                for i, opt in enumerate(opcoes_dd):
                    opt_rect = pygame.Rect(dd_x, dd_y + i*25, dd_w, 25)
                    if opt_rect.collidepoint(m_pos): pygame.draw.rect(tela, (60, 60, 60), opt_rect)
                    desenhar_texto(opt, fonte_pp, (200, 200, 200), opt_rect.centerx, opt_rect.centery)

            if msg_alerta_timer > 0:
                alerta_rect = pygame.Rect(largura_t//2 - 150, 10, 300, 30) 
                pygame.draw.rect(tela, (40, 20, 20), alerta_rect); pygame.draw.rect(tela, (255, 50, 50), alerta_rect, 1)
                desenhar_texto(msg_alerta, fonte_p, (255, 200, 200), alerta_rect.centerx, alerta_rect.centery)

            btn_exit_y = max_y_content + 30
            r_back = desenhar_texto("[ VOLTAR PARA LISTA ]", fonte, (150, 150, 150), start_x + 100, btn_exit_y)
            if r_back.collidepoint(m_pos) and m_click and not dropdown_aberto: 
                salvar_valor_numerico(); sub_estado_char = "LISTA"; scroll_y = 0; tocar_sfx(sfx_sel)
            
            r_del = desenhar_texto("[ DELETAR ]", fonte, (200, 80, 80), start_x + total_w - 100, btn_exit_y)
            if r_del.collidepoint(m_pos) and m_click and not dropdown_aberto: 
                salvar_valor_numerico(); sub_estado_char = "DELETAR"; input_texto = ""; tocar_sfx(sfx_sel)

        elif sub_estado_char == "DELETAR":
            tela.fill((60, 0, 0))
            desenhar_texto("ZONA DE PERIGO", fonte_g, (255, 50, 50), largura_t//2, 100)
            desenhar_texto("Para deletar este personagem para sempre,", fonte, (200, 200, 200), largura_t//2, 180)
            desenhar_texto("digite 'delete' e aperte ENTER:", fonte, (200, 200, 200), largura_t//2, 210)
            desenhar_texto(f"[ {input_texto} ]", fonte_g, (255, 255, 0), largura_t//2, 300)
            if desenhar_texto("[ CANCELAR ]", fonte, (150, 150, 150), largura_t//2, 450).collidepoint(m_pos) and m_click:
                sub_estado_char = "EDITAR"; tocar_sfx(sfx_sel)

    elif estado == "OPTIONS":
        desenhar_texto("CATEGORIAS", fonte_g, (255, 255, 255), largura_t//2, 100)
        for i, cat in enumerate(opcoes_cat):
            cor = (255, 255, 0) if i == sel_cat else (180, 180, 180)
            r = desenhar_texto(f">{cat}<" if i == sel_cat else cat, fonte, cor, largura_t//2, 250 + i * 80)
            if r.collidepoint(m_pos):
                if sel_cat != i: sel_cat = i; tocar_sfx(sfx_nav)
                if m_click: teclado_confirmar = True
        if teclado_confirmar:
            estado = "AUDIO_SETTINGS" if sel_cat == 0 else "GRAPHICS_SETTINGS"
            sel_sub = 0; tocar_sfx(sfx_sel)

    elif estado == "AUDIO_SETTINGS":
        desenhar_texto("AUDIO", fonte_g, (255, 255, 255), largura_t//2, 40)
        c0 = (255, 255, 0) if sel_sub == 0 else (180, 180, 180)
        r1 = desenhar_texto(f">MUSICA: {int(vol_musica*100)}%<" if sel_sub == 0 else f"MUSICA: {int(vol_musica*100)}%", fonte, c0, largura_t//2, 150)
        desenhar_slider(190, vol_musica, sel_sub == 0)
        c1 = (255, 255, 0) if sel_sub == 1 else (180, 180, 180)
        r2 = desenhar_texto(f">SFX: {int(vol_sfx*100)}%<" if sel_sub == 1 else f"SFX: {int(vol_sfx*100)}%", fonte, c1, largura_t//2, 250)
        desenhar_slider(290, vol_sfx, sel_sub == 1)
        if r1.collidepoint(m_pos): sel_sub = 0
        if r2.collidepoint(m_pos): sel_sub = 1
        keys = pygame.key.get_pressed()
        if sel_sub == 0:
            if keys[pygame.K_LEFT]: vol_musica = max(0, vol_musica - 0.01); pygame.mixer.music.set_volume(vol_musica)
            if keys[pygame.K_RIGHT]: vol_musica = min(1, vol_musica + 0.01); pygame.mixer.music.set_volume(vol_musica)
        else:
            if keys[pygame.K_LEFT]: vol_sfx = max(0, vol_sfx - 0.01); sfx_nav.set_volume(vol_sfx); sfx_sel.set_volume(vol_sfx)
            if keys[pygame.K_RIGHT]: vol_sfx = min(1, vol_sfx + 0.01); sfx_nav.set_volume(vol_sfx); sfx_sel.set_volume(vol_sfx)

    elif estado == "GRAPHICS_SETTINGS":
        desenhar_texto("GRAFICOS", fonte_g, (255, 255, 255), largura_t//2, 40)
        if video_modo != "BORDERLESS":
            cor_res = (255, 255, 0) if sel_sub == 0 else (180, 180, 180)
            txt_res = f"RES: {res_opcoes[res_idx][0]}x{res_opcoes[res_idx][1]}"
            r1 = desenhar_texto(f"<{txt_res}>" if sel_sub == 0 else txt_res, fonte, cor_res, largura_t//2, 200)
            if r1.collidepoint(m_pos): sel_sub = 0
            if r1.collidepoint(m_pos) and m_click: teclado_confirmar = True
        else:
            desenhar_texto("RES: AUTO (DESKTOP)", fonte, (60, 60, 60), largura_t//2, 200)
            if sel_sub == 0: sel_sub = 1 
        cor_m = (255, 255, 0) if sel_sub == 1 else (180, 180, 180)
        txt_modo = f"MODO: {video_modo}"
        r2 = desenhar_texto(f"<{txt_modo}>" if sel_sub == 1 else txt_modo, fonte, cor_m, largura_t//2, 280)
        if r2.collidepoint(m_pos): sel_sub = 1
        if r2.collidepoint(m_pos) and m_click: teclado_confirmar = True
        cor_fps = (255, 255, 0) if sel_sub == 2 else (180, 180, 180)
        txt_fps = f"MOSTRAR FPS: {'ON' if show_fps else 'OFF'}"
        r3 = desenhar_texto(f"<{txt_fps}>" if sel_sub == 2 else txt_fps, fonte, cor_fps, largura_t//2, 360)
        if r3.collidepoint(m_pos): sel_sub = 2
        if r3.collidepoint(m_pos) and m_click: teclado_confirmar = True

        if teclado_confirmar:
            tocar_sfx(sfx_sel)
            if sel_sub == 0 and video_modo != "BORDERLESS":
                res_idx = (res_idx + 1) % len(res_opcoes)
                tela = aplicar_video()
            elif sel_sub == 1:
                video_modo = modos_video[(modos_video.index(video_modo) + 1) % len(modos_video)]
                tela = aplicar_video()
            elif sel_sub == 2: show_fps = not show_fps
            salvar_config({"vol_musica": vol_musica, "vol_sfx": vol_sfx, "res_idx": res_idx, "video_modo": video_modo, "personagens": personagens, "char_selecionado": char_sel, "show_fps": show_fps})

    if estado in ["OPTIONS", "AUDIO_SETTINGS", "GRAPHICS_SETTINGS"]:
        if desenhar_texto("[ VOLTAR (ESC) ]", fonte, (150,150,150), largura_t//2, tela.get_height()-50).collidepoint(m_pos) and m_click:
            estado = "OPTIONS" if estado in ["AUDIO_SETTINGS", "GRAPHICS_SETTINGS"] else "MENU"
            tocar_sfx(sfx_sel)

    if show_fps:
        fps_val = int(relogio.get_fps())
        desenhar_texto(f"FPS: {fps_val}", fonte_p, (200, 200, 0), tela.get_width() - 80, 20, centralizar=False)

    pygame.display.flip()

salvar_config({"vol_musica": vol_musica, "vol_sfx": vol_sfx, "res_idx": res_idx, "video_modo": video_modo, "personagens": personagens, "char_selecionado": char_sel, "show_fps": show_fps})
pygame.quit()
sys.exit(0)
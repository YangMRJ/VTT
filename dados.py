import json
import os

ARQUIVO_CONFIG = "settings.json"

SKILLS_LIST = [
    ("Acrobatics", "dex"), ("Animal Handling", "wis"), ("Arcana", "int"),
    ("Athletics", "str"), ("Deception", "cha"), ("History", "int"),
    ("Insight", "wis"), ("Intimidation", "cha"), ("Investigation", "int"),
    ("Medicine", "wis"), ("Nature", "int"), ("Perception", "wis"),
    ("Performance", "cha"), ("Persuasion", "cha"), ("Religion", "int"),
    ("Sleight Of Hand", "dex"), ("Stealth", "dex"), ("Survival", "wis")
]

RACAS = ["Humano", "Elfo", "Anao", "Orc", "Halfling", "Draconato"]
CLASSES = ["Guerreiro", "Mago", "Ladino", "Clerigo", "Paladino", "Bardo", "Barbaro"]
BACKGROUNDS = ["Acolito", "Criminoso", "Viajante", "Nobre", "Sabio", "Soldado"]
DADOS_DE_VIDA = {"Mago": "D6", "Bardo": "D8", "Clerigo": "D8", "Ladino": "D8", "Guerreiro": "D10", "Paladino": "D10", "Barbaro": "D12"}

res_opcoes = [(1024, 768), (1280, 720), (1366, 768), (1600, 900), (1920, 1080)]
modos_video = ["JANELA", "FULLSCREEN", "BORDERLESS"]

def calcular_xp_necessaria(nivel): return nivel * 1000
def get_mod(valor): return (valor - 10) // 2

def carregar_config():
    padrao = {
        "vol_musica": 0.5, "vol_sfx": 0.5, "res_idx": 0, "video_modo": "JANELA", 
        "personagens": [], "char_selecionado": -1, 
        "campanhas": [], "campanha_selecionada": 0, 
        "campanhas_jogador": [], "show_fps": False,
        "show_grid_coords": False # <-- NOVO
    }
    if os.path.exists(ARQUIVO_CONFIG):
        try:
            with open(ARQUIVO_CONFIG, "r") as f: 
                dados = json.load(f)
                
                if "campanhas" not in dados: dados["campanhas"] = []
                if "campanha_selecionada" not in dados: dados["campanha_selecionada"] = 0
                if "campanhas_jogador" not in dados: dados["campanhas_jogador"] = []
                if "show_grid_coords" not in dados: dados["show_grid_coords"] = False
                if "char_selecionado" not in dados: dados["char_selecionado"] = -1

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
                            "ca_armor": 0, "ca_dex": 0, "ca_shield": 0, "speed_swim": 0, "speed_fly": 0, "speed_climb": 0,
                            "save_str": 0, "save_dex": 0, "save_con": 0, "save_int": 0, "save_wis": 0, "save_cha": 0,
                            "combate_ataques": [], "combate_efeitos": [], "combate_acoes": [], "combate_maestrias": []
                        }
                        
                        for s_name, _ in SKILLS_LIST: dnd_keys[f"skill_{s_name.lower().replace(' ', '_')}"] = 0
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
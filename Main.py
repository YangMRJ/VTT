import pygame
import sys

# --- CONFIGURAÇÕES E INICIALIZAÇÃO ---
pygame.init()
pygame.mixer.init()
LARGURA, ALTURA = 1280, 720
tela = pygame.display.set_mode((LARGURA, ALTURA))
relogio = pygame.time.Clock()

# Cores
PRETO, BRANCO, AMARELO, CINZA = (0, 0, 0), (255, 255, 255), (255, 255, 0), (40, 40, 40)
CINZA_L = (100, 100, 100)

# Fontes
try:
    fonte_p = pygame.font.Font("Minecraft.ttf", 25)
    fonte_m = pygame.font.Font("Minecraft.ttf", 35)
except:
    fonte_p = pygame.font.SysFont("Arial", 25)
    fonte_m = pygame.font.SysFont("Arial", 35)

# --- VARIÁVEIS DE ESTADO DO JOGO ---
mostrar_fps = False
resolucoes = ["800x600", "1280x720", "1600x900", "1920x1080"]
res_index = 1
modos_tela = ["Window", "Borderless", "Full Screen"]
modo_index = 0
vol_musica = 0.5
vol_sfx = 0.7

estado_atual = "opcoes" # Começando direto em opções para teste
aba_selecionada = 0
abas = ["Geral", "Gráficos", "Áudio"]

# --- CLASSES DE INTERFACE (UI) ---

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

# Instâncias dos Sliders
slider_musica = Slider(540, 300, 300, vol_musica)
slider_sfx = Slider(540, 400, 300, vol_sfx)

# --- FUNÇÕES DE DESENHO ---

def desenhar_aba_geral(box_rect):
    global mostrar_fps
    txt = fonte_m.render("Mostrar FPS:", True, BRANCO)
    tela.blit(txt, (box_rect.left + 100, box_rect.top + 150))
    
    # Checkbox
    check_rect = pygame.Rect(box_rect.left + 400, box_rect.top + 155, 30, 30)
    pygame.draw.rect(tela, BRANCO, check_rect, 2)
    if mostrar_fps:
        pygame.draw.rect(tela, AMARELO, check_rect.inflate(-10, -10))
    return [("fps", check_rect)]

def desenhar_aba_graficos(box_rect):
    # Resolução
    txt_res = fonte_m.render(f"Resolução: < {resolucoes[res_index]} >", True, BRANCO)
    res_rect = txt_res.get_rect(topleft=(box_rect.left + 100, box_rect.top + 150))
    tela.blit(txt_res, res_rect)
    
    # Modo de Tela
    txt_modo = fonte_m.render(f"Modo: < {modos_tela[modo_index]} >", True, BRANCO)
    modo_rect = txt_modo.get_rect(topleft=(box_rect.left + 100, box_rect.top + 250))
    tela.blit(txt_modo, modo_rect)
    return [("res", res_rect), ("modo", modo_rect)]

def desenhar_aba_audio(box_rect):
    tela.blit(fonte_m.render("Música", True, BRANCO), (box_rect.left + 100, 285))
    slider_musica.desenhar(tela)
    tela.blit(fonte_m.render("SFX", True, BRANCO), (box_rect.left + 100, 385))
    slider_sfx.desenhar(tela)

def desenhar_estrutura_opcoes():
    tela.fill(PRETO)
    # Box
    largura_box, altura_box = 1000, 550
    box_rect = pygame.Rect((LARGURA//2 - largura_box//2, ALTURA//2 - altura_box//2 + 30), (largura_box, altura_box))
    pygame.draw.rect(tela, CINZA, box_rect, border_radius=10)
    pygame.draw.rect(tela, BRANCO, box_rect, 3, border_radius=10)
    
    # Seta Voltar
    surf_voltar = fonte_m.render("<", True, AMARELO)
    rect_voltar = surf_voltar.get_rect(topleft=(box_rect.left + 25, box_rect.top + 25))
    tela.blit(surf_voltar, rect_voltar)

    # Abas Centralizadas
    largura_total_abas = 600
    inicio_x = box_rect.centerx - (largura_total_abas // 2)
    areas_abas = []

    for i, nome in enumerate(abas):
        cor = AMARELO if i == aba_selecionada else BRANCO
        surf_aba = fonte_m.render(nome, True, cor)
        rect_aba = surf_aba.get_rect(center=(inicio_x + i * 250, box_rect.top + 45))
        if i == aba_selecionada:
            pygame.draw.line(tela, AMARELO, (rect_aba.left, rect_aba.bottom), (rect_aba.right, rect_aba.bottom), 3)
        tela.blit(surf_aba, rect_aba)
        areas_abas.append(rect_aba)

    # Conteúdo das Abas
    interativos = []
    if aba_selecionada == 0: interativos = desenhar_aba_geral(box_rect)
    elif aba_selecionada == 1: interativos = desenhar_aba_graficos(box_rect)
    elif aba_selecionada == 2: desenhar_aba_audio(box_rect)

    return rect_voltar, areas_abas, interativos

# --- LOOP PRINCIPAL ---
while True:
    mouse_pos = pygame.mouse.get_pos()
    clique = pygame.mouse.get_pressed()[0]
    
    rect_voltar, areas_abas, interativos = desenhar_estrutura_opcoes()

    # Atualiza Sliders se estiver na aba de áudio
    if aba_selecionada == 2:
        if slider_musica.atualizar(mouse_pos, clique):
            vol_musica = slider_musica.valor
            pygame.mixer.music.set_volume(vol_musica)
        if slider_sfx.atualizar(mouse_pos, clique):
            vol_sfx = slider_sfx.valor

    for evento in pygame.event.get():
        if evento.type == pygame.QUIT:
            pygame.quit()
            sys.exit()
        
        if evento.type == pygame.MOUSEBUTTONDOWN and evento.button == 1:
            if rect_voltar.collidepoint(mouse_pos):
                print("Voltando...") # Aqui você mudaria o estado para TELA_MENU
            
            for i, r in enumerate(areas_abas):
                if r.collidepoint(mouse_pos):
                    aba_selecionada = i
            
            # Lógica dos itens dentro das abas
            for tipo, rect in interativos:
                if rect.collidepoint(mouse_pos):
                    if tipo == "fps": mostrar_fps = not mostrar_fps
                    elif tipo == "res": res_index = (res_index + 1) % len(resolucoes)
                    elif tipo == "modo": modo_index = (modo_index + 1) % len(modos_tela)

    if mostrar_fps:
        fps_txt = fonte_p.render(f"FPS: {int(relogio.get_fps())}", True, (0, 255, 0))
        tela.blit(fps_txt, (10, 10))

    pygame.display.flip()
    relogio.tick(60)
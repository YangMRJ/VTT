import pygame

class Token:
    def __init__(self, id_player, x, y, cor):
        self.id_player = id_player
        self.dono = id_player 
        self.grid_x = x
        self.grid_y = y
        self.target_x = x
        self.target_y = y
        self.cor = cor
        self.pixel_x = x * 50
        self.pixel_y = y * 50
        self.selecionado = False 

    def update(self, grid_size):
        target_px = self.grid_x * grid_size
        target_py = self.grid_y * grid_size
        
        self.pixel_x += (target_px - self.pixel_x) * 0.2
        self.pixel_y += (target_py - self.pixel_y) * 0.2

        if abs(target_px - self.pixel_x) < 2 and abs(target_py - self.pixel_y) < 2:
            self.pixel_x, self.pixel_y = target_px, target_py
            if self.grid_x < self.target_x: self.grid_x += 1
            elif self.grid_x > self.target_x: self.grid_x -= 1
            elif self.grid_y < self.target_y: self.grid_y += 1
            elif self.grid_y > self.target_y: self.grid_y -= 1

    def desenhar(self, tela, cam_x, cam_y, fontes, grid_size):
        px = int(self.pixel_x + cam_x)
        py = int(self.pixel_y + cam_y)
        center = (px + grid_size//2, py + grid_size//2)
        
        if self.selecionado:
            pygame.draw.circle(tela, (255, 255, 0), center, grid_size//2 + 2, 3)

        pygame.draw.circle(tela, self.cor, center, grid_size//2 - 4)
        pygame.draw.circle(tela, (255,255,255), center, grid_size//2 - 4, 2)
        
        txt = fontes['pp'].render(self.id_player, True, (255,255,255))
        rect = txt.get_rect(center=(center[0], center[1] - grid_size//2 - 10))
        pygame.draw.rect(tela, (0,0,0, 150), rect.inflate(6, 4), border_radius=4)
        tela.blit(txt, rect)


class MapaJogo:
    def __init__(self):
        self.grid_size = 50
        self.camera_x = 0
        self.camera_y = 0
        self.tokens = {} 
        self.meu_id = None
        self.is_mestre = False
        self.show_coords = False
        
        self.arrastando = False
        self.inicio_arrasto = (0, 0)
        self.pos_mouse = (0, 0)
        
        self.chat_aberto = False
        self.chat_digitando = False
        self.chat_input = ""
        self.chat_historico = []

    def registrar_jogador(self, id_player, is_mestre, show_coords):
        self.meu_id = id_player
        self.is_mestre = is_mestre
        self.show_coords = show_coords
        self.tokens.clear()
        self.camera_x = 400
        self.camera_y = 300
        self.arrastando = False
        self.chat_historico.clear()

    def adicionar_mensagem(self, nome, texto):
        self.chat_historico.append((nome, texto))
        if len(self.chat_historico) > 50:
            self.chat_historico.pop(0)

    def spawn_token(self, id_player, x, y):
        cor = (max(50, (len(id_player)*30)%255), max(50, (len(id_player)*50)%255), max(100, (len(id_player)*80)%255))
        novo_token = Token(id_player, x, y, cor)
        if not self.is_mestre and id_player == self.meu_id:
            novo_token.selecionado = True
        self.tokens[id_player] = novo_token

    def mover_token(self, id_player, tx, ty):
        if id_player in self.tokens:
            self.tokens[id_player].target_x = tx
            self.tokens[id_player].target_y = ty

    def update(self):
        for t in self.tokens.values():
            t.update(self.grid_size)

    def pode_selecionar(self, token):
        return self.is_mestre or token.dono == self.meu_id

    def processar_eventos(self, eventos, m_pos):
        acoes = []
        self.pos_mouse = m_pos
        tela = pygame.display.get_surface()
        w, h = tela.get_size()
        
        if not self.chat_digitando:
            keys = pygame.key.get_pressed()
            cam_speed = 10
            if keys[pygame.K_LEFT] or keys[pygame.K_a]: self.camera_x += cam_speed
            if keys[pygame.K_RIGHT] or keys[pygame.K_d]: self.camera_x -= cam_speed
            if keys[pygame.K_UP] or keys[pygame.K_w]: self.camera_y += cam_speed
            if keys[pygame.K_DOWN] or keys[pygame.K_s]: self.camera_y -= cam_speed

        for ev in eventos:
            if ev.type == pygame.MOUSEBUTTONDOWN:
                mx, my = m_pos
                clicou_no_ui = False
                
                # Coordenadas dinâmicas do botão da Ficha
                ficha_x = 405 if self.chat_aberto else 120
                btn_ficha = pygame.Rect(ficha_x, h - 40, 100, 30)
                
                if ev.button == 1:
                    # --- CHECA UI ---
                    if btn_ficha.collidepoint(mx, my):
                        acoes.append({"tipo": "abrir_ficha"})
                        clicou_no_ui = True
                    elif self.chat_aberto:
                        btn_close = pygame.Rect(365, h - 40, 30, 30)
                        input_rect = pygame.Rect(10, h - 40, 350, 30)
                        chat_bg = pygame.Rect(10, h - 260, 385, 250)
                        
                        if btn_close.collidepoint(mx, my):
                            self.chat_aberto = False
                            self.chat_digitando = False
                            clicou_no_ui = True
                        elif input_rect.collidepoint(mx, my):
                            self.chat_digitando = True
                            clicou_no_ui = True
                        elif chat_bg.collidepoint(mx, my):
                            clicou_no_ui = True 
                        else:
                            self.chat_digitando = False
                    else:
                        btn_chat = pygame.Rect(10, h - 40, 100, 30)
                        if btn_chat.collidepoint(mx, my):
                            self.chat_aberto = True
                            self.chat_digitando = True
                            clicou_no_ui = True
                
                # --- LÓGICA DO MAPA ---
                if not clicou_no_ui:
                    gx = (mx - self.camera_x) // self.grid_size
                    gy = (my - self.camera_y) // self.grid_size
                    
                    if ev.button == 1:
                        clicou_em_token = False
                        for t in self.tokens.values():
                            if t.grid_x == gx and t.grid_y == gy:
                                clicou_em_token = True
                                if self.pode_selecionar(t):
                                    for t_all in self.tokens.values(): t_all.selecionado = False
                                    t.selecionado = True
                                break
                        
                        if not clicou_em_token:
                            for t in self.tokens.values(): t.selecionado = False
                            self.arrastando = True
                            self.inicio_arrasto = m_pos

                    elif ev.button == 3:
                        for t in self.tokens.values():
                            if t.selecionado and self.pode_selecionar(t):
                                acoes.append({"tipo": "move_req", "nome": t.id_player, "tx": gx, "ty": gy})

            elif ev.type == pygame.MOUSEBUTTONUP:
                if ev.button == 1 and self.arrastando:
                    self.arrastando = False
                    
                    rx = min(self.inicio_arrasto[0], m_pos[0])
                    ry = min(self.inicio_arrasto[1], m_pos[1])
                    rw = abs(self.inicio_arrasto[0] - m_pos[0])
                    rh = abs(self.inicio_arrasto[1] - m_pos[1])
                    rect_selecao = pygame.Rect(rx, ry, rw, rh)
                    
                    for t in self.tokens.values():
                        px = t.pixel_x + self.camera_x + self.grid_size // 2
                        py = t.pixel_y + self.camera_y + self.grid_size // 2
                        if rect_selecao.collidepoint(px, py) and self.pode_selecionar(t):
                            t.selecionado = True

            elif ev.type == pygame.KEYDOWN and self.chat_digitando:
                if ev.key == pygame.K_RETURN:
                    if self.chat_input.strip() != "":
                        acoes.append({"tipo": "chat_req", "texto": self.chat_input.strip()})
                        self.chat_input = ""
                elif ev.key == pygame.K_BACKSPACE:
                    self.chat_input = self.chat_input[:-1]
                elif ev.unicode.isprintable() and len(self.chat_input) < 80:
                    self.chat_input += ev.unicode

        return acoes

    def desenhar(self, tela, fontes):
        tela.fill((30, 40, 30)) 
        w, h = tela.get_size()
        
        offset_x = self.camera_x % self.grid_size
        offset_y = self.camera_y % self.grid_size

        for x in range(offset_x - self.grid_size, w + self.grid_size, self.grid_size):
            pygame.draw.line(tela, (50, 70, 50), (x, 0), (x, h))
        for y in range(offset_y - self.grid_size, h + self.grid_size, self.grid_size):
            pygame.draw.line(tela, (50, 70, 50), (0, y), (w, y))

        if self.show_coords and not self.is_mestre and self.meu_id in self.tokens:
            meu_token = self.tokens[self.meu_id]
            txt = fontes['p'].render(f"Posição: X:{meu_token.grid_x} Y:{meu_token.grid_y}", True, (255, 255, 0))
            tela.blit(txt, (w - 280, 20))

        for t in self.tokens.values():
            t.desenhar(tela, self.camera_x, self.camera_y, fontes, self.grid_size)
            
        if self.arrastando:
            rx = min(self.inicio_arrasto[0], self.pos_mouse[0])
            ry = min(self.inicio_arrasto[1], self.pos_mouse[1])
            rw = abs(self.inicio_arrasto[0] - self.pos_mouse[0])
            rh = abs(self.inicio_arrasto[1] - self.pos_mouse[1])
            
            surface_selecao = pygame.Surface((rw, rh), pygame.SRCALPHA)
            surface_selecao.fill((100, 200, 255, 40))
            pygame.draw.rect(surface_selecao, (100, 200, 255, 180), surface_selecao.get_rect(), 2) 
            tela.blit(surface_selecao, (rx, ry))

        # --- DESENHO DA UI (Chat + Botão Ficha) ---
        ficha_x = 405 if self.chat_aberto else 120
        btn_ficha = pygame.Rect(ficha_x, h - 40, 100, 30)
        cor_ficha = (50, 100, 150) if btn_ficha.collidepoint(self.pos_mouse) else (40, 60, 100)
        pygame.draw.rect(tela, cor_ficha, btn_ficha, border_radius=4)
        pygame.draw.rect(tela, (150, 200, 255), btn_ficha, 1, border_radius=4)
        txt_ficha = fontes['p'].render("Ficha (Crl+F)", True, (255, 255, 255))
        tela.blit(txt_ficha, txt_ficha.get_rect(center=btn_ficha.center))

        if self.chat_aberto:
            surf = pygame.Surface((385, 250), pygame.SRCALPHA)
            surf.fill((30, 30, 35, 220))
            tela.blit(surf, (10, h - 260))
            pygame.draw.rect(tela, (100, 100, 120), (10, h - 260, 385, 250), 2)

            y_hist = h - 65
            for i in range(len(self.chat_historico)-1, -1, -1):
                nome_c, texto_c = self.chat_historico[i]
                cor_n = (255, 200, 100) if nome_c == "Mestre" else (200, 200, 255)
                msg_txt = fontes['p'].render(f"[{nome_c}]: {texto_c}", True, cor_n)
                if y_hist < h - 250: break 
                tela.blit(msg_txt, (15, y_hist))
                y_hist -= 22

            input_rect = pygame.Rect(10, h - 40, 350, 30)
            pygame.draw.rect(tela, (20, 20, 25), input_rect)
            pygame.draw.rect(tela, (255, 255, 0) if self.chat_digitando else (100, 100, 120), input_rect, 1)
            txt_input = fontes['p'].render(self.chat_input + ("|" if self.chat_digitando else ""), True, (255, 255, 255))
            tela.blit(txt_input, (15, h - 33))

            btn_close = pygame.Rect(365, h - 40, 30, 30)
            cor_close = (200, 80, 80) if btn_close.collidepoint(self.pos_mouse) else (150, 50, 50)
            pygame.draw.rect(tela, cor_close, btn_close)
            pygame.draw.rect(tela, (100, 100, 120), btn_close, 1)
            txt_c = fontes['p'].render("V", True, (255, 255, 255))
            tela.blit(txt_c, txt_c.get_rect(center=btn_close.center))
        else:
            btn_chat = pygame.Rect(10, h - 40, 100, 30)
            cor_btn = (60, 60, 70) if btn_chat.collidepoint(self.pos_mouse) else (40, 40, 45)
            pygame.draw.rect(tela, cor_btn, btn_chat, border_radius=4)
            pygame.draw.rect(tela, (150, 150, 150), btn_chat, 1, border_radius=4)
            txt_btn = fontes['p'].render("Chat [^]", True, (200, 200, 200))
            tela.blit(txt_btn, txt_btn.get_rect(center=btn_chat.center))
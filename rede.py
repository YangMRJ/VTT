import socket
import threading
import json
import time

IP_PADRAO = 'localhost'
PORTA = 5555
lista_conectados = []
is_host = False
socket_conexao = None
servidor_socket = None
clientes_sockets = []
eventos_rede = [] 

HOST_CAMP_ID = ""
HOST_CAMP_SENHA = ""
jogo_iniciado = False 
estado_mapa = {}

def broadcast(msg):
    msg_str = json.dumps(msg) + "\n"
    for cliente in list(clientes_sockets):
        try:
            cliente.send(msg_str.encode('utf-8'))
        except:
            if cliente in clientes_sockets:
                clientes_sockets.remove(cliente)

def enviar_msg(msg):
    global estado_mapa
    if is_host:
        tipo = msg.get("tipo")
        nome = msg.get("nome")
        if tipo == "spawn":
            estado_mapa[nome] = {"x": msg.get("x",0), "y": msg.get("y",0)}
        elif tipo == "move":
            if nome in estado_mapa:
                estado_mapa[nome]["x"] = msg.get("tx",0)
                estado_mapa[nome]["y"] = msg.get("ty",0)
        
        eventos_rede.append(msg) 
        broadcast(msg)
    elif socket_conexao:
        try: socket_conexao.send((json.dumps(msg) + "\n").encode('utf-8'))
        except: pass

def lidar_com_cliente(conn):
    global lista_conectados, estado_mapa
    nome_player = ""
    try:
        auth_data_str = conn.recv(1024).decode('utf-8').strip()
        auth_data = json.loads(auth_data_str)
        
        if auth_data.get("id") != HOST_CAMP_ID or auth_data.get("senha") != HOST_CAMP_SENHA:
            conn.send((json.dumps({"tipo": "erro", "msg": "ID ou Senha incorretos!"}) + "\n").encode('utf-8'))
            conn.close()
            return
            
        nome_player = auth_data.get("nome", "Desconhecido")
        lista_conectados.append(nome_player)
        clientes_sockets.append(conn)
        broadcast({"tipo": "lobby_update", "lista": lista_conectados})

        if jogo_iniciado:
            conn.send((json.dumps({"tipo": "start_game"}) + "\n").encode('utf-8'))
            conn.send((json.dumps({"tipo": "sync_mapa", "tokens": estado_mapa}) + "\n").encode('utf-8'))

        buffer = ""
        while True:
            dados = conn.recv(1024)
            if not dados: break 
            
            buffer += dados.decode('utf-8')
            while "\n" in buffer:
                linha, buffer = buffer.split("\n", 1)
                if linha.strip():
                    msg = json.loads(linha)
                    tipo = msg.get("tipo")
                    
                    # ADICIONAMOS O "chat" AQUI!
                    if tipo in ["spawn", "move", "chat"]:
                        nome = msg.get("nome")
                        if tipo == "spawn":
                            estado_mapa[nome] = {"x": msg.get("x",0), "y": msg.get("y",0)}
                        elif tipo == "move":
                            if nome in estado_mapa:
                                estado_mapa[nome]["x"] = msg.get("tx",0)
                                estado_mapa[nome]["y"] = msg.get("ty",0)
                                
                        eventos_rede.append(msg) 
                        broadcast(msg)           
                        
    except Exception as e:
        pass
    finally:
        if conn in clientes_sockets:
            clientes_sockets.remove(conn)
        if nome_player in lista_conectados:
            lista_conectados.remove(nome_player)
            broadcast({"tipo": "lobby_update", "lista": lista_conectados})
        conn.close()

def servidor_thread(camp_id, camp_senha):
    global lista_conectados, servidor_socket, HOST_CAMP_ID, HOST_CAMP_SENHA, jogo_iniciado, estado_mapa
    HOST_CAMP_ID = camp_id
    HOST_CAMP_SENHA = camp_senha
    jogo_iniciado = False
    estado_mapa.clear()
    
    servidor_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    servidor_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        servidor_socket.bind((IP_PADRAO, PORTA))
        servidor_socket.listen(4)
        while True:
            conn, addr = servidor_socket.accept()
            threading.Thread(target=lidar_com_cliente, args=(conn,), daemon=True).start()
    except: pass

def cliente_thread(nome_char, camp_id, camp_senha):
    global socket_conexao, lista_conectados
    client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        client.connect((IP_PADRAO, PORTA))
        auth_msg = json.dumps({"nome": nome_char, "id": camp_id, "senha": camp_senha})
        client.send(auth_msg.encode('utf-8'))
        socket_conexao = client
        
        buffer = ""
        primeiro_update = True 
        
        while True:
            dados = client.recv(4096)
            if not dados: 
                eventos_rede.append({"tipo": "host_desconectou", "msg": "A conexao com o Mestre caiu!"})
                break
            
            buffer += dados.decode('utf-8')
            while "\n" in buffer:
                linha, buffer = buffer.split("\n", 1)
                if linha.strip():
                    msg = json.loads(linha)
                    tipo = msg.get("tipo")
                    
                    # ADICIONAMOS O "chat" AQUI!
                    if tipo in ["lobby_update", "start_game", "erro", "host_desconectou", "spawn", "move", "sync_mapa", "chat"]:
                        if tipo == "lobby_update": 
                            lista_conectados[:] = msg.get("lista", [])
                            if primeiro_update:
                                eventos_rede.append({"tipo": "conectado"})
                                primeiro_update = False
                                
                        eventos_rede.append(msg)
                        
                        if tipo in ["erro", "host_desconectou"]:
                            client.close()
                            return
    except:
        eventos_rede.append({"tipo": "erro", "msg": "Servidor offline ou nao encontrado."})

def encerrar_conexao():
    global servidor_socket, socket_conexao, lista_conectados, jogo_iniciado, estado_mapa
    jogo_iniciado = False
    estado_mapa.clear()
    
    if is_host and clientes_sockets:
        broadcast({"tipo": "host_desconectou", "msg": "O Mestre encerrou a partida."})
        time.sleep(0.2) 
        
    if servidor_socket:
        try: servidor_socket.close()
        except: pass
        servidor_socket = None
        
    if socket_conexao:
        try: socket_conexao.close()
        except: pass
        socket_conexao = None
        
    for conn in list(clientes_sockets):
        try: conn.close()
        except: pass
    clientes_sockets.clear()
    lista_conectados.clear()
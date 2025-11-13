const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

let players = {};

// Servir arquivos estáticos (HTML, CSS, Client.js)
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Lógica Principal do Jogo
io.on('connection', (socket) => {
    console.log(`[CONEXÃO] 🔌 Novo jogador conectado: ${socket.id}`);

    // --- LOGIN ---
    socket.on('tentar_login', (dados) => {
        console.log(`[LOGIN] 👤 ${socket.id} tentou entrar como: ${dados.nome} (Cor: ${dados.cor})`);

        const novoJogador = {
            id: socket.id,
            nome: dados.nome,
            cor: dados.cor,
            gridX: 0, // Posição do grid (tile)
            gridY: 0  // Posição do grid (tile)
        };
        
        players[socket.id] = novoJogador;
        console.log(`[INFO] 🧑‍🤝‍🧑 Jogadores online: ${Object.keys(players).length}`);

        socket.emit('login_sucesso', novoJogador);
        socket.emit('jogadores_atuais', players);
        socket.broadcast.emit('novo_jogador', novoJogador);
    });

    // --- MOVIMENTAÇÃO (baseada em grid) ---
    socket.on('mover_grid', (posicao) => {
        if (players[socket.id]) {
            // Atualiza a posição do grid no servidor
            players[socket.id].gridX = posicao.gridX;
            players[socket.id].gridY = posicao.gridY;

            console.log(`[MOVIMENTO] 🏃 ${players[socket.id].nome} moveu para o grid: (${posicao.gridX}, ${posicao.gridY})`);

            // Envia a nova posição do grid para TODOS OS OUTROS jogadores
            socket.broadcast.emit('jogador_moveu_grid', {
                id: socket.id,
                gridX: posicao.gridX,
                gridY: posicao.gridY
            });
        }
    });

    // --- DESCONEXÃO ---
    socket.on('disconnect', () => {
        console.log(`[DESCONEXÃO] 🔌 Jogador desconectado: ${socket.id}`);
        if (players[socket.id]) {
            console.log(`[INFO] 💀 Jogador ${players[socket.id].nome} removido.`);
            delete players[socket.id];
            io.emit('jogador_saiu', socket.id);
            console.log(`[INFO] 🧑‍🤝‍🧑 Jogadores online: ${Object.keys(players).length}`);
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
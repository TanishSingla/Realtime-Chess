const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socket(server);
const PORT = 3000;
let chess = new Chess();
let players = {};

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index");
});

io.on('connection', (socket) => {
    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit('playerRole', 'b');
    } else {
        socket.emit('spectatorRole');
    }

    socket.on('move', (move) => {
        try {
            if ((chess.turn() === 'w' && socket.id !== players.white) || (chess.turn() === 'b' && socket.id !== players.black)) {
                return;
            }

            const result = chess.move(move);

            if (result) {
                io.emit('move', move);
                io.emit('boardState', chess.fen());

                if (chess.isCheckmate()) {
                    const winner = chess.turn() === 'w' ? 'Black' : 'White';
                    io.emit('gameOver', { winner });
                }
            } else {
                socket.emit('invalidMove', move);
            }
        } catch (err) {
            console.log('Error while trying to move:', err);
            socket.emit("errorInMoving", err);
        }
    });

    socket.on('disconnect', () => {
        console.log("Player disconnected");

        if (socket.id === players.white || socket.id === players.black) {
            chess = new Chess();
            players = {};
            io.emit('gameReset');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

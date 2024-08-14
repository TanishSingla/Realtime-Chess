const express = require('express');
const { Server } = require('socket.io');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const server = require('http').createServer(app);
const io = new Server(server);
const chess = new Chess();
let players = {};
let currentPlayer = "w";

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Route for the homepage
app.get('/', (req, res) => {
    res.render('index');
});

// Socket.io logic
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
            if (chess.turn() === 'w' && socket.id !== players.white) return;
            if (chess.turn() === 'b' && socket.id !== players.black) return;
            const result = chess.move(move);

            if (result) {
                currentPlayer = chess.turn();
                io.emit('move', move);
                io.emit('boardState', chess.fen());
            } else {
                socket.emit('InvalidMove', move);
            }
        } catch (err) {
            socket.emit("ErrorInMoving", err);
        }
    });

    socket.on('disconnect', () => {
        if (socket.id === players.white) {
            delete players.white;
        } else if (socket.id === players.black) {
            delete players.black;
        }

        io.emit('gameReset');
        chess.reset();
        players = {};
        currentPlayer = "w";
    });
});

// Start the server (needed for local development and Vercel)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;

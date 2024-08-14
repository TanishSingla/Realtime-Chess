const socket = io();
const chess = new Chess();
const chessboard = document.querySelector('.chessboard');

// Load the sound file
const moveSound = new Audio('/sounds/move.mp3');

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    chessboard.innerHTML = ""; // Clear the board first
    const board = chess.board();

    board.forEach((row, rowIndex) => {
        row.forEach((square, colIndex) => {
            const squareElement = document.createElement('div');
            squareElement.classList.add(
                "square",
                (rowIndex + colIndex) % 2 === 0 ? "light" : "dark"
            );
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = colIndex;

            if (square) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece', square.color === 'w' ? "white" : "black");

                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener('dragstart', (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: colIndex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener('dragend', () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col)
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            chessboard.appendChild(squareElement);
        });
    });

    if (playerRole === 'b') {
        chessboard.classList.add('flipped');
    } else {
        chessboard.classList.remove('flipped');
    }
};

const handleMove = (src, target) => {
    const move = {
        from: `${String.fromCharCode(97 + src.col)}${8 - src.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q'
    };

    socket.emit('move', move);
};

const getPieceUnicode = (piece) => {
    const unicodes = {
        p: '♙',
        r: '♖',
        n: '♘',
        b: '♗',
        q: '♕',
        k: '♔',
        P: '♟',
        R: '♜',
        N: '♞',
        B: '♝',
        Q: '♛',
        K: '♚'
    };
    if (piece.color === 'w')
        return unicodes[piece.type] || "";
    else if (piece.color === 'b' && piece.type === 'p')
        return unicodes[piece.type] || "";

    return unicodes[piece.type.toUpperCase()] || "";
};

socket.on('playerRole', (role) => {
    playerRole = role;
    renderBoard();
});

socket.on('spectatorRole', () => {
    playerRole = null;
    renderBoard();
});

socket.on('boardState', (fen) => {
    chess.load(fen);
    renderBoard();
});

socket.on('move', (move) => {
    chess.move(move);
    renderBoard();
    // Play the move sound when a move is made
    moveSound.play();
});

// Handle game reset
socket.on('gameReset', () => {
    chess.reset();
    playerRole = null;
    renderBoard();
    alert('The game has been reset due to a player disconnecting.');
});

// Handle game over
socket.on('gameOver', ({ winner }) => {
    alert(`${winner} wins by checkmate! 🎉🎊🥳`);
    chess.reset();
    renderBoard();
});

renderBoard();

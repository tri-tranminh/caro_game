import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// Game state
// rooms: { [roomId]: { board: [...], turn: 'X', players: { X: socketId, O: socketId }, size: 15, winner: null, history: [] } }
const rooms = {};

// Helper: check win
const checkWin = (board, index, size) => {
    if (index === null || !board[index]) return null;
    const player = board[index];
    const r = Math.floor(index / size);
    const c = index % size;
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    for (let [dr, dc] of directions) {
        let count = 1;
        let winningIndices = [index];

        // Forward
        for (let i = 1; i < 5; i++) {
            const nr = r + dr * i;
            const nc = c + dc * i;
            if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;
            const nIndex = nr * size + nc;
            if (board[nIndex] === player) {
                count++;
                winningIndices.push(nIndex);
            } else break;
        }

        // Backward
        for (let i = 1; i < 5; i++) {
            const nr = r - dr * i;
            const nc = c - dc * i;
            if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;
            const nIndex = nr * size + nc;
            if (board[nIndex] === player) {
                count++;
                winningIndices.push(nIndex);
            } else break;
        }

        if (count >= 5) return { winner: player, line: winningIndices };
    }
    return null;
};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Broadcast user count
    const broadcastUserCount = () => {
        io.emit('user_count', io.engine.clientsCount);
    };

    broadcastUserCount();

    // Send list of available public rooms
    socket.on('get_rooms', () => {
        const publicRooms = Object.keys(rooms)
            .filter(id => rooms[id].isPublic && Object.keys(rooms[id].players).length < 2 && !rooms[id].winner)
            .map(id => ({ id, size: rooms[id].size, players: Object.keys(rooms[id].players).length }));
        socket.emit('room_list', publicRooms);
    });

    socket.on('create_room', ({ size = 15, isPublic = true } = {}) => {
        const roomId = Math.random().toString(36).substring(2, 9);
        rooms[roomId] = {
            id: roomId,
            board: Array(size * size).fill(null),
            turn: 'X',
            players: { X: socket.id },
            size,
            winner: null,
            history: [],
            isPublic
        };
        socket.join(roomId);

        // Notify creator
        socket.emit('room_joined', { roomId, player: 'X', size });

        // Notify others
        io.emit('room_list_update');
    });

    socket.on('join_room', (roomId) => {
        const room = rooms[roomId];
        if (room && Object.keys(room.players).length < 2) {
            room.players['O'] = socket.id;
            socket.join(roomId);
            socket.emit('room_joined', { roomId, player: 'O', size: room.size });
            io.to(roomId).emit('game_start', { players: room.players });
            io.emit('room_list_update');
        } else {
            socket.emit('error', 'Room full or not found');
        }
    });

    socket.on('make_move', ({ roomId, index }) => {
        const room = rooms[roomId];
        if (!room || room.winner) return;

        // Identify player
        if (Object.keys(room.players).length < 2) return; // Wait for opponent

        let playerSymbol = null;
        if (room.players['X'] === socket.id) playerSymbol = 'X';
        else if (room.players['O'] === socket.id) playerSymbol = 'O';

        if (!playerSymbol || room.turn !== playerSymbol) return;

        if (room.board[index]) return;

        // Apply move
        room.board[index] = playerSymbol;
        room.history.push({ player: playerSymbol, index });

        // Check win
        const winResult = checkWin(room.board, index, room.size);
        let nextTurn = room.turn === 'X' ? 'O' : 'X';

        if (winResult) {
            room.winner = winResult.winner;
            io.to(roomId).emit('game_over', { winner: winResult.winner, line: winResult.line });
        } else if (!room.board.includes(null)) {
            room.winner = 'Draw';
            io.to(roomId).emit('game_over', { winner: 'Draw' });
        } else {
            room.turn = nextTurn;
        }

        // Broadcast move
        io.to(roomId).emit('move_made', {
            index,
            player: playerSymbol,
            nextTurn: room.winner ? null : nextTurn
        });
    });

    socket.on('request_rematch', (roomId) => {
        const room = rooms[roomId];
        if (!room) return;

        // Find opponent
        const opponentSocketId = room.players['X'] === socket.id ? room.players['O'] : room.players['X'];
        if (opponentSocketId) {
            io.to(opponentSocketId).emit('rematch_proposed');
        }
    });

    socket.on('respond_rematch', ({ roomId, accept }) => {
        const room = rooms[roomId];
        if (!room) return;

        if (accept) {
            // Reset game
            room.board = Array(room.size * room.size).fill(null);
            room.turn = 'X'; // Winner starts? Or alternate? Let's stick to X starts or alternate.
            // Standard rule: loser starts? Or swap X/O?
            // For simplicity: swap symbols?
            // Users stay same socket, but maybe swap roles? 
            // Let's just reset board, keep X/O same, X starts.
            room.winner = null;
            room.history = [];

            io.to(roomId).emit('game_reset', { turn: 'X' });
        } else {
            // Notify requester of rejection
            const opponentSocketId = room.players['X'] === socket.id ? room.players['O'] : room.players['X'];
            if (opponentSocketId) {
                io.to(opponentSocketId).emit('rematch_rejected');
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Handle cleanup
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const isPlayer = room.players['X'] === socket.id || room.players['O'] === socket.id;

            if (isPlayer) {
                if (!room.winner && Object.keys(room.players).length >= 1) {
                    // If game was active (2 players), remaining wins
                    if (Object.keys(room.players).length === 2) {
                        const winner = room.players['X'] === socket.id ? 'O' : 'X';
                        io.to(roomId).emit('opponent_left', { winner });
                        room.winner = winner;
                    }
                }
                // Remove room eventually
                delete rooms[roomId];
                io.emit('room_list_update');
            }
        }
        broadcastUserCount();
    });
});

// Fallback to index.html for SPA
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

import React, { useState, useEffect } from 'react';
import './App.css';
import Board from './components/Board';
import Lobby from './components/Lobby';
import useGame from './hooks/useGame';
import { io } from 'socket.io-client';
import { getBestMove } from './utils/ai';

function App() {
  const [screen, setScreen] = useState('menu'); // 'menu', 'lobby', 'game'
  const [gameMode, setGameMode] = useState('ai'); // 'ai', 'multiplayer'
  const [boardSize, setBoardSize] = useState(15);
  const [playerSymbol, setPlayerSymbol] = useState('X');
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(true);

  const [isWaiting, setIsWaiting] = useState(false);
  const [rematchStatus, setRematchStatus] = useState(null); // null, 'pending', 'rejected'
  const [userCount, setUserCount] = useState(0);

  const {
    squares,
    xIsNext,
    winner,
    winningLine,
    lastMoveIndex,
    makeMove,
    resetGame
  } = useGame(boardSize, boardSize);

  // Initialize Socket Connection - Global
  useEffect(() => {
    // In production (when served from same origin), no URL needed.
    // In dev, use localhost:3001
    const socketUrl = import.meta.env.PROD ? undefined : 'http://localhost:3001';
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.on('user_count', (count) => {
      setUserCount(count);
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, []); // Run once on mount

  // Handle Socket Events - Game
  useEffect(() => {
    if (!socket) return;

    const onConnect = () => console.log('Connected');
    // ...

    const onRoomJoined = ({ roomId, player, size }) => {
      setRoomId(roomId);
      setPlayerSymbol(player);
      setBoardSize(size);
      resetGame(size, size);
      setScreen('game');
      setIsMyTurn(player === 'X');
      setIsWaiting(true);
    };

    const onGameStart = () => {
      setIsWaiting(false);
    };

    const onMoveMade = ({ index, player, nextTurn }) => {
      makeMove(index);
      setIsMyTurn(nextTurn === playerSymbol);
    };

    const onGameOver = ({ winner: gameWinner }) => {
      // ...
    };

    const onOpponentLeft = ({ winner }) => {
      alert('Opponent disconnected. You win!');
      setIsWaiting(false);
      setRematchStatus(null);
    };

    const onRematchProposed = () => {
      if (window.confirm("Opponent wants a rematch. Accept?")) {
        socket.emit('respond_rematch', { roomId, accept: true });
      } else {
        socket.emit('respond_rematch', { roomId, accept: false });
      }
    };

    const onRematchRejected = () => {
      setRematchStatus('rejected');
      setTimeout(() => setRematchStatus(null), 3000);
    };

    const onGameReset = ({ turn }) => {
      resetGame(boardSize, boardSize);
      setIsMyTurn(turn === playerSymbol);
      setRematchStatus(null);
    };

    socket.on('connect', onConnect);
    socket.on('room_joined', onRoomJoined);
    socket.on('game_start', onGameStart);
    socket.on('move_made', onMoveMade);
    socket.on('game_over', onGameOver);
    socket.on('opponent_left', onOpponentLeft);
    socket.on('rematch_proposed', onRematchProposed);
    socket.on('rematch_rejected', onRematchRejected);
    socket.on('game_reset', onGameReset);

    return () => {
      socket.off('connect', onConnect);
      socket.off('room_joined', onRoomJoined);
      socket.off('game_start', onGameStart);
      socket.off('move_made', onMoveMade);
      socket.off('game_over', onGameOver);
      socket.off('opponent_left', onOpponentLeft);
      socket.off('rematch_proposed', onRematchProposed);
      socket.off('rematch_rejected', onRematchRejected);
      socket.off('game_reset', onGameReset);
    };
  }, [socket, makeMove, resetGame, playerSymbol, boardSize, roomId]);

  // AI Logic Effect
  useEffect(() => {
    let timeoutId;
    if (gameMode === 'ai' && !xIsNext && !winner && screen === 'game') {
      timeoutId = setTimeout(() => {
        const bestMoveIndex = getBestMove(squares, boardSize, boardSize, 'O');
        if (bestMoveIndex !== -1 && bestMoveIndex !== undefined) {
          makeMove(bestMoveIndex);
        }
      }, 500);
    }
    return () => clearTimeout(timeoutId);
  }, [xIsNext, winner, gameMode, squares, makeMove, screen, boardSize]);

  const handleCellClick = (i) => {
    if (winner || squares[i]) return;

    if (gameMode === 'ai') {
      if (!xIsNext) return; // Wait for AI
      makeMove(i);
    } else if (gameMode === 'multiplayer') {
      if (isWaiting || !isMyTurn || (xIsNext ? 'X' : 'O') !== playerSymbol) {
        // Not my turn or waiting
        return;
      }

      // Emit move
      socket.emit('make_move', { roomId, index: i });
    }
  };

  const handleMenuStart = (mode) => {
    setGameMode(mode);
    if (mode === 'ai') {
      setScreen('game');
      resetGame(boardSize, boardSize);
    } else {
      setScreen('lobby');
    }
  };

  return (
    <div className="app-container">
      {screen === 'menu' && (
        <div className="glass-panel card">
          <h1>Gamocaro</h1>
          <div className="controls" style={{ flexDirection: 'column', gap: '1rem' }}>
            <button onClick={() => handleMenuStart('ai')}>Play vs AI</button>
            <button onClick={() => handleMenuStart('multiplayer')}>Multiplayer Online</button>

            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>Board Size (AI Only): {boardSize}x{boardSize}</label>
              <input
                type="range"
                min="5"
                max="20"
                value={boardSize}
                onChange={(e) => setBoardSize(parseInt(e.target.value))}
              />
            </div>
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
            Online Users: {userCount}
          </p>
        </div>
      )}

      {screen === 'lobby' && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Lobby
            socket={socket}
            onBack={() => { setScreen('menu'); setGameMode('ai'); }}
          />
        </div>
      )}

      {screen === 'game' && (
        <div className="game-area">
          <div className="status-bar glass-panel">
            <button onClick={() => {
              if (gameMode === 'multiplayer') {
                setGameMode('ai');
              }
              setScreen('menu');
            }}>Back to Menu</button>

            <span style={{ fontWeight: 'bold', fontFamily: 'Nunito, sans-serif' }}>
              {winner
                ? (winner === 'Draw' ? 'Game Draw!' : <span>Winner: <span className={winner === 'X' ? 'status-x' : 'status-o'}>{winner}</span></span>)
                : (gameMode === 'multiplayer'
                  ? (isWaiting ? 'Waiting for opponent...' : <span>You are: <span className={playerSymbol === 'X' ? 'status-x' : 'status-o'}>{playerSymbol}</span> - {isMyTurn ? 'Your Turn' : "Opponent's Turn"}</span>)
                  : <span>Turn: {xIsNext ? <span className="status-x">X (You)</span> : <span className="status-o">O (AI)</span>}</span>)
              }
            </span>

            {gameMode === 'ai' && <button onClick={() => resetGame(boardSize, boardSize)}>Restart</button>}

            {gameMode === 'multiplayer' && winner && (
              <div>
                {rematchStatus === 'pending' ? (
                  <button disabled>Request Sent...</button>
                ) : rematchStatus === 'rejected' ? (
                  <span style={{ color: 'red', marginLeft: '10px' }}>Rematch Declined</span>
                ) : (
                  <button onClick={() => {
                    socket.emit('request_rematch', roomId);
                    setRematchStatus('pending');
                  }}>Rematch</button>
                )}
              </div>
            )}
          </div>

          <div className="board-container glass-panel">
            <Board
              rows={boardSize}
              cols={boardSize}
              squares={squares}
              onClick={handleCellClick}
              winningSquares={winningLine}
              lastMoveIndex={lastMoveIndex}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

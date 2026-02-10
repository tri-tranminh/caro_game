import { useState, useCallback } from 'react';

const checkWin = (board, index, rows, cols, winCondition = 5) => {
    if (index === null || !board[index]) return null;
    const player = board[index];
    const r = Math.floor(index / cols);
    const c = index % cols;

    const directions = [
        [0, 1],   // Horizontal
        [1, 0],   // Vertical
        [1, 1],   // Diagonal \
        [1, -1]   // Diagonal /
    ];

    for (let [dr, dc] of directions) {
        let count = 1;
        let winningIndices = [index];

        // Check forward
        for (let i = 1; i < winCondition; i++) {
            const nr = r + dr * i;
            const nc = c + dc * i;
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) break;
            const nIndex = nr * cols + nc;
            if (board[nIndex] === player) {
                count++;
                winningIndices.push(nIndex);
            } else {
                break;
            }
        }

        // Check backward
        for (let i = 1; i < winCondition; i++) {
            const nr = r - dr * i;
            const nc = c - dc * i;
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) break;
            const nIndex = nr * cols + nc;
            if (board[nIndex] === player) {
                count++;
                winningIndices.push(nIndex);
            } else {
                break;
            }
        }

        if (count >= winCondition) {
            return { winner: player, line: winningIndices };
        }
    }

    return null;
};

const useGame = (initialRows = 15, initialCols = 15) => {
    const [rows, setRows] = useState(initialRows);
    const [cols, setCols] = useState(initialCols);
    const [squares, setSquares] = useState(Array(initialRows * initialCols).fill(null));
    const [xIsNext, setXIsNext] = useState(true);
    const [winner, setWinner] = useState(null);
    const [winningLine, setWinningLine] = useState([]);
    const [lastMoveIndex, setLastMoveIndex] = useState(null);
    const [gameHistory, setGameHistory] = useState([]);

    const resetGame = useCallback((newRows = rows, newCols = cols) => {
        setRows(newRows);
        setCols(newCols);
        setSquares(Array(newRows * newCols).fill(null));
        setXIsNext(true);
        setWinner(null);
        setWinningLine([]);
        setLastMoveIndex(null);
        setGameHistory([]);
    }, [rows, cols]);

    const makeMove = useCallback((i) => {
        if (winner || squares[i]) return;

        const newSquares = [...squares];
        newSquares[i] = xIsNext ? 'X' : 'O';
        setSquares(newSquares);
        setLastMoveIndex(i);

        // Check win
        const winResult = checkWin(newSquares, i, rows, cols);
        if (winResult) {
            setWinner(winResult.winner);
            setWinningLine(winResult.line);
        } else if (!newSquares.includes(null)) {
            setWinner('Draw');
        }

        setXIsNext(!xIsNext);
        setGameHistory([...gameHistory, { player: xIsNext ? 'X' : 'O', index: i }]);
    }, [squares, xIsNext, winner, rows, cols, gameHistory]);

    return {
        rows,
        cols,
        squares,
        xIsNext,
        winner,
        winningLine,
        lastMoveIndex,
        makeMove,
        resetGame,
        setBoardSize: (r, c) => resetGame(r, c)
    };
};

export default useGame;

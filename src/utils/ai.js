
// Heuristic weights
const SCORES = {
    WIN_AI: 100000000,
    WIN_BLOCK: 50000000,
    OPEN_4_AI: 10000000, // Guaranteed win next turn
    OPEN_4_BLOCK: 5000000, // Must block or lose
    FOUR_AI: 1000000, // Create 4 with 1 open end (force constraint)
    FOUR_BLOCK: 500000,
    OPEN_3_AI: 100000,
    OPEN_3_BLOCK: 50000,
    THREE_AI: 1000,
    THREE_BLOCK: 500,
    TWO_AI: 100,
    TWO_BLOCK: 50
};

export const getBestMove = (squares, rows, cols, aiPlayer = 'O') => {
    const humanPlayer = aiPlayer === 'X' ? 'O' : 'X';
    let bestScore = -1;
    let bestMoves = [];

    // Optimization: If board is empty, play center
    const center = Math.floor(rows * cols / 2);
    if (squares[center] === null && squares.every(s => s === null)) return center;

    for (let i = 0; i < squares.length; i++) {
        if (squares[i] !== null) continue;

        // Optimization: Only evaluate neighbors (radius 2)
        if (!hasNeighbor(squares, i, rows, cols)) continue;

        // Score logic
        let currentScore = 0;

        // Evaluate for AI (Attack)
        currentScore += evaluatePosition(squares, i, rows, cols, aiPlayer, true);

        // Evaluate for Human (Block)
        currentScore += evaluatePosition(squares, i, rows, cols, humanPlayer, false);

        if (currentScore > bestScore) {
            bestScore = currentScore;
            bestMoves = [i];
        } else if (currentScore === bestScore) {
            bestMoves.push(i);
        }
    }

    if (bestMoves.length > 0) {
        // Randomize among equal best moves to avoid predictable patterns
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    // Fallback (should rarely happen if hasNeighbor works)
    const available = squares.map((v, i) => v === null ? i : null).filter(v => v !== null);
    return available[Math.floor(Math.random() * available.length)];
};

const hasNeighbor = (board, index, rows, cols) => {
    const r = Math.floor(index / cols);
    const c = index % cols;
    const radius = 2; // Check 2 cells away

    for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                if (board[nr * cols + nc] !== null) return true;
            }
        }
    }
    return false;
};

// Evaluate potential of a move at 'index' for 'player'
const evaluatePosition = (board, index, rows, cols, player, isAttack) => {
    const r = Math.floor(index / cols);
    const c = index % cols;
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    let totalScore = 0;

    for (let [dr, dc] of directions) {
        totalScore += getLineScore(board, r, c, dr, dc, rows, cols, player, isAttack);
    }
    return totalScore;
};

const getLineScore = (board, r, c, dr, dc, rows, cols, player, isAttack) => {
    let count = 1; // Start with the stone we're placing
    let blockedEnds = 0;

    // Check Forward
    let i = 1;
    while (true) {
        const nr = r + dr * i;
        const nc = c + dc * i;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
            blockedEnds++;
            break;
        }
        const idx = nr * cols + nc;
        if (board[idx] === player) {
            count++;
        } else if (board[idx] === null) {
            break;
        } else {
            blockedEnds++;
            break;
        }
        i++;
    }

    // Check Backward
    let j = 1;
    while (true) {
        const nr = r - dr * j;
        const nc = c - dc * j;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
            blockedEnds++;
            break;
        }
        const idx = nr * cols + nc;
        if (board[idx] === player) {
            count++;
        } else if (board[idx] === null) {
            break;
        } else {
            blockedEnds++;
            break;
        }
        j++;
    }

    // Calculate score based on pattern
    if (count >= 5) return isAttack ? SCORES.WIN_AI : SCORES.WIN_BLOCK;

    if (count === 4) {
        if (blockedEnds === 0) return isAttack ? SCORES.OPEN_4_AI : SCORES.OPEN_4_BLOCK;
        if (blockedEnds === 1) return isAttack ? SCORES.FOUR_AI : SCORES.FOUR_BLOCK;
        return 0; // Blocked both ends, useless
    }

    if (count === 3) {
        if (blockedEnds === 0) return isAttack ? SCORES.OPEN_3_AI : SCORES.OPEN_3_BLOCK;
        if (blockedEnds === 1) return isAttack ? SCORES.THREE_AI : SCORES.THREE_BLOCK;
        return 0;
    }

    if (count === 2) {
        if (blockedEnds === 0) return isAttack ? SCORES.TWO_AI : SCORES.TWO_BLOCK;
        return 0;
    }

    return 0;
};

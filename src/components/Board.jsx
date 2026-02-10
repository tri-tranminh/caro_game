import React from 'react';
import './Board.css';

// Simple Cell component inline or imported? I prefer imported.
// But wait, the previous attempts failed to apply edits.
// I will just redefine Cell here if it's simpler, or assume it's imported correctly.
import Cell from './Cell';

const Board = ({ rows, cols, squares, onClick, winningSquares, lastMoveIndex }) => {
    return (
        <div
            className="board"
            style={{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
                aspectRatio: `${cols} / ${rows}`
            }}
        >
            {squares.map((square, i) => (
                <Cell
                    key={i}
                    value={square}
                    onClick={() => onClick(i)}
                    isWinning={winningSquares && winningSquares.includes(i)}
                    isLastMove={lastMoveIndex === i}
                />
            ))}
        </div>
    );
};

export default Board;

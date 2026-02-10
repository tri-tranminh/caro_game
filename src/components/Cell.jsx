import React from 'react';

const Cell = ({ value, onClick, isWinning, isLastMove }) => {
  const getClassName = () => {
    let className = 'cell';
    if (value === 'X') className += ' cell-x';
    if (value === 'O') className += ' cell-o';
    if (isWinning) className += ' cell-winning';
    if (isLastMove) className += ' cell-last';
    return className;
  };

  return (
    <button className={getClassName()} onClick={onClick} disabled={!!value}>
      {value}
    </button>
  );
};

export default Cell;

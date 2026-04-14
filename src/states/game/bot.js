// Simple bot AI for Tic-Tac-Toe

export const getBotMove = (board) => {
  // Check if bot can win
  for (let i = 0; i < 9; i++) {
    if (board[i] === '') {
      const testBoard = [...board];
      testBoard[i] = 'O';
      if (checkWinner(testBoard) === 'O') return i;
    }
  }

  // Check if need to block player
  for (let i = 0; i < 9; i++) {
    if (board[i] === '') {
      const testBoard = [...board];
      testBoard[i] = 'X';
      if (checkWinner(testBoard) === 'X') return i;
    }
  }

  // Try center
  if (board[4] === '') return 4;

  // Try corners
  const corners = [0, 2, 6, 8];
  const availableCorners = corners.filter(i => board[i] === '');
  if (availableCorners.length > 0) {
    return availableCorners[Math.floor(Math.random() * availableCorners.length)];
  }

  // Take any remaining space
  for (let i = 0; i < 9; i++) {
    if (board[i] === '') return i;
  }

  return -1;
};

const checkWinner = (board) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (let line of lines) {
    if (board[line[0]] && board[line[0]] === board[line[1]] && board[line[0]] === board[line[2]]) {
      return board[line[0]];
    }
  }
  return null;
};
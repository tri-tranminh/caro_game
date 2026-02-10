# Caro Web Game (ForGomoku)

A modern, web-based Caro (Gomoku) game built with React, Vite, and Socket.IO.

## Features

- **Single Player vs AI**: Play against a simple AI opponent on adjustable board sizes.
- **Multiplayer Online**: Create and join real-time games with other players.
- **Customizable Board**: Adjust board size from 5x5 to 20x20.
- **Glassmorphism UI**: Uses modern CSS for a sleek, premium look.
- **Responsive**: Scales nicely on desktop.

## Prerequisites

- Node.js (v16+)
- npm

## Installation

1. Clone the repository or extract the files.
2. Install dependencies:

```bash
npm install
```

## Running the Game

To play the game, you need to run both the frontend and the backend server (for multiplayer).

### 1. Start the Backend Server (for Multiplayer)

Open a terminal in the project root:

```bash
node server/index.js
```
The server will start on `http://localhost:3001`.

### 2. Start the Frontend

Open another terminal in the project root:

```bash
npm run dev
```
The application will start on `http://localhost:5173`. Open this URL in your browser.

## Tech Stack

- **Frontend**: React, Vite, CSS (Glassmorphism)
- **Backend**: Node.js, Express, Socket.IO
- **State Management**: React Hooks (useGame custom hook)

import React, { useState, useEffect } from 'react';

const Lobby = ({ socket, onJoinGame, onBack, t }) => {
    const [rooms, setRooms] = useState([]);
    const [newRoomSize, setNewRoomSize] = useState(15);

    useEffect(() => {
        if (!socket) return;

        // Request room list
        socket.emit('get_rooms');

        // Listen for updates
        socket.on('room_list', (roomList) => {
            setRooms(roomList);
        });

        socket.on('room_list_update', () => {
            socket.emit('get_rooms');
        });

        return () => {
            socket.off('room_list');
            socket.off('room_list_update');
        };
    }, [socket]);

    const createRoom = () => {
        socket.emit('create_room', { size: newRoomSize, isPublic: true });
    };

    return (
        <div className="glass-panel card" style={{ width: '100%', maxWidth: '600px', position: 'relative' }}>
            <button
                onClick={onBack}
                style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
                    padding: '0.5em 1em',
                    fontSize: '0.9rem',
                    zIndex: 10
                }}
            >
                {t.back}
            </button>
            <h2 style={{ marginTop: '0.5rem' }}>{t.lobbyTitle}</h2>

            <div className="create-room-section" style={{ marginBottom: '2rem', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <h3>{t.createGame}</h3>
                <label>{t.boardSize}: {newRoomSize}x{newRoomSize}</label>
                <input
                    type="range"
                    min="5"
                    max="20"
                    value={newRoomSize}
                    onChange={(e) => setNewRoomSize(parseInt(e.target.value))}
                />
                <button onClick={createRoom}>{t.createRoom}</button>
            </div>

            <div className="room-list">
                <h3>{t.availableRooms}</h3>
                {rooms.length === 0 ? (
                    <p>{t.noRooms}</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {rooms.map((room) => (
                            <li key={room.id} style={{
                                background: 'rgba(255,255,255,0.05)',
                                margin: '0.5rem 0',
                                padding: '1rem',
                                borderRadius: '8px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span>{t.room} #{room.id} ({room.size}x{room.size}) - {t.players}: {room.players}/2</span>
                                <button onClick={() => socket.emit('join_room', room.id)}>{t.join}</button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Lobby;

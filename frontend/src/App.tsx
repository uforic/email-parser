import React from 'react';
import './App.css';

function App() {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: 500,
            }}
        >
            <h1>Welcome to email scanner!</h1>
            <div>To analyze your inbox, please authentication your gmail.</div>
            <button onClick={() => (window.location.href = 'http://localhost:8080/auth/gmail')}>Auth ur Gmail!</button>
        </div>
    );
}

export default App;

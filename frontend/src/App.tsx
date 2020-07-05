import React from 'react';
import './App.css';

function App() {
    return (
        <div>
            Welcome!
            <button onClick={() => (window.location.href = 'http://localhost:8080/auth/gmail')}>Get ur mail!</button>
        </div>
    );
}

export default App;

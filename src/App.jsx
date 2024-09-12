import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EmailDisplay from './pages/EmailDisplay.jsx';
import EmailWrite from "./pages/EmailWrite.jsx";

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/email/:id" element={<EmailDisplay />} />
                <Route path="/email/write" element={<EmailWrite/>} />
            </Routes>
        </Router>
    );
};

export default App;

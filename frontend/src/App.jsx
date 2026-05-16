import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import History from './pages/History';
import './App.css';

export default function App() {
  return (
    <Router>
      <div style={{ maxWidth: 840, margin: "0 auto", padding: "3rem 1rem" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </div>
    </Router>
  );
}

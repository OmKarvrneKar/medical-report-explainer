import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import History from './pages/History';
import Login from './pages/Login';
import Register from './pages/Register';
import Account from './pages/Account';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const NavBar = () => {
  const { token, logout } = useAuth();
  
  if (!token) return null;
  
  return (
    <nav className="flex justify-between items-center bg-white/70 backdrop-blur-sm p-4 rounded-xl shadow-sm mb-6 border border-white/40">
      <div className="font-outfit font-bold text-slate-800 text-lg">Medical Explainer</div>
      <div className="flex gap-4">
        <Link to="/" className="text-slate-600 hover:text-blue-600 font-medium">Home</Link>
        <Link to="/history" className="text-slate-600 hover:text-blue-600 font-medium">History</Link>
        <Link to="/account" className="text-slate-600 hover:text-blue-600 font-medium">Account</Link>
        <button onClick={logout} className="text-slate-600 hover:text-red-600 font-medium">Logout</button>
      </div>
    </nav>
  );
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div style={{ maxWidth: 840, margin: "0 auto", padding: "1rem" }}>
          <NavBar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

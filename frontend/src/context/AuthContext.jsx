import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => sessionStorage.getItem("accessToken"));
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          setUser({ id: decoded.sub });
        }
      } catch (e) {
        logout();
      }
    } else {
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    const handleAuthFailed = () => logout();
    window.addEventListener("auth-failed", handleAuthFailed);
    return () => window.removeEventListener("auth-failed", handleAuthFailed);
  }, []);

  const login = (newToken) => {
    sessionStorage.setItem("accessToken", newToken);
    setToken(newToken);
  };

  const logout = () => {
    sessionStorage.removeItem("accessToken");
    setToken(null);
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

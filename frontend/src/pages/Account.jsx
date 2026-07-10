import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function Account() {
  const { logout } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleExport = async () => {
    try {
      const response = await api.get("/users/me/export");
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my_medical_data.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export data");
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.delete("/users/me", { data: { password } });
      logout();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete account");
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] p-8">
      <div className="max-w-2xl mx-auto bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/40">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 font-outfit">Account & Privacy</h2>
        
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Export Data</h3>
          <p className="text-sm text-slate-600 mb-4">
            Download a copy of all your medical reports and profile data in JSON format.
          </p>
          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            Export My Data
          </button>
        </div>

        <div className="border-t border-slate-200 pt-8">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Delete Account</h3>
          <p className="text-sm text-slate-600 mb-4">
            Permanently delete your account and all associated medical reports. This action cannot be undone.
          </p>
          
          {!showConfirm ? (
            <button 
              onClick={() => setShowConfirm(true)}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors"
            >
              Delete My Account
            </button>
          ) : (
            <form onSubmit={handleDelete} className="bg-red-50 p-4 rounded-xl border border-red-200">
              <p className="text-sm text-red-700 font-medium mb-3">
                To confirm deletion, please enter your password:
              </p>
              {error && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
              <input 
                type="password" 
                required
                className="w-full px-4 py-2 mb-3 rounded-lg border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
              <div className="flex gap-2">
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Confirm Delete
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShowConfirm(false); setPassword(""); setError(""); }}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Profile({ onClose }) {
  const [userData, setUserData] = useState({ email: '', age: '', gender: '' });
  const [newPassword, setNewPassword] = useState(''); // ✨ NEW STATE for password
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const API_URL = "https://sepsis-api-server.onrender.com";

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(response.data);
    } catch (err) {
      setError('Failed to load profile.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      // Build the data payload
      const payload = {
        age: parseInt(userData.age),
        gender: userData.gender
      };
      
      // Only send the password if the user actually typed something
      if (newPassword.trim() !== '') {
        payload.new_password = newPassword;
      }

      await axios.put(`${API_URL}/profile`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (userData.name) {
        localStorage.setItem('userName', userData.name);
      }
      
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      setNewPassword(''); // Clear the password field after saving

      window.dispatchEvent(new Event("storage"));
      
    } catch (err) {
      setError('Failed to update profile.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full relative">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 font-bold text-xl">
          &times;
        </button>

        <h2 className="text-2xl font-bold text-blue-900 mb-6 border-b pb-2">My Profile</h2>

        {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-center text-sm font-semibold">{error}</div>}
        {message && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded text-center text-sm font-semibold">{message}</div>}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Full Name</label>
            <input 
              type="text" 
              value={userData.name || ''} 
              disabled={!isEditing}
              onChange={(e) => setUserData({...userData, name: e.target.value})}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditing ? 'bg-slate-50 text-slate-700' : 'bg-white'}`} 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Email (Read Only)</label>
            <input 
              type="email" 
              value={userData.email} 
              disabled 
              className="w-full px-4 py-2 border rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed" 
            />
          </div>

          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-sm font-semibold text-slate-600 mb-1">Age</label>
              <input 
                type="number" 
                value={userData.age}
                disabled={!isEditing}
                onChange={(e) => setUserData({...userData, age: e.target.value})}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditing ? 'bg-slate-50' : 'bg-white'}`} 
              />
            </div>
            
            <div className="w-1/2">
              <label className="block text-sm font-semibold text-slate-600 mb-1">Gender</label>
              <select 
                value={userData.gender}
                disabled={!isEditing}
                onChange={(e) => setUserData({...userData, gender: e.target.value})}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditing ? 'bg-slate-50' : 'bg-white'}`}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          {/* ✨ NEW: Password Change Field (Only shows when editing) */}
          {isEditing && (
            <div className="pt-2">
              <label className="block text-sm font-semibold text-slate-600 mb-1">New Password</label>
              <input 
                type="password" 
                placeholder="Leave blank to keep current password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
              />
            </div>
          )}

          <div className="pt-4 flex gap-3">
            {!isEditing ? (
              <button type="button" onClick={() => setIsEditing(true)} className="w-full bg-blue-100 text-blue-700 font-bold py-2 rounded-lg hover:bg-blue-200 transition">
                Edit Profile
              </button>
            ) : (
              <>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditing(false);
                    setNewPassword(''); // Reset password field if they cancel
                  }} 
                  className="w-1/2 bg-slate-200 text-slate-700 font-bold py-2 rounded-lg hover:bg-slate-300 transition"
                >
                  Cancel
                </button>
                <button type="submit" className="w-1/2 bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition">
                  Save Changes
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import Profile from './Profile'; 

export default function Navbar({ isLoggedIn, onLogout, onDownload }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false); // Controls the popup
  const getInitials = () => {
    // ✨ Grab the name we saved during login
    const name = localStorage.getItem('userName'); 
    
    if (!name) return "U"; // Fallback to "U" if no name exists
    
    // Take the first letter and capitalize it
    return name.charAt(0).toUpperCase(); 
  };


  return (
    <>
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-black text-blue-900 tracking-tight">
            <span className="text-red-600">✚</span> Sepsis AI
          </div>
          
          <div className="flex gap-4 items-center">
            {/* Only show these options if the user is logged in */}
            {isLoggedIn && (
              <>
                <button 
                  onClick={onDownload} 
                  className="hidden md:block bg-green-50 text-green-700 font-semibold px-4 py-2 rounded-lg hover:bg-green-100 transition"
                >
                  ⬇ Download Excel Log
                </button>

                {/* Profile Icon & Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-bold hover:bg-blue-200 transition focus:outline-none"
                  >
                    {getInitials()}
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-2 overflow-hidden">
                      <button 
                        onClick={() => {
                          setShowProfile(true); // Open the modal
                          setDropdownOpen(false); // Close the dropdown menu
                        }} 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        My Profile
                      </button>
                      <button 
                        onClick={() => {
                          setDropdownOpen(false);
                          onLogout();
                        }} 
                        className="block w-full text-left px-4 py-2 text-red-600 font-semibold hover:bg-red-50 transition"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ✨ RENDER THE MODAL HERE ✨ */}
      {/* If showProfile is true, display the Profile popup over the screen */}
      {showProfile && (
        <Profile onClose={() => setShowProfile(false)} />
      )}
    </>
  );
}
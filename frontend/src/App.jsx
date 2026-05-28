import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Hero from './components/Hero';
import VitalsDashboard from './components/Dashboard';
import Footer from './components/Footer';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleDownloadExcel = () => {
    alert("Downloading 30-Day Vitals & Medical History Excel Sheet...");
  };

  return (
    // Flex-col and min-h-screen ensure the footer always stays at the bottom
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      
      {/* 1. Navbar is ALWAYS visible */}
      <Navbar 
        isLoggedIn={isLoggedIn} 
        onLogout={() => setIsLoggedIn(false)} 
        onDownload={handleDownloadExcel} 
      />

      {/* 2. Main Content Area */}
      {!isLoggedIn ? (
        // Show Login Page if NOT logged in
        <Login onLogin={() => setIsLoggedIn(true)} />
      ) : (
        // Show Dashboard if logged in
        <>
          <Hero />
          <VitalsDashboard />
        </>
      )}

      {/* 3. Footer is ALWAYS visible */}
      <Footer />
      
    </div>
  );
}
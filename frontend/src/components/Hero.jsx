import React from 'react';

export default function Hero() {
  return (
    <header className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          Real-Time Intelligence.<br />Lifesaving Action.
        </h1>
        <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
          Continuously monitoring patient vitals using an advanced ESP32 sensor and predictive machine learning to detect Sepsis before it's too late.
        </p>
        <a href="#dashboard" className="bg-white text-blue-900 font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition transform inline-block">
          View Live Vitals
        </a>
      </div>
    </header>
  );
}
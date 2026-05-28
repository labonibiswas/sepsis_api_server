import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export default function VitalsDashboard() {
  const [liveData, setLiveData] = useState({
    hr: '--', rr: '--', sbp: '--', dbp: '--', spo2: '--', temp: '--', risk: '0.0', status: 'Waiting...'
  });
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io("http://127.0.0.1:5000");

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('new_vitals', (data) => {
      console.log("🔥 LIVE DATA RECEIVED:", data);
      
      const date = new Date(data.timestamp);
      const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const riskPercent = (data.risk_score * 100).toFixed(1);
      const isDanger = riskPercent >= 50.0;
      
      // Map the raw data from Flask directly to our UI
      const newEntry = {
        time: timeString,
        hr: data.vitals?.hr || '--',
        rr: data.vitals?.rr || '--',
        sbp: data.vitals?.sbp || '--',
        dbp: data.vitals?.dbp || '--',
        spo2: data.vitals?.spo2 || '--',
        temp: data.vitals?.temp || '--',
        status: isDanger ? 'Warning' : 'Stable',
        risk: riskPercent
      };

      setLiveData(newEntry);
      setLogs((prevLogs) => [newEntry, ...prevLogs].slice(0, 10));
    });

    return () => socket.disconnect();
  }, []);

  return (
    <main id="dashboard" className="max-w-6xl mx-auto px-4 py-16 flex-grow w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Patient Dashboard</h2>
          <p className="text-slate-500">Live feed from ESP32 Cloud Server</p>
        </div>
        
        {isConnected ? (
          <div className="flex items-center gap-2 text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200 transition-all">
            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>
            System Online
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200 transition-all">
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            System Offline
          </div>
        )}
      </div>

      {/* TOP CARDS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 font-bold mb-1">HEART RATE</p>
          <p className="text-2xl font-black text-slate-800">{liveData.hr} <span className="text-sm font-medium text-slate-400">bpm</span></p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 font-bold mb-1">RESPIRATORY</p>
          <p className="text-2xl font-black text-slate-800">{liveData.rr} <span className="text-sm font-medium text-slate-400">bpm</span></p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 font-bold mb-1">OXYGEN</p>
          <p className="text-2xl font-black text-blue-600">{liveData.spo2} <span className="text-sm font-medium text-slate-400">%</span></p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 font-bold mb-1">BLOOD PRESSURE</p>
          <p className="text-2xl font-black text-slate-800">{liveData.sbp}/{liveData.dbp}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 font-bold mb-1">TEMPERATURE</p>
          <p className="text-2xl font-black text-slate-800">{liveData.temp} <span className="text-sm font-medium text-slate-400">°C</span></p>
        </div>
        <div className={`p-4 rounded-xl shadow-sm border ${parseFloat(liveData.risk) >= 50.0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
          <p className="text-xs text-slate-400 font-bold mb-1">RISK SCORE</p>
          <p className={`text-2xl font-black ${parseFloat(liveData.risk) >= 50.0 ? 'text-red-600' : 'text-green-500'}`}>
            {liveData.risk} <span className="text-sm font-medium opacity-70">%</span>
          </p>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Recent Logs</h3>
          <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">Last 10 updates</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-sm text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 font-semibold">Time</th>
                <th className="px-6 py-3 font-semibold">HR</th>
                <th className="px-6 py-3 font-semibold">RR</th>
                <th className="px-6 py-3 font-semibold">BP (Sys/Dia)</th>
                <th className="px-6 py-3 font-semibold">SpO2</th>
                <th className="px-6 py-3 font-semibold">Temp</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr><td colSpan="8" className="px-6 py-8 text-center text-slate-400 font-medium">Waiting for ESP32 sensor data...</td></tr>
              ) : (
                logs.map((log, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-medium text-slate-900">{log.time}</td>
                    <td className="px-6 py-4">{log.hr}</td>
                    <td className="px-6 py-4">{log.rr}</td>
                    <td className="px-6 py-4">{log.sbp}/{log.dbp}</td>
                    <td className="px-6 py-4">{log.spo2}%</td>
                    <td className="px-6 py-4">{log.temp}°C</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.status === 'Stable' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{log.status}</span>
                    </td>
                    <td className={`px-6 py-4 font-bold ${parseFloat(log.risk) >= 50.0 ? 'text-red-500' : 'text-slate-600'}`}>{log.risk}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
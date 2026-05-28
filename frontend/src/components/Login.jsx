import React, { useState } from 'react';
import axios from 'axios';

export default function Login({ onLogin }) {
  const [isLoginMode, setIsLoginMode] = useState(true);

  // --- FORM INPUT STATES ---
  const [name, setName] = useState(''); // ✨ NEW: Name state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = "http://127.0.0.1:5000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');   
    setSuccess(''); 

    if (isLoginMode) {
      // === LOGIN LOGIC ===
      try {
        const response = await axios.post(`${API_URL}/login`, {
          email: email,
          password: password
        });

        const token = response.data.token;
        const userName = response.data.name; // ✨ Grab the name from Flask
        
        localStorage.setItem('token', token);
        localStorage.setItem('userName', userName); // ✨ Save name to memory
        
        onLogin();

      } catch (err) {
        setError(err.response?.data?.message || 'Login failed. Check credentials.');
      }

    } else {
      // === REGISTRATION LOGIC ===
      try {
        await axios.post(`${API_URL}/register`, {
          name: name, // ✨ Send the actual typed name to Flask
          email: email,
          password: password,
          age: parseInt(age),
          gender: gender
        });

        setSuccess('Account created successfully! Please log in.');
        setPassword('');
        setIsLoginMode(true);

      } catch (err) {
        setError(err.response?.data?.message || 'Registration failed.');
      }
    }
  };

  return (
    <div className="flex-grow bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-900">Sepsis AI</h1>
          <p className="text-slate-500 mt-2">
            {isLoginMode ? 'Welcome back, Doctor.' : 'Register a new patient monitor.'}
          </p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center font-semibold">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-100 text-green-700 text-sm rounded-lg text-center font-semibold">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* ✨ NEW: Only show Name, Age, Gender fields during Registration */}
          {!isLoginMode && (
            <>
              <input 
                type="text" 
                placeholder="Full Name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                required 
              />
              <div className="flex gap-4">
                <input 
                  type="number" 
                  placeholder="Age" 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  required 
                />
                <select 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </>
          )}
          
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
            required 
          />
          
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition">
            {isLoginMode ? 'Login' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-slate-600">
          {isLoginMode ? "Don't have an account? " : "Already registered? "}
          <button 
            type="button"
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError('');
              setSuccess('');
            }} 
            className="text-blue-600 font-bold hover:underline"
          >
            {isLoginMode ? 'Sign up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}
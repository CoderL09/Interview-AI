// App.tsx
import { useState } from 'react'; 
import { Routes, Route, Navigate} from 'react-router-dom'; 
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import { Home } from './pages/Home';
import Login from './pages/Login'; 
import axios from 'axios'
import Interview from './pages/Interview';
import Market from './pages/Market';
import VoiceInterview from './pages/VoiceInterview';



function App() {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token')
  });

  function handleLogin(newToken: string) {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  }


  function handleLogout() {
    localStorage.removeItem('token');
    setToken(null);
    delete axios.defaults.headers.common['Authorization'];
  }

  return (
    <Routes>
      <Route path="/login" element={
        token ? <Navigate to="/home"/> : <Login onLogin={handleLogin} />
      } />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<LandingPage />} />
      
      <Route 
        path="/home" 
        element={token ? <Home onLogout={handleLogout} /> : <Navigate to="/login" />}  
      />
<Route path="/interview" element={token ? <Interview /> : <Navigate to="/login" />} />
      <Route path="/market" element={token ? <Market /> : <Navigate to="/login" />} />
      <Route path="/voice-interview" element={token ? <VoiceInterview /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
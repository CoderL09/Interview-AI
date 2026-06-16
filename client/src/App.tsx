import './index.css';
import { Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Register from './pages/register';
import Home from './pages/Home';
import Interview from './pages/Interview';
import Market from './pages/Market';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path='/interview' element={<Interview />}/>
      <Route path="/market" element={<Market />}/>
    </Routes>
  );
}

export default App;

import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Rooms from './pages/Rooms';
import Reconnect from './pages/Reconnect';
import Auth from './pages/Auth';
import ProtectedRoute from './auth/ProtectedRoute';

const Game = lazy(() => import('./pages/Game'));

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/registro" element={<Auth register />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/rooms" element={<ProtectedRoute><Rooms /></ProtectedRoute>} />
        <Route path="/game" element={<ProtectedRoute><Suspense fallback={<div className="game-route-loading">Carregando partida...</div>}><Game /></Suspense></ProtectedRoute>} />
        <Route path="/reconnect" element={<ProtectedRoute><Reconnect /></ProtectedRoute>} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Rooms from './pages/Rooms';
import Game from './pages/Game';
import Reconnect from './pages/Reconnect';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/game" element={<Game />} />
        <Route path="/reconnect" element={<Reconnect />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;

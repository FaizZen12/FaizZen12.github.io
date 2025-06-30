import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navigation } from './components/layout/Navigation';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Player } from './pages/Player';
import { Library } from './pages/Library';
import { Profile } from './pages/Profile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/player" element={<Player />} />
            <Route path="/library" element={<Library />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
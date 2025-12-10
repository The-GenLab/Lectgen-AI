import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import "./App.css";
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/log-in-or-create-account" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/log-in-or-create-account" replace />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

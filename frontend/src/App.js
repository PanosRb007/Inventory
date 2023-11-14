import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, /*useNavigate*/ } from 'react-router-dom';
import Purchases from './pages/Purchases.js';
import Vendors from './pages/Vendors.js';
import Outflow from './pages/Outflow.js';
import MaterialList from './pages/MaterialList.js';
import Projects from './pages/Projects.js';
import ProjectOutflows from './pages/ProjectOutflows.js';
import Stock from './pages/Stock.js';
import Login from './pages/Login.js'; // Import the Login component


import './App.css'; // Import custom CSS for App component

const API_BASE_URL = 'https://api.robbie.gr';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (token) => {
    localStorage.setItem('authToken', token); 
    console.log('local', localStorage);
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} apiBaseUrl={API_BASE_URL} />;
  }

  return (
    <div
      className={'App'}>
      <BrowserRouter>
        <nav className="sidebar">
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link to="/Purchases" className="nav-link">
                <span>Inflow</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/Outflow" className="nav-link">
                <span>Outflow</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/MaterialList" className="nav-link">
                <span>Material List</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/Vendors" className="nav-link">
                <span>Vendor List</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/Projects" className="nav-link">
                <span>Project List</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/Stock" className="nav-link">
                <span>Stock</span>
              </Link>
            </li>
          </ul>
        </nav>
        <main className="content">
          <header className="header">
            <h1 className="header-title">ROBBIE</h1>
          </header>
          <Routes>
          <Route path="/Purchases" element={<Purchases apiBaseUrl={API_BASE_URL}/>} />
            <Route path="/Outflow" element={<Outflow apiBaseUrl={API_BASE_URL} />} />
            <Route path="/Vendors" element={<Vendors apiBaseUrl={API_BASE_URL}/>} />
            <Route path="/MaterialList" element={<MaterialList apiBaseUrl={API_BASE_URL}/>} />
            <Route path="/Projects" element={<Projects apiBaseUrl={API_BASE_URL}/>} />
            <Route path="/ProjectOutflows" element={<ProjectOutflows apiBaseUrl={API_BASE_URL}/>} />
            <Route path="/Stock" element={<Stock apiBaseUrl={API_BASE_URL}/>} />

            {/* Add other routes for different pages */}
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

/*function ProtectedRoute({ children, isAuthenticated }) {
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  return children;
}*/

export default App;

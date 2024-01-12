import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Purchases from './pages/Purchases.js';
import Vendors from './pages/Vendors.js';
import Outflow from './pages/Outflow.js';
import MaterialList from './pages/MaterialList.js';
import Projects from './pages/Projects.js';
import ProjectOutflows from './pages/ProjectOutflows.js';
import Stock from './pages/Stock.js';
import Login from './pages/Login.js';
import MaterialCombiner from './pages/MaterialCombiner.js';


import './pages/PurchaseFunc.css'; // Import custom CSS for App component

const API_BASE_URL ='https://api.robbie.gr'; /*'http://localhost:8081';*/

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if the auth token is present in sessionStorage
    const authToken = sessionStorage.getItem('authToken');
    if (authToken) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (token) => {
    // Store the auth token in sessionStorage
    sessionStorage.setItem('authToken', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Remove the auth token from sessionStorage
    sessionStorage.removeItem('authToken');
    setIsAuthenticated(false);
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
            <li className="nav-item">
              <Link to="/combine-materials" className="nav-link">
                <span>Combine Materials</span>
              </Link>
            </li>
          </ul>
          <button onClick={handleLogout}>Logout</button>
        </nav>

        <main className="content">
          <header className="header">
            <h1 className="header-title">ROBBIE</h1>
          </header>
          <Routes>
            <Route path="/Purchases" element={<Purchases apiBaseUrl={API_BASE_URL} />} />
            <Route path="/Outflow" element={<Outflow apiBaseUrl={API_BASE_URL} />} />
            <Route path="/Vendors" element={<Vendors apiBaseUrl={API_BASE_URL} />} />
            <Route path="/MaterialList" element={<MaterialList apiBaseUrl={API_BASE_URL} />} />
            <Route path="/Projects" element={<Projects apiBaseUrl={API_BASE_URL} />} />
            <Route path="/ProjectOutflows" element={<ProjectOutflows apiBaseUrl={API_BASE_URL} />} />
            <Route path="/Stock" element={<Stock apiBaseUrl={API_BASE_URL} />} />
            <Route path="/combine-materials" element={<MaterialCombiner apiBaseUrl={API_BASE_URL} />} />

          </Routes>

        </main>

      </BrowserRouter>
    </div>
  );
}

export default App;

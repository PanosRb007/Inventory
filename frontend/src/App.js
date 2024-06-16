import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Purchases from './pages/Purchases.js';
import Vendors from './pages/Vendors.js';
import Outflow from './pages/Outflow.js';
import MaterialList from './pages/MaterialList.js';
import Projects from './pages/Projects.js';
import ProjectOutflows from './pages/ProjectOutflows.js';
import Stock from './pages/Stock.js';
import Login from './pages/Login.js';
import MaterialCombiner from './pages/MaterialCombiner.js';
import OrderList from './pages/Order_List.js';
import OutMatQuery from './pages/OutMatQuery.js';
import AddLaborHours from './pages/AddLaborHours.js';
import Employees from './pages/Employees.js';

import './pages/PurchaseFunc.css'; // Import custom CSS for App component

const API_BASE_URL ='https://api.robbie.gr';  /*'http://localhost:8081';*/

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    // Check if the auth token is present in sessionStorage
    const authToken = sessionStorage.getItem('authToken');
    const storedUserRole = sessionStorage.getItem('role');
    if (authToken && storedUserRole) {
      setIsAuthenticated(true);
      setUserRole(storedUserRole);
    }
  }, []);

  const handleLogin = (token, role) => {
    // Store the auth token and userRole in sessionStorage
    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('role', role);
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    // Remove the auth token and userRole from sessionStorage
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('role');
    setIsAuthenticated(false);
    setUserRole('');
  };

  console.log('role', userRole);

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} apiBaseUrl={API_BASE_URL} />;
  }

  return (
    <div className={'App'}>
      <BrowserRouter>
        <nav className="sidebar">
          <ul className="navbar-nav">
            <li className="nav-item">
              <NavLink to="/Purchases" className="nav-link" activeclassname="active">
                <i className="fas fa-truck"></i>
                <span>Inflow</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/Outflow" className="nav-link" activeclassname="active">
                <i className="fas fa-people-carry"></i>
                <span>Outflow</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/MaterialList" className="nav-link" activeclassname="active">
                <span>Material List</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/Vendors" className="nav-link" activeclassname="active">
                <span>Vendor List</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/Projects" className="nav-link" activeclassname="active">
                <span>Project List</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/Stock" className="nav-link" activeclassname="active">
                <span>Stock</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/combine-materials" className="nav-link" activeclassname="active">
                <span>Combine Materials</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/OrderList" className="nav-link" activeclassname="active">
                <span>Order List</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/AddLaborHours" className="nav-link" activeclassname="active">
                <span>Labor Hours</span>
              </NavLink>
            </li>
            {userRole !== 'Senior' && (
              <li className="nav-item">
                <NavLink to="/Employees" className="nav-link" activeclassname="active">
                  <span>Employees</span>
                </NavLink>
              </li>
            )}
          </ul>
          <button onClick={handleLogout}>Logout</button>
        </nav>

        <main className="content">
          <header className="header">
            <h1 className="header-title">ROBBIE</h1>
          </header>
          <Routes>
            <Route path="/" element={<Navigate to="/Purchases" />} />
            <Route path="/Purchases" element={<Purchases apiBaseUrl={API_BASE_URL} userRole={userRole} />}/>
            <Route path="/Outflow" element={<Outflow apiBaseUrl={API_BASE_URL} userRole={userRole}/>} />
            <Route path="/Vendors" element={<Vendors apiBaseUrl={API_BASE_URL} userRole={userRole}/>} />
            <Route path="/MaterialList" element={<MaterialList apiBaseUrl={API_BASE_URL} userRole={userRole}/>} />
            <Route path="/Projects" element={<Projects apiBaseUrl={API_BASE_URL} userRole={userRole}/>} />
            <Route path="/ProjectOutflows" element={<ProjectOutflows apiBaseUrl={API_BASE_URL} userRole={userRole}/>} />
            <Route path="/Stock" element={<Stock apiBaseUrl={API_BASE_URL} userRole={userRole}/>} />
            <Route path="/combine-materials" element={<MaterialCombiner apiBaseUrl={API_BASE_URL} userRole={userRole}/>} />
            <Route path="/OrderList" element={<OrderList apiBaseUrl={API_BASE_URL} userRole={userRole}/>} />
            <Route path="/OutMatQuery" element={<OutMatQuery apiBaseUrl={API_BASE_URL} userRole={userRole}/>} />
            <Route path="/AddLaborHours" element={<AddLaborHours apiBaseUrl={API_BASE_URL} userRole={userRole}/>} />
            {userRole !== 'Senior' && (
              <Route path="/Employees" element={<Employees apiBaseUrl={API_BASE_URL} userRole={userRole}/>} />
            )}
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;

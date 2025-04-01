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
import Calendar from './pages/Calendar.js';
import {
  FaTruck, FaPeopleCarry, FaBoxes, FaIndustry, FaProjectDiagram, FaWarehouse,
  FaLayerGroup, FaClipboardList, FaClock, FaUsers, FaSignOutAlt, FaCalendarAlt
} from "react-icons/fa";
import logo from './ROBBIE orizontio - black.png';
import './pages/PurchaseFunc.css'; // Import custom CSS for App component

const API_BASE_URL = 'https://api.robbie.gr';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const authToken = sessionStorage.getItem('authToken');
    const storedUserRole = sessionStorage.getItem('role');
    if (authToken && storedUserRole) {
      setIsAuthenticated(true);
      setUserRole(storedUserRole);
    }
  }, []);

  const handleLogin = (token, role) => {
    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('role', role);
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('role');
    setIsAuthenticated(false);
    setUserRole('');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} apiBaseUrl={API_BASE_URL} />;
  }

  return (
    <div className="App">
      <BrowserRouter>

        <nav className="sidebar">
          <ul className="navbar-nav">
            {(userRole === 'graphics' || true) && (
              <>
                <li className="nav-item">
                  <NavLink to="/Purchases" className="nav-link">
                    <FaTruck size={18} />
                    <span>Inflow</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/Outflow" className="nav-link">
                    <FaPeopleCarry size={18} />
                    <span>Outflow</span>
                  </NavLink>
                </li>

              </>
            )}
            {userRole !== 'graphics' && (
              <>
                <li className="nav-item">
                  <NavLink to="/AddLaborHours" className="nav-link">
                    <FaClock size={18} />
                    <span>Labor Hours</span>
                  </NavLink>
                </li>

                <li className="nav-item">
                  <NavLink to="/OrderList" className="nav-link">
                    <FaClipboardList size={18} />
                    <span>Order List</span>
                  </NavLink>
                </li>


                <li className="nav-item">
                  <NavLink to="/Calendar" className="nav-link">
                    <FaCalendarAlt size={18} />
                    <span>Calendar</span>
                  </NavLink>
                </li>

                <li className="nav-item">
                  <NavLink to="/MaterialList" className="nav-link">
                    <FaBoxes size={18} />
                    <span>Material List</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/Vendors" className="nav-link">
                    <FaIndustry size={18} />
                    <span>Vendor List</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/Projects" className="nav-link">
                    <FaProjectDiagram size={18} />
                    <span>Project List</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/Stock" className="nav-link">
                    <FaWarehouse size={18} />
                    <span>Stock</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/combine-materials" className="nav-link">
                    <FaLayerGroup size={18} />
                    <span>Combine Materials</span>
                  </NavLink>
                </li>
                {userRole !== 'Senior' && (
                  <li className="nav-item">
                    <NavLink to="/Employees" className="nav-link">
                      <FaUsers size={18} />
                      <span>Employees</span>
                    </NavLink>
                  </li>
                )}
              </>
            )}
          </ul>
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt size={18} />
            <span>Logout</span>
          </button>
        </nav>

        {/* Main content */}
        <main className="content">
          <header className="app-header">
            <img src={logo} alt="ROBBIE Logo" className="logo" />
          </header>
          <Routes>
            <Route path="/" element={<Navigate to="/Purchases" />} />
            <Route path="/Purchases" element={<Purchases apiBaseUrl={API_BASE_URL} userRole={userRole} />} />
            <Route path="/Outflow" element={<Outflow apiBaseUrl={API_BASE_URL} userRole={userRole} />} />
            <Route path="/Calendar" element={<Calendar apiBaseUrl={API_BASE_URL} userRole={userRole} />} />

            {userRole !== 'graphics' && (
              <>
                <Route path="/Vendors" element={<Vendors apiBaseUrl={API_BASE_URL} userRole={userRole} />} />
                <Route path="/MaterialList" element={<MaterialList apiBaseUrl={API_BASE_URL} userRole={userRole} />} />
                <Route path="/Projects" element={<Projects apiBaseUrl={API_BASE_URL} userRole={userRole} />} />
                <Route path="/ProjectOutflows" element={<ProjectOutflows apiBaseUrl={API_BASE_URL} userRole={userRole} />} />
                <Route path="/Stock" element={<Stock apiBaseUrl={API_BASE_URL} userRole={userRole} />} />
                <Route path="/combine-materials" element={<MaterialCombiner apiBaseUrl={API_BASE_URL} userRole={userRole} />} />
                <Route path="/OrderList" element={<OrderList apiBaseUrl={API_BASE_URL} userRole={userRole} />} />
                <Route path="/OutMatQuery" element={<OutMatQuery apiBaseUrl={API_BASE_URL} userRole={userRole} />} />
                <Route path="/AddLaborHours" element={<AddLaborHours apiBaseUrl={API_BASE_URL} userRole={userRole} />} />
                {userRole !== 'Senior' && (
                  <Route path="/Employees" element={<Employees apiBaseUrl={API_BASE_URL} userRole={userRole} />} />
                )}
              </>
            )}
          </Routes>

        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;

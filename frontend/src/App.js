import 'bootstrap/dist/css/bootstrap-grid.min.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Purchases from './pages/Purchases.js';
import Vendors from './pages/Vendors.js';
import Outflow from './pages/Outflow.js';
import MaterialList from './pages/MaterialList.js';
import Projects from './pages/Projects.js';
import ProjectOutflows from './pages/ProjectOutflows.js';
import Stock from './pages/Stock.js';

import './App.css'; // Import custom CSS for App component

function App() {


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
            <Route path="/Purchases" element={<Purchases />} />
            <Route path="/Outflow" element={<Outflow />} />
            <Route path="/Vendors" element={<Vendors />} />
            <Route path="/MaterialList" element={<MaterialList />} />
            <Route path="/Projects" element={<Projects />} />
            <Route path="/ProjectOutflows" element={<ProjectOutflows />} />
            <Route path="/Stock" element={<Stock />} />

            {/* Add other routes for different pages */}
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;

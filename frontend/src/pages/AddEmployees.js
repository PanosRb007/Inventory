import React, { useState } from 'react';

const AddEmployees = ({ apiBaseUrl, onAddEmployee }) => {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [department, setDepartment] = useState('');
  const [tel, setTel] = useState('');
  const [mail, setMail] = useState('');
  const [wage, setWage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiBaseUrl}/employeesAPI`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ name, surname, department, tel, mail, wage }),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || 'Failed to add employee');
      }

      const newEmployee = await response.json();
      onAddEmployee(newEmployee);
      setName('');
      setSurname('');
      setDepartment('');
      setTel('');
      setMail('');
      setWage('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <h2 className="heading">Add New Employee</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Name:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Surname:</label>
          <input type="text" value={surname} onChange={(e) => setSurname(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Department:</label>
          <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Tel:</label>
          <input type="tel" value={tel} onChange={(e) => setTel(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Mail:</label>
          <input type="email" value={mail} onChange={(e) => setMail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Wage:</label>
          <input type="number" value={wage} onChange={(e) => setWage(e.target.value)} required />
        </div>
        <button type="submit"  className="add_btn">Add Employee</button>
      </form>
    </div>
  );
};

export default AddEmployees;

import React, { useState } from 'react';
import './PurchaseFunc.css';

const AddEmployee = ({ handleAddEmployee }) => {
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    surname: '',
    department: '',
    tel: '',
    mail: '',
    wage: null,
    active: 1 // Default to active
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNewEmployee((prevEmployee) => ({
      ...prevEmployee,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleAddEmployee(newEmployee);
    resetForm();
  };

  const resetForm = () => {
    setNewEmployee({
      name: '',
      surname: '',
      department: '',
      tel: '',
      mail: '',
      wage: null,
      active: 1
    });
  };

  return (
    <div className="container">
      <h2 className="heading">Add Employee</h2>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>
              Employee Name:
              <input
                type="text"
                name="name"
                value={newEmployee.name}
                onChange={handleInputChange}
              />
            </label>
          </div>
          <div className="form-group">
            <label>
              Surname:
              <input
                type="text"
                name="surname"
                value={newEmployee.surname}
                onChange={handleInputChange}
              />
            </label>
          </div>
          <div className="form-group">
            <label>
              Department:
              <input
                type="text"
                name="department"
                value={newEmployee.department}
                onChange={handleInputChange}
              />
            </label>
          </div>
          <div className="form-group">
            <label>
              Tel:
              <input
                type="text"
                name="tel"
                value={newEmployee.tel}
                onChange={handleInputChange}
              />
            </label>
          </div>
          <div className="form-group">
            <label>
              Email:
              <input
                type="email"
                name="mail"
                value={newEmployee.mail}
                onChange={handleInputChange}
              />
            </label>
          </div>
          <div className="form-group">
            <label>
              Wage:
              <input
                type="number"
                name="wage"
                value={newEmployee.wage}
                onChange={handleInputChange}
              />
            </label>
          </div>
        </div>
        <div>
          <button className='add_btn' type="submit">Add Employee</button>
        </div>
      </form>
    </div>
  );
};

export default AddEmployee;

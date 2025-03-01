import React, { useState, memo, useCallback } from 'react';
import './PurchaseFunc.css';

const AddEmployees = memo(({ handleAddEmployee }) => {
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    surname: '',
    department: '',
    tel: '',
    mail: '',
    wage: null,
    active: 1, // Default to active
  });

  const handleInputChange = useCallback((event) => {
    const { name, value } = event.target;
    setNewEmployee((prevEmployee) => ({
      ...prevEmployee,
      [name]: value,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setNewEmployee({
      name: '',
      surname: '',
      department: '',
      tel: '',
      mail: '',
      wage: null,
      active: 1,
    });
  }, []);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[0-9]{10}$/;


      if (!newEmployee.name || !newEmployee.surname || !newEmployee.department) {
        alert('Name, surname, and department are required.');
        return;
      }
      if (newEmployee.tel && !phoneRegex.test(newEmployee.tel)) {
        alert('Telephone must be 10 digits.');
        return;
      }
      if (newEmployee.mail && !emailRegex.test(newEmployee.mail)) {
        alert('Please enter a valid email address.');
        return;
      }

      handleAddEmployee(newEmployee);
      resetForm();
    },
    [handleAddEmployee, newEmployee, resetForm]
  );

  const FormGroup = React.memo(({ label, type, name, value, onChange, placeholder }) => (
    <div className="form-group">
      <label>
        {label}
        <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required />
      </label>
    </div>
  ));


  return (
    <div className="container">
      <h2 className="heading">Add Employee</h2>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <form className="form" onSubmit={handleSubmit}>
            <FormGroup
              label="Employee Name:"
              type="text"
              name="name"
              value={newEmployee.name}
              onChange={handleInputChange}
              placeholder="Enter employee name"
              required
            />
            <FormGroup
              label="Surname:"
              type="text"
              name="surname"
              value={newEmployee.surname}
              onChange={handleInputChange}
              placeholder="Enter employee surname"
              required
            />
            <FormGroup
              label="Department:"
              type="text"
              name="department"
              value={newEmployee.department}
              onChange={handleInputChange}
              placeholder="Enter department"
              required
            />
            <FormGroup
              label="Tel:"
              type="text"
              name="tel"
              value={newEmployee.tel}
              onChange={handleInputChange}
              placeholder="Enter telephone"
            />
            <FormGroup
              label="Email:"
              type="email"
              name="mail"
              value={newEmployee.mail}
              onChange={handleInputChange}
              placeholder="Enter email"
            />
            <FormGroup
              label="Wage:"
              type="number"
              name="wage"
              value={newEmployee.wage || ''}
              onChange={handleInputChange}
              placeholder="Enter wage"
              min="0"
            />
            <button className="add_btn" type="submit">
              Add Employee
            </button>
          </form>

        </div>
        <div>
          <button className="add_btn" type="submit">
            Add Employee
          </button>
        </div>
      </form>
    </div>
  );
});

export default AddEmployees;

import React, { useState, useEffect } from 'react';

const EditEmployees = ({ employee, handleUpdate, handleCancel, userRole }) => {
  const [editedEmployee, setEditedEmployee] = useState({ ...employee });

  useEffect(() => {
    setEditedEmployee(employee);
  }, [employee]);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setEditedEmployee((prevEmployee) => ({
      ...prevEmployee,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleUpdate(editedEmployee);
  };

  return (
    <div className="container">
      <h2 className="heading">Edit Employee</h2>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>
              Employee Name:
              <input
                type="text"
                name="name"
                value={editedEmployee.name}
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
                value={editedEmployee.surname}
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
                value={editedEmployee.department}
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
                value={editedEmployee.tel}
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
                value={editedEmployee.mail}
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
                value={editedEmployee.wage}
                onChange={handleInputChange}
              />
            </label>
          </div>
          <div className="form-group">
            <label>
              Active:
              <input
  type="checkbox"
  name="active"
  checked={editedEmployee.active}
  onChange={handleInputChange} // Pass the event properly
/>


            </label>
          </div>
          <button type="submit">Save changes</button>
          <button type="button" onClick={handleCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default EditEmployees;

import React, { useState } from 'react';
import './PurchaseFunc.css';

const AddVendor = ({ handleAddVendor }) => {
  const [newVendor, setNewVendor] = useState({
    name: '',
    field: '',
    mail: '',
    tel: '',
    contactname: ''
    // Add additional fields as needed for the vendor
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNewVendor((prevVendor) => ({
      ...prevVendor,
      [name]: value,
    }));
  };



  const handleSubmit = (event) => {
    event.preventDefault();
    handleAddVendor(newVendor);
    resetForm();
  };

  const resetForm = () => {
    setNewVendor({
      name: '',
      field: '',
      mail: '',
      tel: '',
      contactname: ''
      // Reset additional fields as needed for the vendor
    });
  };

  return (
    <div className="container">
      <div>
        <h2 className="heading">Add Vendor</h2>
      </div>
      <form className="form" onSubmit={handleSubmit}>
        <div className='form-row'>
          <div className='form-group'>
            <label>Vendor Name:</label>
            <input
              type="text"
              name="name"
              value={newVendor.name}
              onChange={handleInputChange}
            />
          </div>
          <div className='form-group'>
            <label>Field:</label>
            <input
              type="text"
              name="field"
              value={newVendor.field}
              onChange={handleInputChange}
            />
          </div>
          <div className='form-group'>
            <label>
              Email:</label>
            <input
              type="email"
              name="mail"
              value={newVendor.mail}
              onChange={handleInputChange}
            />

          </div>
          <div className='form-group'>
            <label>
              Telephone:</label>
            <input
              type="tel"
              name="tel"
              value={newVendor.tel}
              onChange={handleInputChange}
            />

          </div>
          <div className='form-group'>
            <label>
              Contact Name:</label>
            <input
              type="text"
              name="contactname"
              value={newVendor.contactname}
              onChange={handleInputChange}
            />

          </div>
          <div>
            <button className='add_btn' type="submit">Add Vendor</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddVendor;

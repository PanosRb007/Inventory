import React, { useState } from 'react';

const AddVendor = ({handleAddVendor}) => {
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
    <div className="add-vendor-container">
      <h2 className="add-vendor-heading">Add Vendor</h2>
      <form className="add-vendor-form" onSubmit={handleSubmit}>
        <label>
          Vendor Name:
          <input
            type="text"
            name="name"
            value={newVendor.name}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Field:
          <input
            type="text"
            name="field"
            value={newVendor.field}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Email:
          <input
            type="email"
            name="mail"
            value={newVendor.mail}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Telephone:
          <input
            type="tel"
            name="tel"
            value={newVendor.tel}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Contact Name:
          <input
            type="text"
            name="contactname"
            value={newVendor.contactname}
            onChange={handleInputChange}
          />
        </label>
        <button type="submit">Add Vendor</button>
      </form>
    </div>
  );
};

export default AddVendor;

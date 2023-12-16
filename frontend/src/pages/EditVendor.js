import React, { useState } from 'react';
import './PurchaseFunc.css';

const Editvendor = ({ vendor, handleUpdate, handleCancel }) => {
    const [editedVendor, setEditedVendor] = useState({ ...vendor });

     
    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setEditedVendor((prevVendor) => ({
          ...prevVendor,
          [name]: value,
        }));
      };
    
      const handleSubmit = (event) => {
        event.preventDefault();
        handleUpdate(editedVendor);
        resetForm();
      };
    
      const resetForm = () => {
        setEditedVendor({
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
      <h2 className="heading">Edit Vendor</h2>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              name="name"
              id="name"
              value={editedVendor.name}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="field">Field:</label>
            <textarea
              id="field"
              name="field"
              value={editedVendor.field}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="mail">Mail:</label>
            <input
              type="email"
              name="mail"
              id="mail"
              value={editedVendor.mail}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="tel">Telephone:</label>
            <input
              type="tel"
              name="tel"
              id="tel"
              value={editedVendor.tel}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="contactname">Contact Name:</label>
            <input
              type="contactname"
              name="contactname"
              id="contactname"
              value={editedVendor.contactname}
              onChange={handleInputChange}
            />
          </div>
          
        </div>
        <button type="submit" className="add_btn">Update</button>
        <button type="button" className="add_btn" onClick={handleCancel}>Cancel</button>
      </form>
    </div>
  );
};

export default Editvendor;

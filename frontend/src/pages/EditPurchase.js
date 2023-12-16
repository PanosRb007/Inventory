import React, { useState } from 'react';
import './PurchaseFunc.css';
const EditPurchase = ({ purchase, handleUpdate, locations, materials, vendors, handleCancel, apiBaseUrl }) => {


  const [editedPurchase, setEditedPurchase] = useState({ ...purchase });

  console.log('editedpuchase', editedPurchase);
  console.log('editedPurchase:', editedPurchase);
  console.log('myPurchase:', purchase);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setEditedPurchase((prevPurchase) => ({
      ...prevPurchase,
      [name]: value,
    }));
  };

  const handleSave = () => {
    handleUpdate(editedPurchase);

    // Check if vendor or price is changed to post to materialchangesAPI
    if (editedPurchase.vendor !== purchase.vendor || editedPurchase.price !== purchase.price) {
      const materialChangeData = {
        material_id: editedPurchase.materialid,
        vendor: editedPurchase.vendor,
        price: editedPurchase.price,
      };
      const authToken = sessionStorage.getItem('authToken');

      // Make a POST request to materialchangesAPI
      fetch(`${apiBaseUrl}/materialchangesAPI`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(materialChangeData),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log('Material changes saved:', data);
        })

        .catch((error) => {
          console.error('Error saving material changes:', error);
        });
    }
  };

  // Check if material.extras !== 1 to hide "Width" and "Lot No" inputs
  const hideWidthAndLotNo =
    materials.find((material) => material.matid === editedPurchase.materialid)?.extras !== 1;

  const handleCancelClick = () => {
    handleCancel(); // Call the cancel function passed as a prop
  };

  return (
    <div className="container">
      <h2>Edit Purchase</h2>
      <div className="form">
        <div className="form-row">
          <div className="form-group">
            <label>
              Location:
              <select name="location" value={editedPurchase.location} onChange={handleChange} required>
                <option value="">Select a location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.locationname}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {hideWidthAndLotNo ? null : (
            <>
              <div className="form-group">
                <label>
                  Width:
                  <input type="text" name="width" value={editedPurchase.width} onChange={handleChange} />
                </label>
              </div>
              <div className="form-group">
                <label>
                  Lot No:
                  <input
                    type="text"
                    name="lotnumber"
                    value={editedPurchase.lotnumber}
                    onChange={handleChange}
                  />
                </label>
              </div>
            </>
          )}
          <div className="form-group">
            <label>
              Quantity:
              <input
                type="text"
                name="quantity"
                value={editedPurchase.quantity}
                onChange={handleChange}
              />
            </label>
          </div>
          <div className="form-group">
            <label>
              Price:
              <input type="text" name="price" value={editedPurchase.price} onChange={handleChange} />
            </label>
          </div>
          <div className="form-group">
            <label>
              Vendor:
              <select name="vendor" value={editedPurchase.vendor} onChange={handleChange} required>
                <option value="">Select a vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.vendorid} value={vendor.vendorid}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>
      <div>
        <button onClick={handleSave}>Save</button>
        <button type="button" className="cancel-btn" onClick={handleCancelClick}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default EditPurchase;

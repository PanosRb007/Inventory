import React, { useState } from 'react';
import './PurchaseFunc.css';

const PurchVer = ({ purchase, handleUpdate, handleCancel, apiBaseUrl }) => {


  const [verPurchase, setVerPurchase] = useState({ ...purchase});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setVerPurchase((prevPurchase) => ({
      ...prevPurchase,
      [name]: value,
    }));
  };

  const handleSave = () => {
    handleUpdate(verPurchase);
  };

  const handleCancelClick = () => {
    handleCancel(); // Call the cancel function passed as a prop
  };


  return (
    <div className='container'>
      <div className='form-row'>
        <div className='form-group'>
          <label>
            Comments:
            <textarea type="text" name="comments" value={verPurchase.comments} onChange={handleChange} />
          </label>
        </div>
        <div className='form-group'>
          <label>
            Invoice Date:
            <input type="date" name="verification" value={verPurchase.verification} onChange={handleChange} />
          </label>
        </div>
        <div>
          <button onClick={handleSave}>Save</button>
          <button type="button" className="cancel-btn" onClick={handleCancelClick}>
            Cancel
          </button>
        </div>
      </div>
    </div>

  );
}

export default PurchVer;

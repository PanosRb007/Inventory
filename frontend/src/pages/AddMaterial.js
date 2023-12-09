import React, { useState } from 'react';
import './PurchaseFunc.css';

const AddMaterial = ({ handleAdd }) => {
  const [newMaterial, setNewMaterial] = useState({
    matid: '',
    name: '',
    description: '',
    field: '',
    unit_of_measure: '',
    extras: '',
    shelflife: '',
    minstock: '',
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNewMaterial((prevMaterial) => ({
      ...prevMaterial,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleAdd(newMaterial);
    resetForm();
  };

  const resetForm = () => {
    setNewMaterial({
      matid: '',
      name: '',
      description: '',
      field: '',
      unit_of_measure: '',
      extras: '',
      shelflife: '',
      minstock: '',
    });
  };

  return (
    <div className="container">
      <h2 className="heading">Add Material</h2>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="matid">Material ID:</label>
            <input
              type="text"
              id="matid"
              name="matid"
              value={newMaterial.matid}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={newMaterial.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              name="description"
              value={newMaterial.description}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="field">Field:</label>
            <input
              type="text"
              id="field"
              name="field"
              value={newMaterial.field}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="unit_of_measure">Unit of Measure:</label>
            <input
              type="text"
              id="unit_of_measure"
              name="unit_of_measure"
              value={newMaterial.unit_of_measure}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="extras">Extra Characteristics:</label>
            <input
              type="number"
              id="extras"
              name="extras"
              value={newMaterial.extras}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="shelflife">Shelf Life:</label>
            <input
              type="number"
              id="shelflife"
              name="shelflife"
              value={newMaterial.shelflife}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="minstock">Minimum Stock:</label>
            <input
              type="number"
              id="minstock"
              name="minstock"
              value={newMaterial.minstock}
              onChange={handleInputChange}
              required
            />
          </div>
          <button type="submit" className="add_btn">
            Add
          </button>
        </div>

      </form>
    </div>
  );
};

export default AddMaterial;

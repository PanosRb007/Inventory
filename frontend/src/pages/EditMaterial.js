import React, { useState } from 'react';
import './PurchaseFunc.css';

const EditMaterial = ({ material, handleUpdate, handleCancel}) => {
  const [name, setName] = useState(material.name || ''); // Set to empty string if `material.name` is null or undefined
  const [description, setDescription] = useState(material.description || '');
  const [field, setField] = useState(material.field || '');
  const [unitOfMeasure, setUnitOfMeasure] = useState(material.unit_of_measure || '');
  const [extras, setExtras] = useState(material.extras || '');
  const [shelfLife, setShelfLife] = useState(material.shelflife || '');
  const [minStock, setMinStock] = useState(material.minstock || '');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Create an updatedMaterial object with the modified fields
    const updatedMaterial = {
      ...material,
      name,
      description,
      field,
      unit_of_measure: unitOfMeasure,
      extras,
      shelflife: shelfLife,
      minstock: minStock,
    };

    // Pass the updated material to the handleUpdate function
    handleUpdate(updatedMaterial);
  };

  return (
    <div className="container">
      <h2 className="heading">Edit Material</h2>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="field">Field:</label>
            <input
              type="text"
              id="field"
              value={field}
              onChange={(e) => setField(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="unitOfMeasure">Unit of Measure:</label>
            <input
              type="text"
              id="unitOfMeasure"
              value={unitOfMeasure}
              onChange={(e) => setUnitOfMeasure(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="extras">Extra Characteristics:</label>
            <input
              type="number"
              id="extras"
              value={extras}
              onChange={(e) => setExtras(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="shelfLife">Shelf Life:</label>
            <input
              type="number"
              id="shelfLife"
              value={shelfLife}
              onChange={(e) => setShelfLife(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="minStock">Minimum Stock:</label>
            <input
              type="number"
              id="minStock"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
            />
          </div>
        </div>
        <button type="submit" className="edit-btn">Update</button>
        <button type="button" className="add_btn" onClick={handleCancel}>Cancel</button>
      </form>
    </div>
  );
};

export default EditMaterial;

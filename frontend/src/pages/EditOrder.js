import React, { useState } from 'react';
import Select from 'react-select';

const EditOrder = ({ order, handleUpdate, handleCancel, vendors, locations, materials }) => {
  const [editedOrder, setEditedOrder] = useState({ ...order });

  console.log(editedOrder);
  console.log(locations);
  console.log(materials);


  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setEditedOrder((prevorder) => ({
      ...prevorder,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleUpdate(editedOrder);
    resetForm();
  };

  const resetForm = () => {
    setEditedOrder({
      // Reset the fields as needed for the order
      // Example:
      name: '',
      description: '',
      prmatcost: '',
      prlabcost: '',
      sale: '',
      realmatcost: '',
      reallabcost: '',
      totalcost: '',
      // Add other fields here
    });
  };

  const findUnitOfMeasure = () => {
    const material = materials.find((mat) => mat.matid === editedOrder.material_id);
    return material ? material.unit_of_measure : '';
  };

  return (
    <div className="container">
      <h2 className="heading">Edit order</h2>
      <form className="form" onSubmit={handleSubmit}>
        <div className='form-row'>
          <div className='form-group'>
            <label>
              Location:
              <select name="location_id" value={editedOrder.location_id} onChange={handleInputChange} required>
                <option value="">Select a location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.locationname}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className='form-group'>
            <label>
              Material Id:
              <input
                type="text"
                name="material_id"
                defaultValue={editedOrder.material_id} // Use defaultValue instead of value
                readOnly // Make the field read-only
              />
            </label>
          </div>



          <div className='form-group'>
            <label>Material Name:</label>
            <input type="text" name="materialname" value={materials.find(mat => mat.matid === editedOrder.material_id)?.name} readOnly required />
          </div>
          <div className='form-group'>
            <label>
              Order Quantity:
              <input
                type="number"
                name="quantity"
                value={editedOrder.quantity}
                onChange={handleInputChange}
              />
            </label>
          </div>


          <div className='form-group'>
            <label>
              Unit Price:
              <input
                type="number"
                name="unitprice"
                value={editedOrder.unitprice}
                onChange={handleInputChange}
              />
            </label>
          </div>
          <div className='form-group'>
            <label>
              Unit of Measure:
              <input
                type="text"
                name="unit_of_measure"
                value={findUnitOfMeasure()}
                readOnly
              />
            </label>
          </div>
          <div className='form-group'>
            <label>
              Vendor:
              <Select
                value={editedOrder.vendor_id ? { value: editedOrder.vendor_id, label: vendors.find(v => v.vendorid === editedOrder.vendor_id)?.name } : null}
                onChange={(selectedOption) => handleInputChange(selectedOption.value)}
                options={vendors.map(vendor => ({ value: vendor.vendorid, label: vendor.name }))}
                placeholder="Select Vendor"
                isSearchable={true}
              />
            </label>
          </div>

          <button type="submit">Edit order</button>
          <button type="button" className="add_btn" onClick={handleCancel}>
            Cancel
          </button>

        </div>
      </form>

    </div>
  );
};

export default EditOrder;

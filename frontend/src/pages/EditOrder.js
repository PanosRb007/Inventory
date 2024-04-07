import React, { useState } from 'react';
import Select from 'react-select';

const EditOrder = ({ latestdata, order, handleUpdate, handleCancel, vendors, locations, materials }) => {
  const [editedOrder, setEditedOrder] = useState({ ...order });

  console.log(editedOrder);
  console.log(locations);
  console.log(materials);
  console.log('latestdata', latestdata);


  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setEditedOrder((prevorder) => ({
      ...prevorder,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
  
    // Determine the unit price and set it in the editedOrder before submission
    const updatedUnitPrice = parseFloat(determineUnitPrice());
    const updatedOrderWithPrice = { 
      ...editedOrder, 
      unitprice: parseFloat(updatedUnitPrice), 
      };
  
    console.log('Submitting Edited Order:', updatedOrderWithPrice);
    handleUpdate(updatedOrderWithPrice);
    resetForm();
  };
  



  const resetForm = () => {
    setEditedOrder([]);
  };

  const findUnitOfMeasure = () => {
    const material = materials.find((mat) => mat.matid === editedOrder.material_id);
    return material ? material.unit_of_measure : '';
  };

  const findLatestPrice = () => {
    // Filter the latestdata to find records that match the editedOrder's material_id
    const relevantRecords = latestdata.filter((record) => record.material_id === editedOrder.material_id);
  
    // Use reduce to find the record with the highest change_id among the filtered records
    const latestRecord = relevantRecords.reduce((prev, current) => {
      return (prev.change_id > current.change_id) ? prev : current;
    }, {change_id: -1, price: 0}); // Default to an object with a price of 0 if no records are found
  
    // Return the price of the record with the highest change_id, converted to a float
    return parseFloat(latestRecord.price);
  };
  
  // Function to determine the correct unit price to display
  const determineUnitPrice = () => {
    // Check if the edited unit price is not 0, use it; otherwise, find the latest price
    return parseFloat(editedOrder.unitprice) && parseFloat(editedOrder.unitprice) !== 0 ? editedOrder.unitprice : findLatestPrice();
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
                value={determineUnitPrice()} // Dynamically set the value based on the condition
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
                name="vendor_id"
                value={editedOrder.vendor_id ? { value: editedOrder.vendor_id, label: vendors.find(v => v.vendorid === editedOrder.vendor_id)?.name } : null}
                onChange={(selectedOption) => handleInputChange({ target: { name: 'vendor_id', value: selectedOption.value } })}
                options={vendors.map(vendor => ({ value: parseInt(vendor.vendorid), label: vendor.name }))}
                placeholder="Select Vendor"
                isSearchable={true}
              />


            </label>
          </div>
          <div className='form-group'>
          <label>
              Comments:
              <textarea
                type="text"
                name="comments"
                value= {editedOrder.comments}
                onChange={handleInputChange}
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

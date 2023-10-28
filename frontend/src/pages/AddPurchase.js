import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import './AddPurchase.css';
import AddMaterial from './AddMaterial.js';
import AddVendor from './AddVendor.js';

const AddPurchase = ({ handleAdd, locations, materials, setMaterials, vendors, setVendors, apiBaseUrl }) => {
  const [showAddMaterialForm, setShowAddMaterialForm] = useState(false);
  const [showAddVendorForm, setShowAddVendorForm] = useState(false);

  const openAddMaterialForm = () => {
    setShowAddMaterialForm(true);
  };

  const openAddVendorForm = () => {
    setShowAddVendorForm(true);
  };

  const initialPurchaseState = {
    location: '',
    materialid: '',
    materialname: '',
    quantity: '',
    price: '',
    vendor: '',
    vendorname: '',
    width: null,
    lotnumber: '',
  };

  const [newPurchase, setNewPurchase] = useState(initialPurchaseState);
  const [showExtras, setShowExtras] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
    
        if (newPurchase.materialid) {
          try {
            const [responseChanges, responseList] = await Promise.all([
              fetch(`${apiBaseUrl}/materialchangesAPI/${newPurchase.materialid}`),
              fetch(`${apiBaseUrl}/materiallist/${newPurchase.materialid}`),
            ]);
  
            const [dataChanges, dataList] = await Promise.all([
              responseChanges.json(),
              responseList.json(),
            ]);
  
              if (dataList && dataList.extras === 1) {
                setShowExtras(true);
              } else {
                setShowExtras(false);
              }
  
              if (dataChanges && dataChanges.price && dataChanges.vendor) {
                setNewPurchase((prevPurchase) => ({
                  ...prevPurchase,
                  price: dataChanges.price,
                  vendor: dataChanges.vendor,
                  vendorname: vendors.find((vendor) => vendor.vendorid === dataChanges.vendor).name,
                }));
              } else {
                setNewPurchase((prevPurchase) => ({
                  ...prevPurchase,
                  price: '',
                  vendor: '',
                  vendorname: '',
                }));
              }
  
            setNewPurchase((prevPurchase) => ({
              ...prevPurchase,
              materialname: dataList && dataList.name ? dataList.name : '',
            }));
          } catch (error) {
            console.error('Error fetching material data:', error);
          }
        } else {
          setShowExtras(false);
          setNewPurchase((prevPurchase) => ({
            ...prevPurchase,
            price: '',
            vendor: '',
            vendorname: '',
            materialname: '',
          }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    fetchData();
  }, [newPurchase.materialid, vendors, apiBaseUrl]);
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewPurchase((prevPurchase) => ({
      ...prevPurchase,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    

    try {
      const responseChanges = await fetch(`${apiBaseUrl}/materialchangesAPI/${newPurchase.materialid}`);
      const dataChanges = await responseChanges.json();

      const hasChanges =
        dataChanges &&
        (dataChanges.price !== newPurchase.price ||
          dataChanges.vendor !== newPurchase.vendor);

      if (dataChanges && hasChanges) {
        const response = await fetch(`${apiBaseUrl}/materialchangesAPI/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            material_id: newPurchase.materialid,
            price: newPurchase.price,
            vendor: newPurchase.vendor,
          }),
        });

        if (!response.ok) {
          console.error('Failed to create material change:', response);
          return;
        }
      }

      handleAdd(newPurchase);
      setNewPurchase(initialPurchaseState);
    } catch (error) {
      console.error('Error handling the form submission:', error);
    }
  };

  
  const handleAddMat = useCallback((newMaterial) => {
    const materialExists = materials.some(
      (material) => material.matid === newMaterial.matid || material.name === newMaterial.name
    );
    if (materialExists) {
      alert('Material ID or name already exists.');
      return;
    }
  
    fetch(`${apiBaseUrl}/materiallist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newMaterial),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Error adding material');
        }
      })
      .then((data) => {
        setMaterials([...materials, newMaterial]);
        setShowAddMaterialForm(false);
      })
      .catch((error) => {
        console.log('Error adding material:', error);
      });
  }, [materials, setMaterials, setShowAddMaterialForm, apiBaseUrl]);

  const handleAddVendor = useCallback(async (newVendor) => {
    try {
      // Send an HTTP request to add the new vendor
      const addResponse = await fetch(`${apiBaseUrl}/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newVendor),
      });
  
      if (!addResponse.ok) {
        throw new Error('Error adding vendor');
      }
  
      // Fetch the updated list of vendors from '/vendorsAPI'
      const response = await fetch(`${apiBaseUrl}/vendors`);
  
      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }
  
      const data = await response.json();
      setVendors(data); // Assuming 'setVendors' is a state updater function
      setShowAddVendorForm(false);
    } catch (error) {
      console.error('Error handling the form submission:', error);
    }
  }, [setVendors, setShowAddVendorForm, apiBaseUrl]);
  

  return (
    <div>
      <div>
      <h2 className="add-heading">Add Purchase</h2>
      </div>
        <div>
        </div>
      <form onSubmit={handleSubmit} className="add-form">
        <div>
          <label>Location:</label>
          <select name="location" value={newPurchase.location} onChange={handleChange} required>
            <option value="">Select a location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.locationname}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Material ID:<span className="add-icon" onClick={openAddMaterialForm}>
              +
            </span></label>
            <Select
            name="materialid"
            value={newPurchase.materialid ? { value: newPurchase.materialid, label: newPurchase.materialid } : null}
            options={materials.map((material) => ({
              value: material.matid,
              label: material.matid,
            }))}
            onChange={(selectedOption) => handleChange({ target: { name: 'materialid', value: selectedOption.value } })}
            placeholder="Select a material"
            required // Add the required attribute
          />   
        </div>
        <div>
          <label>Material Name:</label>
          <input type="text" name="materialname" value={newPurchase.materialname} readOnly required />
        </div>
        {showExtras && (
          <div>
            <label>Width:</label>
            <input
              type="number"
              name="width"
              value={newPurchase.width || ''}
              onChange={handleChange}
              required
            />
          </div>
        )}
        {showExtras && (
          <div>
            <label>LOT#:</label>
            <input
              type="text"
              name="lotnumber"
              value={newPurchase.lotnumber || ''}
              onChange={handleChange}
              required
            />
          </div>
        )}
        <div>
          <label>Quantity:</label>
          <input type="text" name="quantity" value={newPurchase.quantity} onChange={handleChange} required />
        </div>
        <div>
          <label>Price:</label>
          <input
            type="text"
            name="price"
            value={newPurchase.price || ''}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Vendor:<span className="add-icon" onClick={openAddVendorForm}>
              +
            </span></label>
          <Select
            name="vendor"
            value={newPurchase.vendor ? { value: newPurchase.vendor, label: vendors.find(ven => ven.vendorid === newPurchase.vendor)?.name } : null}
            options={vendors.map((vendor) => ({
              value: parseInt(vendor.vendorid),
              label: vendor.name,
            }))}
            onChange={(selectedOption) =>
              handleChange({ target: { name: 'vendor', value: selectedOption.value, vendorname: selectedOption.label } })
            }
            placeholder="Select a Vendor"
            isSearchable
            required
          />
        </div>
        <button type="submit" className="add_btn">
          Add Purchase
        </button>
      </form>
      {showAddMaterialForm && (
        <div className="add-material-overlay">
          <div className="add-material-popup">
            <span className="close-popup" onClick={() => setShowAddMaterialForm(false)}>
              &times;
            </span>
            <AddMaterial handleAdd={handleAddMat} />
          </div>
        </div>
      )}

      {showAddVendorForm && (
        <div className="add-material-overlay">
          <div className="add-material-popup">
            <span className="close-popup" onClick={() => setShowAddVendorForm(false)}>
              &times;
            </span>
            <AddVendor handleAddVendor={handleAddVendor}/>
          </div>
        </div>
      )}

    </div>
  );
};

export default AddPurchase;

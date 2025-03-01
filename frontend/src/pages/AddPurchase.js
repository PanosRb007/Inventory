import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import './PurchaseFunc.css';
import AddMaterial from './AddMaterial.js';
import AddVendor from './AddVendor.js';

const AddPurchase = ({ handleAdd, locations, materials, setMaterials, vendors, setVendors, apiBaseUrl, order }) => {
  const [showAddMaterialForm, setShowAddMaterialForm] = useState(false);
  const [showAddVendorForm, setShowAddVendorForm] = useState(false);

  const openAddMaterialForm = () => {
    setShowAddMaterialForm(true);
  };

  const openAddVendorForm = () => {
    setShowAddVendorForm(true);
  };

  const initialPurchaseState = order ? {
    location: order.location_id || '',
    materialid: order.material_id || '',
    materialname: materials.find(m => order.material_id === m.matid)?.name || '',
    quantity: order.quantity || '',
    price: order.unitprice || '',
    vendor: order.vendor_id || '',
    vendorname: order.vendorname || '',
    width: order.width || null,
    lotnumber: order.lotnumber || '',
    comments: order.comments || '',
    invdate: order.invdate || '',
    verification: order.verification || '',
  } : {
    location: '',
    materialid: '',
    materialname: '',
    quantity: '',
    price: '',
    vendor: '',
    vendorname: '',
    width: null,
    lotnumber: '',
    comments: '',
    invdate: '',
    verification: '',
  };
  

  const [newPurchase, setNewPurchase] = useState(initialPurchaseState);
  const [showExtras, setShowExtras] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const authToken = sessionStorage.getItem('authToken'); // Retrieve the authToken

      const fetchWithAuth = async (url, options = {}) => {
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${authToken}`,
          },
        });
      };

      try {

        if (newPurchase.materialid) {
          try {
            const [responseChanges, responseList] = await Promise.all([
              fetchWithAuth(`${apiBaseUrl}/materialchangesAPI/${newPurchase.materialid}`),
              fetchWithAuth(`${apiBaseUrl}/materiallist/${newPurchase.materialid}`),
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

  const handleMaterialIdChange = (selectedOption) => {
    const material = materials.find(m => m.matid === selectedOption.value);
    setNewPurchase(prevPurchase => ({
      ...prevPurchase,
      materialid: selectedOption.value,
      materialname: material ? material.name : '',
    }));
  };

  const handleMaterialNameChange = (selectedOption) => {
    const material = materials.find(m => m.name === selectedOption.label);
    setNewPurchase(prevPurchase => ({
      ...prevPurchase,
      materialid: material ? material.matid : '',
      materialname: selectedOption.label,
    }));
  };



  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewPurchase((prevPurchase) => ({
      ...prevPurchase,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const authToken = sessionStorage.getItem('authToken'); // Retrieve the authToken

    const fetchWithAuth = async (url, options = {}) => {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${authToken}`,
        },
      });
    };


    try {

      const responseChanges = await fetchWithAuth(`${apiBaseUrl}/materialchangesAPI/${newPurchase.materialid}`);
      const dataChanges = await responseChanges.json();

      const hasChanges =
        dataChanges &&
        (dataChanges.price !== newPurchase.price ||
          dataChanges.vendor !== newPurchase.vendor);

      if (dataChanges && hasChanges) {
        const response = await fetchWithAuth(`${apiBaseUrl}/materialchangesAPI/`, {
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
    const authToken = sessionStorage.getItem('authToken'); // Retrieve the authToken

    const fetchWithAuth = async (url, options = {}) => {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${authToken}`,
        },
      });
    };

    const materialExists = materials.some(
      (material) => material.matid === newMaterial.matid || material.name === newMaterial.name
    );
    if (materialExists) {
      alert('Material ID or name already exists.');
      return;
    }

    fetchWithAuth(`${apiBaseUrl}/materiallist`, {
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

    const authToken = sessionStorage.getItem('authToken'); // Retrieve the authToken

    const fetchWithAuth = async (url, options = {}) => {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${authToken}`,
        },
      });
    };
    try {
      // Send an HTTP request to add the new vendor
      const addResponse = await fetchWithAuth(`${apiBaseUrl}/vendors`, {
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
      const response = await fetchWithAuth(`${apiBaseUrl}/vendors`);

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
    <div className='container'>
      <div>
        <h2 className="heading">Add Purchase</h2>
      </div>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <div className="form-group">
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
          <div className="form-group">
            <label>Material ID:<span className="add-icon" onClick={openAddMaterialForm}>
              +
            </span></label>
            <Select
              classNamePrefix="select-field"
              name="materialid"
              value={newPurchase.materialid ? { value: newPurchase.materialid, label: newPurchase.materialid } : null}
              options={materials.map((material) => ({
                value: material.matid,
                label: material.matid,
              }))}
              onChange={handleMaterialIdChange}
              placeholder="Select a material"
              required
              
            />
          </div>
          <div className="form-group">
            <label>Material Name:</label>
            <Select
              classNamePrefix="select-field"
              name="materialname"
              value={newPurchase.materialname ? { value: newPurchase.materialname, label: newPurchase.materialname } : null}
              options={materials.map((material) => ({
                value: material.name,
                label: material.name,
              }))}
              onChange={handleMaterialNameChange}
              placeholder="Select a material name"
              required
             
            />
          </div>
          {showExtras && (
            <div className="form-group">
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
            <div className="form-group">
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
          <div className="form-group">
            <label>Quantity:</label>
            <input type="text" name="quantity" value={newPurchase.quantity} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Price:</label>
            <input
              type="text"
              name="price"
              value={newPurchase.price || ''}
              onChange={handleChange}
              required

            />
          </div>
          <div className="form-group">
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
              className="select-field"
            />
          </div>
          <div className='form-group'>
            <label>
              Comments:
              <textarea type="text" name="comments" value={newPurchase.comments} onChange={handleChange} />
            </label>
          </div>
          <div className='form-group'>
          <label>
            Invoice Date:
            <input type="date" name="verification" value={newPurchase.verification} onChange={handleChange} />
          </label>
        </div>
          <button type="submit" className="add_btn">
            Add Purchase
          </button>
        </div>
      </form>
      {showAddMaterialForm && (
        <div className="overlay">
          <div className="popup">
            <span className="close-popup" onClick={() => setShowAddMaterialForm(false)}>
              &times;
            </span>
            <AddMaterial handleAdd={handleAddMat} />
          </div>
        </div>
      )}

      {showAddVendorForm && (
        <div className="overlay">
          <div className="popup">
            <span className="close-popup" onClick={() => setShowAddVendorForm(false)}>
              &times;
            </span>
            <AddVendor handleAddVendor={handleAddVendor} />
          </div>
        </div>
      )}

    </div>
  );
};

export default AddPurchase;

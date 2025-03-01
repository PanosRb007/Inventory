import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Select from 'react-select';
import './PurchaseFunc.css';
import AddMaterial from './AddMaterial.js';
import AddVendor from './AddVendor.js';

const AddPurchase = ({ handleAdd, locations, materials, setMaterials, vendors, setVendors, apiBaseUrl, order }) => {
  const [showAddMaterialForm, setShowAddMaterialForm] = useState(false);
  const [showAddVendorForm, setShowAddVendorForm] = useState(false);

  const openAddMaterialForm = () => setShowAddMaterialForm(true);
  const openAddVendorForm = () => setShowAddVendorForm(true);

  const initialPurchaseState = useMemo(
    () => (order ? {
      order_list_id: order.order_list_id || '',
      location: order.location_id || '',
      materialid: order.material_id || '',
      materialname: materials.find(m => m.matid === order.material_id)?.name || '',
      quantity: order.quantity || '',
      price: parseFloat(order.unitprice) || '',
      vendor: order.vendor_id || '',
      vendorname: vendors.find(v => v.vendorid === order.vendor_id)?.name || '',
      width: order.width || null,
      lotnumber: order.lotnumber || '',
      comments: order.comments || '',
      invdate: order.invdate || '',
      verification: order.verification || ''
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
      verification: ''
    }),
    [order, materials, vendors]
  );

  console.log('initialPurchaseState',initialPurchaseState);

  const [newPurchase, setNewPurchase] = useState(initialPurchaseState);
  const [showExtras, setShowExtras] = useState(false);

  const fetchAPI = useCallback(async (url, options = {}) => {
    const authToken = sessionStorage.getItem('authToken');
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    const contentType = response.headers.get('Content-Type');
    if (!response.ok) {
      let errorMessage = `Error fetching ${url}`;
      if (contentType && contentType.includes('application/json')) {
        const errorResponse = await response.json();
        errorMessage = errorResponse.message || errorMessage;
      } else {
        const errorResponse = await response.text();
        console.error(`Response error: ${errorResponse}`);
      }
      throw new Error(errorMessage);
    }
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    } else {
      throw new Error(`Expected JSON response but got content type: ${contentType}`);
    }
  }, []);

  useEffect(() => {
    setNewPurchase({
      order_list_id: order.order_list_id || '',
      location: order?.location_id || '',
      materialid: order?.material_id || '',
      materialname: materials.find(m => m.matid === order?.material_id)?.name || '',
      quantity: order?.quantity || '',
      price: parseFloat(order?.unitprice)|| '',
      vendor: order?.vendor_id || '',
      vendorname: vendors.find(v => v.vendorid === order?.vendor_id)?.name || '',
      width: order?.width || null,
      lotnumber: order?.lotnumber || '',
      comments: order?.comments || '',
      invdate: order?.invdate || '',
      verification: order?.verification || '',
      // Add other fields as necessary
    });
  }, [order, materials, vendors]);
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (newPurchase.materialid) {
          const responseChanges = await fetchAPI(`${apiBaseUrl}/materialchangesAPI/${newPurchase.materialid}`);
          const dataList = await fetchAPI(`${apiBaseUrl}/materiallist/${newPurchase.materialid}`);
  
          if (dataList && dataList.extras === 1) {
            setShowExtras(true);
          } else {
            setShowExtras(false);
          }
  
          if (responseChanges && responseChanges.price && responseChanges.vendor) {
            setNewPurchase((prevPurchase) => ({
              ...prevPurchase,
              // Check if initialPurchaseState has a price, if not use responseChanges.price
              price: initialPurchaseState.price ? initialPurchaseState.price : responseChanges.price,
              // Check if initialPurchaseState has a vendor, if not use responseChanges.vendor
              vendor: initialPurchaseState.vendor ? initialPurchaseState.vendor : responseChanges.vendor,
              // Find the vendor name using the vendor ID from either initialPurchaseState or responseChanges
              vendorname: vendors.find((vendor) => vendor.vendorid === (initialPurchaseState.vendor ? initialPurchaseState.vendor : responseChanges.vendor))?.name || '',
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
        } else {
          setShowExtras(false);
          setNewPurchase(initialPurchaseState);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    fetchData();
  }, [initialPurchaseState,newPurchase.materialid, vendors, apiBaseUrl, fetchAPI]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewPurchase(prevPurchase => ({
      ...prevPurchase,
      [name]: value,
    }));
  };

  const handleMaterialIdChange = (selectedOption) => {
    const material = materials.find(m => m.matid === selectedOption.value);
    handleChange({ target: { name: 'materialid', value: selectedOption.value } });
    if (material) {
      handleChange({ target: { name: 'materialname', value: material.name } });
    }
  };

  const handleMaterialNameChange = (selectedOption) => {
    const material = materials.find(m => m.name === selectedOption.label);
    handleChange({ target: { name: 'materialname', value: selectedOption.label } });
    if (material) {
      handleChange({ target: { name: 'materialid', value: material.matid } });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const dataChangesResponse = await fetchAPI(`${apiBaseUrl}/materialchangesAPI/${newPurchase.materialid}`);
      // Assuming dataChangesResponse correctly fetches the existing data for comparison
      const hasChanges = dataChangesResponse && (
        parseFloat(dataChangesResponse.price) !== parseFloat(newPurchase.price) ||
        dataChangesResponse.vendor !== newPurchase.vendor
      );
  
      if (hasChanges) {
        const response = await fetchAPI(`${apiBaseUrl}/materialchangesAPI/`, {
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
  
        // Assuming the response is already parsed as JSON in your fetchAPI function
        if (!response.ok) {
          console.error('Failed to create material change:', await response.json());
          return;
        }
  
        // Here you check the actual content of the response to log success
        const responseData = await response.json(); // Properly parse the JSON response
        if (responseData.success) {
          alert('Material change created successfully.');
          console.log('Material change created successfully:', responseData.json());
        } else {
          console.error('Failed to create material change despite success response:', responseData.json());
          return;
        }
      } else {
        console.log('No changes detected, skipping material change creation.');
      }
      console.log('newpurchorderlist',newPurchase);
      await handleAdd(newPurchase); // Ensure handleAdd is properly defined and awaited
      setNewPurchase(null);
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

    fetchAPI(`${apiBaseUrl}/materiallist`, {
      method: 'POST',
      body: JSON.stringify(newMaterial),
    })
      .then((response) => {
        if (response.ok) {
          return response();
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
  }, [fetchAPI, materials, setMaterials, setShowAddMaterialForm, apiBaseUrl]);

  const handleAddVendor = useCallback(async (newVendor) => {

    
    try {
      // Send an HTTP request to add the new vendor
      const addResponse = await fetchAPI(`${apiBaseUrl}/vendors`, {
        method: 'POST',
        body: JSON.stringify(newVendor),
      });

      if (!addResponse.ok) {
        throw new Error('Error adding vendor');
      }

      // Fetch the updated list of vendors from '/vendorsAPI'
      const response = await fetchAPI(`${apiBaseUrl}/vendors`);

      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }

      const data = await response();
      setVendors(data); // Assuming 'setVendors' is a state updater function
      setShowAddVendorForm(false);
    } catch (error) {
      console.error('Error handling the form submission:', error);
    }
  }, [fetchAPI, setVendors, setShowAddVendorForm, apiBaseUrl]);


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

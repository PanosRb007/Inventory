import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import './PurchaseFunc.css';
import AddMaterial from './AddMaterial.js';
import AddVendor from './AddVendor.js';

const AddPurchase = ({ handleAdd, locations, materials, setMaterials, vendors, setVendors, apiBaseUrl, order, userRole }) => {
  const [showAddMaterialForm, setShowAddMaterialForm] = useState(false);
  const [showAddVendorForm, setShowAddVendorForm] = useState(false);

  const openAddMaterialForm = () => {
    setShowAddMaterialForm(true);
  };

  const openAddVendorForm = () => {
    setShowAddVendorForm(true);
  };

  // 1. Διάβασε το τελευταίο location από το localStorage
  const lastLocation = localStorage.getItem('lastLocation');

  const initialPurchaseState = order ? {
    location: order.location_id || lastLocation || (userRole === 'graphics' ? 1 : ''),
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
    location: lastLocation || (userRole === 'graphics' ? 1 : ''),
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

  // Δημιουργία fetchWithAuth ΜΙΑ φορά
  const fetchWithAuth = useCallback(async (url, options = {}) => {
    const authToken = sessionStorage.getItem('authToken');
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {

      try {
        if (!newPurchase.materialid) {
          setShowExtras(false);
          setNewPurchase(prev => ({
            ...prev,
            price: '',
            vendor: '',
            vendorname: '',
            materialname: ''
          }));
          return;
        }

        const [responseChanges, responseList] = await Promise.all([
          fetchWithAuth(`${apiBaseUrl}/materialchangesAPI/${newPurchase.materialid}`),
          fetchWithAuth(`${apiBaseUrl}/materiallist/${newPurchase.materialid}`),
        ]);

        const [dataChanges, dataList] = await Promise.all([
          responseChanges.json(),
          responseList.json(),
        ]);

        setShowExtras(dataList?.extras === 1);

        let finalChange = null;

        if (Array.isArray(dataChanges) && dataChanges.length > 0) {
          console.log("Fetched all dataChanges:", dataChanges);

          // 1. Προσπαθεί να βρει την εγγραφή που ταιριάζει στο `location`
          const matchedChange = dataChanges.find(change => Number(change.location) === Number(newPurchase.location));

          // 2. Αν δεν βρει, παίρνει την πιο πρόσφατη διαθέσιμη εγγραφή (η πρώτη στο array)
          finalChange = matchedChange || dataChanges[0];

          console.log("Final Change Used:", finalChange);
        }

        // **Προσθέσαμε έλεγχο πριν το `setNewPurchase()` για αποφυγή περιττών updates**
        setNewPurchase(prevPurchase => {
          if (
            prevPurchase.price === (finalChange?.price || '') &&
            prevPurchase.vendor === (finalChange?.vendor || '') &&
            prevPurchase.vendorname === (vendors.find(v => v.vendorid === finalChange?.vendor)?.name || '') &&
            prevPurchase.materialname === (dataList?.name || '')
          ) {
            return prevPurchase; // **Αποφεύγουμε το update αν τα δεδομένα είναι ίδια**
          }

          return {
            ...prevPurchase,
            price: finalChange?.price || '',
            vendor: finalChange?.vendor || '',
            vendorname: vendors.find(v => v.vendorid === finalChange?.vendor)?.name || '',
            materialname: dataList?.name || '',
          };
        });

        console.log("Final Price:", finalChange?.price || '');
        console.log("Final Vendor:", finalChange?.vendor || '');
        console.log("Final Vendor Name:", vendors.find(v => v.vendorid === finalChange?.vendor)?.name || '');
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [newPurchase.materialid, newPurchase.location, apiBaseUrl, vendors, fetchWithAuth]);


  const handleMaterialIdChange = (selectedOption) => {
    const material = materials.find(m => m.matid === selectedOption.value);
    setNewPurchase(prevPurchase => {
      if (
        prevPurchase.materialid === selectedOption.value &&
        prevPurchase.materialname === (material ? material.name : '')
      ) {
        return prevPurchase; // Αποφυγή update αν δεν αλλάζει κάτι
      }
      return {
        ...prevPurchase,
        materialid: selectedOption.value,
        materialname: material ? material.name : '',
      };
    });
  };

  const handleMaterialNameChange = (selectedOption) => {
    const material = materials.find(m => m.name === selectedOption.label);
    setNewPurchase(prevPurchase => {
      if (
        prevPurchase.materialname === selectedOption.label &&
        prevPurchase.materialid === (material ? material.matid : '')
      ) {
        return prevPurchase; // Αποφυγή update αν δεν αλλάζει κάτι
      }
      return {
        ...prevPurchase,
        materialid: material ? material.matid : '',
        materialname: selectedOption.label,
      };
    });
  };



  // 2. Όταν αλλάζει το location, αποθήκευσέ το στο localStorage
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Αν η τιμή δεν αλλάζει, μην κάνεις update
    setNewPurchase((prevPurchase) => {
      if (prevPurchase[name] === value) return prevPurchase;
      // Για το location, αποθήκευσε στο localStorage μόνο αν αλλάζει
      if (name === 'location') {
        localStorage.setItem('lastLocation', value);
      }
      return {
        ...prevPurchase,
        [name]: value,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Έλεγχος για διπλό LOT#
    const duplicateLot = materials.some(mat =>
      mat.lotnumber === newPurchase.lotnumber &&
      mat.materialid === newPurchase.materialid &&
      mat.location === newPurchase.location &&
      (mat.width === newPurchase.width || (!mat.width && !newPurchase.width))
    );
    if (duplicateLot) {
      alert('Υπάρχει ήδη αυτό το LOT# για το ίδιο υλικό, τοποθεσία και πλάτος!');
      return;
    }

    try {

      const responseChanges = await fetchWithAuth(`${apiBaseUrl}/materialchangesAPI/${newPurchase.materialid}/${newPurchase.location}`);
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
            location: newPurchase.location,
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
  }, [materials, setMaterials, setShowAddMaterialForm, apiBaseUrl, fetchWithAuth]);

  const handleAddVendor = useCallback(async (newVendor) => {

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
  }, [setVendors, setShowAddVendorForm, apiBaseUrl, fetchWithAuth]);


  return (
    <div className='container'>
      <div>
        <h2 className="heading">Add Purchase</h2>
      </div>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          {userRole !== 'graphics' ? (
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
          ) : (
            <input type="hidden" name="location" value={1} />
          )}
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
              isDisabled={!newPurchase.location}

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
              isDisabled={!newPurchase.location}
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
                min="0"
                step="0.01" // <-- επιτρέπει δύο δεκαδικά
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
            <input
              type="number"
              name="quantity"
              value={newPurchase.quantity}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
            />
          </div>
          <div className="form-group">
            <label>Price:</label>
            <input
              type="number"
              name="price"
              value={newPurchase.price || ''}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
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

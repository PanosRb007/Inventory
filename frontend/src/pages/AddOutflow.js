import React, { useCallback, useState, useEffect } from 'react';
import Select from 'react-select';
import './PurchaseFunc.css';
import AddProject from './AddProject.js';

const AddOutflow = ({ handleAdd, locations, materials, employees, projects, outflows, purchases, apiBaseUrl, setProjects, userRole }) => {

  const initialOutflowState = {
    location: userRole === 'graphics' ? 1 : '',
    locationname: '',
    materialid: '',
    materialname: '',
    quantity: '',
    width: null,
    lotnumber: '',
    employee: userRole === 'graphics' ? 6 : '',
    project: '',
    quotedItemid: '',
    comments: '',
  };


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
    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(errorResponse.message || `Error fetching ${url}`);
    }
    return response.json();
  }, []);

  const [newOutflow, setNewOutflow] = useState(initialOutflowState);
  const [showExtras, setShowExtras] = useState(false);
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [availableWidths, setAvailableWidths] = useState([]);
  const [availableLots, setAvailableLots] = useState([]);
  const [showAddProjectForm, setShowAddProjectForm] = useState(false);
  const [remainingQuantities, setRemainingQuantities] = useState([]);
  const [availableQuotedItems, setAvailableQuotedItems] = useState([]); // State for quoted items

  const openAddProjectForm = () => {
    setShowAddProjectForm(true);
  };
  console.log('availablematerials:', availableMaterials);


  useEffect(() => {
    const fetchMaterials = async () => {
      if (newOutflow.location) {
        try {
          const response = await fetchAPI(`${apiBaseUrl}/remaining_quantityAPI/${newOutflow.location}`);
          const filteredMaterials = response.filter(material => material.remaining_quantity > 0); // Filter remaining_quantity > 0
          setAvailableMaterials(filteredMaterials);
        } catch (error) {
          console.error('Error fetching unique materials:', error);
        }
      }
    };

    fetchMaterials();
  }, [newOutflow.location, apiBaseUrl, fetchAPI]);

  useEffect(() => {
    if (newOutflow.project) {
      const selectedProject = projects.find(project => project.prid === newOutflow.project);
      if (selectedProject?.quotedItems) {
        setAvailableQuotedItems(selectedProject.quotedItems);
      } else {
        setAvailableQuotedItems([]);
      }
    } else {
      setAvailableQuotedItems([]);
    }
  }, [newOutflow.project, projects]);

  useEffect(() => {
    if (newOutflow.materialid) {
      const filteredWidths = availableMaterials
        .filter(material => material.materialid === newOutflow.materialid && material.remaining_quantity > 0)
        .map(material => ({
          width: material.width,
          remaining_quantity: material.remaining_quantity,
          total_inflows: material.total_inflows,
          total_outflows: material.total_outflows,
        }));
      setAvailableWidths(filteredWidths);
    } else {
      setAvailableWidths([]);
    }
  }, [newOutflow.materialid, availableMaterials]);

  useEffect(() => {
    if (newOutflow.materialid && newOutflow.width) {
      const filteredLots = availableMaterials
        .filter(material =>
          material.materialid === newOutflow.materialid &&
          material.width === newOutflow.width &&
          material.remaining_quantity > 0
        )
        .map(material => ({
          lotnumber: material.lotnumber,
          remaining_quantity: material.remaining_quantity,
          total_inflows: material.total_inflows,
          total_outflows: material.total_outflows,
        }));
      setAvailableLots(filteredLots);
    } else {
      setAvailableLots([]);
    }
  }, [newOutflow.materialid, newOutflow.width, availableMaterials]);

  const calculateRemainingQuantities = (purchases, outflows) => {
    const materialMap = new Map();

    // Helper function to generate a unique key based on width presence
    const generateKey = (item) =>
      item.width !== null
        ? `${item.location}-${item.materialid}-${item.width}-${item.lotnumber}`
        : `${item.location}-${item.materialid}`;

    // Process purchases
    purchases.forEach((purchase) => {
      const key = generateKey(purchase);
      if (!materialMap.has(key)) {
        materialMap.set(key, {
          location: purchase.location,
          materialid: purchase.materialid,
          width: purchase.width,
          lotnumber: purchase.lotnumber,
          totalPurchases: 0,
          totalOutflows: 0,
          purchasesCount: 0, // Counter for purchases
          outflowsCount: 0,  // Counter for outflows
        });
      }
      const material = materialMap.get(key);
      material.totalPurchases += parseFloat(purchase.quantity || 0);
      material.purchasesCount += 1; // Increment purchases count
      materialMap.set(key, material);
    });

    // Process outflows
    outflows.forEach((outflow) => {
      const key = generateKey(outflow);
      if (!materialMap.has(key)) {
        materialMap.set(key, {
          location: outflow.location,
          materialid: outflow.materialid,
          width: outflow.width,
          lotnumber: outflow.lotnumber,
          totalPurchases: 0,
          totalOutflows: 0,
          purchasesCount: 0, // Counter for purchases
          outflowsCount: 0,  // Counter for outflows
        });
      }
      const material = materialMap.get(key);
      material.totalOutflows += parseFloat(outflow.quantity || 0);
      material.outflowsCount += 1; // Increment outflows count
      materialMap.set(key, material);
    });

    // Generate the final array of materials with remaining quantities and counts
    return Array.from(materialMap.values()).map((material) => ({
      location: material.location,
      materialid: material.materialid,
      width: material.width,
      lotnumber: material.lotnumber,
      remainingQuantity: material.totalPurchases - material.totalOutflows,
      totalPurchases: material.totalPurchases,
      totalOutflows: material.totalOutflows,
      purchasesCount: material.purchasesCount,
      outflowsCount: material.outflowsCount,
    }));
  };

  useEffect(() => {
    const updatedQuantities = calculateRemainingQuantities(purchases, outflows);
    setRemainingQuantities(updatedQuantities);
  }, [purchases, outflows]);


  const handleMaterialIdChange = (selectedOption) => {
    const selectedMaterialId = selectedOption.value; // Get the selected material id
    const material = materials.find((m) => m.matid === selectedMaterialId); // Find the material with the selected id
    const materialName = material ? material.name : ''; // Get the name of the material
    setShowExtras(material.extras === 1);

    setNewOutflow((prevOutflow) => ({
      ...prevOutflow,
      materialid: selectedMaterialId, // Set materialid to the selected id
      materialname: materialName, // Set materialname to the material name
    }));
  };


  const handleMaterialNameChange = (selectedOption) => {
    const material = materials.find(m => m.name === selectedOption.label);
    setShowExtras(material.extras === 1);
    setNewOutflow(prevOutflow => ({
      ...prevOutflow,
      materialid: material ? material.matid : '',
      materialname: selectedOption.label,
    }));
  };
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'location') {
      setNewOutflow(initialOutflowState);
      setNewOutflow((prevOutflow) => ({
        ...prevOutflow,
        [name]: value,
      }));
    } else {
      setNewOutflow((prevOutflow) => ({
        ...prevOutflow,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      handleAdd(newOutflow);
      setNewOutflow(initialOutflowState);
      setShowExtras(false);
    } catch (error) {
      console.error('Error handling the form submission:', error);
    }
  };

  const handleAddProject = useCallback((newProject) => {
    fetchAPI(`${apiBaseUrl}/projectsAPI`, {
      method: 'POST',
      body: JSON.stringify(newProject),
    })
      .then(() => {
        // Fetch the updated list of projects after successfully adding a new project
        return fetchAPI(`${apiBaseUrl}/projectsAPI`);
      })
      .then(data => {
        // Update the projects state with the fetched data
        setProjects(data);
        setShowAddProjectForm(false); // Close the form if needed
      })
      .catch((error) => {
        console.error('Error in operation:', error);
      });
  }, [apiBaseUrl, fetchAPI, setProjects]);
  console.log('Outflow being submitted:', newOutflow);


  return (
    <div className='container'>
      <div>
        <h2 className="heading">Add Outflow</h2>
      </div>
      <form onSubmit={handleSubmit} className="form">
        <div className='form-row'>
          {userRole !== 'graphics' && (
            <div className='form-group'>
              <label>Location:</label>
              <Select
                name="location"
                value={newOutflow.location ? { value: newOutflow.location, label: locations.find(loc => loc.id === newOutflow.location)?.locationname } : null}
                options={locations.map((location) => ({
                  value: location.id,
                  label: location.locationname
                }))}
                onChange={(selectedOption) =>
                  handleChange({
                    target: {
                      name: 'location',
                      value: selectedOption.value,
                    },
                  })
                }
                placeholder="Select a location"
                required
              />
            </div>
          )}


          {newOutflow.location && (
            <div>
              <div className='form-group'>
                <label>Material ID:</label>
                <Select
                  classNamePrefix="select-field"
                  name="materialid"
                  value={newOutflow.materialid ? { value: newOutflow.materialid, label: newOutflow.materialid } : null}
                  options={availableMaterials
                    .filter((material, index, self) => self.findIndex(m => m.materialid === material.materialid) === index) // Filter unique materials
                    .map((material) => ({
                      value: material.materialid,
                      label: material.materialid,
                    }))}
                  onChange={handleMaterialIdChange}
                  placeholder="Select a material"
                  required

                />

              </div>
              <div className='form-group'>
                <label>Material Name:</label>
                <Select
                  classNamePrefix="select-field"
                  name="materialname"
                  value={newOutflow.materialname ? { value: newOutflow.materialname, label: newOutflow.materialname } : null}
                  options={availableMaterials
                    .filter((material, index, self) => self.findIndex(m => m.materialid === material.materialid) === index) // Filter unique materials
                    .map((material) => ({
                      value: material.materialid, // Use materialid as value
                      label: materials.find((m) => m.matid === material.materialid)?.name || '', // Use materials.name as label
                    }))
                  }
                  onChange={handleMaterialNameChange}
                  placeholder="Select a material name"
                  required
                />
              </div>
            </div>
          )}
          {showExtras && newOutflow.materialname && (
            <div className='form-group'>
              <label>Width:</label>
              <Select
                name="width"
                value={newOutflow.width ? { value: newOutflow.width, label: newOutflow.width } : null}
                options={availableWidths.map((width) => ({
                  value: width.width,
                  label: width.width,
                })).filter((width, index, self) => self.findIndex(w => w.value === width.value) === index)} // Filter unique widths
                onChange={(selectedOption) => handleChange({ target: { name: 'width', value: selectedOption.value } })}
                placeholder="Select a width"
                required // Add the required attribute
              />
            </div>
          )}

          {showExtras && newOutflow.width && (
            <div className="form-group">
              <label>Quantity:</label>
              <input
                type="text"
                name="quantity"
                value={newOutflow.quantity || ''}
                onChange={handleChange}
                required
                max={
                  remainingQuantities.find(
                    (item) =>
                      item.location === newOutflow.location &&
                      item.materialid === newOutflow.materialid

                  )?.remainingQuantity || 0 // Fallback to 0 if no match
                }
              />
            </div>

          )}
          {showExtras && newOutflow.quantity && (
            <div className='form-group'>
              <label>Lot No:</label>
              <Select
                name="lotnumber"
                value={newOutflow.lotnumber ? { value: newOutflow.lotnumber, label: newOutflow.lotnumber } : null}
                options={availableLots
                  .filter(lot => parseFloat(lot.remaining_quantity) >= parseFloat(newOutflow.quantity))
                  .sort((a, b) => parseFloat(a.remaining_quantity) - parseFloat(b.remaining_quantity))
                  .map((lot) => ({
                    value: lot.lotnumber,
                    label: `${lot.lotnumber} (Available: ${parseFloat(lot.remaining_quantity).toFixed(2)})`,
                  }))}
                onChange={(selectedOption) =>
                  handleChange({ target: { name: 'lotnumber', value: selectedOption.value } })
                }
                placeholder="Select a lot #"
                required
              />
            </div>
          )}

          {showExtras && newOutflow.quantity && (
            <div className='form-group'>
              <label>Comments:</label>
              <textarea
                name="comments"
                value={newOutflow.comments}
                onChange={handleChange}
              />
            </div>
          )}

          {!showExtras && newOutflow.materialid && (
            <div className="form-group">
              <label>Quantity:</label>
              <input
                type="number"
                name="quantity"
                value={newOutflow.quantity || ''}
                onChange={handleChange}
                required
                max={
                  remainingQuantities.find(
                    (item) =>
                      item.location === newOutflow.location &&
                      item.materialid === newOutflow.materialid &&
                      item.width === newOutflow.width &&
                      item.lotnumber === newOutflow.lotnumber
                  )?.remainingQuantity || 0 // Fallback to 0 if no match
                }
              />
              <div>
                Available Quantity:{" "}
                {(
                  remainingQuantities.find(
                    (item) =>
                      item.location === newOutflow.location &&
                      item.materialid === newOutflow.materialid &&
                      item.width === newOutflow.width &&
                      item.lotnumber === newOutflow.lotnumber
                  )?.remainingQuantity || 0
                ).toFixed(2)}
              </div>

            </div>

          )}
          {!showExtras && newOutflow.quantity && (
            <div className='form-group'>
              <label>Comments:</label>
              <textarea
                name="comments"
                value={newOutflow.comments}
                onChange={handleChange}
              />
            </div>
          )}
          {userRole !== 'graphics' && (
            ((!showExtras && newOutflow.quantity) || (showExtras && newOutflow.lotnumber)) && (
              <div className='form-group'>
                <label>Employee:</label>
                <Select
                  name="employee"
                  value={newOutflow.employee ? {
                    value: newOutflow.employee,
                    label: employees.find(emp => emp.empid === newOutflow.employee)?.name
                  } : null}
                  options={employees
                    .filter(employee => employee.active) // μόνο ενεργοί
                    .map((employee) => ({
                      value: employee.empid,
                      label: employee.name,
                    }))
                  }
                  onChange={(selectedOption) =>
                    handleChange({
                      target: {
                        name: 'employee',
                        value: selectedOption.value,
                        employeeName: selectedOption.label
                      }
                    })
                  }
                  placeholder="Select an Employee"
                  required
                />
              </div>
            )
          )}

          {newOutflow.employee && (
            <div className='form-group'>
              <label>Project:<span className="add-icon" onClick={openAddProjectForm}>
                +
              </span></label>
              <Select
                name="project"
                value={newOutflow.project ? { value: newOutflow.project, label: projects.find(project => project.prid === newOutflow.project)?.name } : null}
                options={projects
                  .filter(project => project.status.data[0] === 0) // Filter projects where status.data[0] is 1
                  .map((project) => ({
                    value: project.prid,
                    label: project.name,
                  }))}
                onChange={(selectedOption) => handleChange({ target: { name: 'project', value: selectedOption.value } })}
                placeholder="Select a Project"
                required
              />
            </div>
          )}

          {newOutflow.project && (
            <div className='form-group'>
              <label>Quoted Items:</label>
              <Select
                name="quotedItemid"
                value={availableQuotedItems.find(item => item.id === newOutflow.quotedItemid)
                  ? { value: newOutflow.quotedItemid, label: availableQuotedItems.find(item => item.id === newOutflow.quotedItemid).product_name }
                  : null}
                options={availableQuotedItems.map((item) => ({
                  value: item.id,  // Αποθηκεύει το `item.id`
                  label: item.product_name,
                  title: item.product_description, // Χρησιμοποιείται ως tooltip
                }))}
                getOptionLabel={(item) => (
                  <span title={item.title}>{item.label}</span> // Το tooltip εμφανίζεται όταν ο χρήστης περνάει το ποντίκι
                )}
                onChange={(selectedOption) => {
                  console.log('Selected Quoted Item:', selectedOption);
                  setNewOutflow(prevOutflow => ({
                    ...prevOutflow,
                    quotedItemid: selectedOption.value,  // Αποθηκεύει το `item.id`
                  }));
                }}
                placeholder="Select a Quoted Item"
              />
            </div>
          )}

          <button type="submit" className="add_btn">
            Add Outflow
          </button>
        </div>

      </form>
      {showAddProjectForm && (
        <div className="overlay">
          <div className="popup">
            <span className="close-popup" onClick={() => setShowAddProjectForm(false)}>
              &times;
            </span>
            <AddProject handleAddProject={handleAddProject} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AddOutflow;

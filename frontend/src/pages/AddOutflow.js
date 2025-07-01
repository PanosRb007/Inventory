import React, { useCallback, useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import './PurchaseFunc.css';
import AddProject from './AddProject.js';

const AddOutflow = ({
  handleAdd,
  locations,
  materials,
  employees,
  projects,
  outflows,
  purchases,
  apiBaseUrl,
  setProjects,
  userRole,
  initialValues,
  setAddOutflowInitialValues
}) => {

  const initialOutflowState = useMemo(() => ({
    location: userRole === 'graphics' ? 1 : '',
    locationname: '',
    materialid: '',
    materialname: '',
    quantity: '',
    width: '',
    lotnumber: '',
    employee: userRole === 'graphics' ? 37 : '',
    project: '',
    quotedItemid: '',
    comments: '',
  }), [userRole]);

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
  const [availableQuotedItems, setAvailableQuotedItems] = useState([]);

  const openAddProjectForm = () => {
    setShowAddProjectForm(true);
  };

  // Ενημέρωση newOutflow όταν αλλάζει το initialValues
  useEffect(() => {
    if (initialValues) {
      const material = materials.find(m => m.matid === initialValues.materialid);
      setNewOutflow({
        location: userRole === 'graphics' ? 1 : initialValues?.location || '',
        locationname: '',
        materialid: initialValues?.materialid || '',
        materialname: material?.name || '',
        quantity: initialValues?.quantity || '',
        width: '',
        lotnumber: '',
        employee: userRole === 'graphics' ? 37 : initialValues?.employee || '',
        project: initialValues?.project || '',
        quotedItemid: initialValues?.quotedItemid || '',
        comments: '',
      });
      setShowExtras(material?.extras === 1);
    } else if (userRole === 'graphics') {
      // Αν δεν υπάρχουν initialValues, αλλά είσαι graphics, βάλε employee και project default
      setNewOutflow(prev => ({
        ...prev,
        employee: 37,
      }));
    }
  }, [initialValues, userRole, materials]);

  // Ενημέρωση materialname και showExtras όταν αλλάζει το materialid
  useEffect(() => {
    if (newOutflow.materialid) {
      const material = materials.find(m => m.matid === newOutflow.materialid);
      setNewOutflow(prev => ({
        ...prev,
        materialname: material?.name || ''
      }));
      setShowExtras(material?.extras === 1);
    } else {
      setShowExtras(false);
    }
  }, [newOutflow.materialid, materials]);

  // Φόρτωση διαθέσιμων υλικών για τη location
  useEffect(() => {
    const fetchMaterials = async () => {
      if (newOutflow.location) {
        try {
          const response = await fetchAPI(`${apiBaseUrl}/remaining_quantityAPI/${newOutflow.location}`);
          const filteredMaterials = response.filter(material => material.remaining_quantity > 0);
          setAvailableMaterials(filteredMaterials);
        } catch (error) {
          console.error('Error fetching unique materials:', error);
        }
      }
    };
    fetchMaterials();
  }, [newOutflow.location, apiBaseUrl, fetchAPI]);

  // Φόρτωση διαθέσιμων widths για το υλικό
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

      // Αν υπάρχει μόνο ένα width, προσυμπλήρωσέ το
      if (filteredWidths.length === 1) {
        setNewOutflow(prev => ({
          ...prev,
          width: filteredWidths[0].width
        }));
      }
    } else {
      setAvailableWidths([]);
    }
  }, [newOutflow.materialid, availableMaterials]);

  // Φόρτωση διαθέσιμων lots
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

  // Φόρτωση quoted items για το project
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

  // Υπολογισμός remaining quantities
  const calculateRemainingQuantities = (purchases, outflows) => {
    const materialMap = new Map();
    const generateKey = (item) =>
      item.width !== null
        ? `${item.location}-${item.materialid}-${item.width}-${item.lotnumber}`
        : `${item.location}-${item.materialid}`;
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
          purchasesCount: 0,
          outflowsCount: 0,
        });
      }
      const material = materialMap.get(key);
      material.totalPurchases += parseFloat(purchase.quantity || 0);
      material.purchasesCount += 1;
      materialMap.set(key, material);
    });
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
          purchasesCount: 0,
          outflowsCount: 0,
        });
      }
      const material = materialMap.get(key);
      material.totalOutflows += parseFloat(outflow.quantity || 0);
      material.outflowsCount += 1;
      materialMap.set(key, material);
    });
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

  // Handlers
  const handleMaterialIdChange = (selectedOption) => {
    const selectedMaterialId = selectedOption.value;
    const material = materials.find((m) => m.matid === selectedMaterialId);
    setShowExtras(material?.extras === 1);
    setNewOutflow((prevOutflow) => ({
      ...prevOutflow,
      materialid: selectedMaterialId,
      materialname: material ? material.name : '',
    }));
  };

  const handleMaterialNameChange = (selectedOption) => {
    const material = materials.find(m => m.name === selectedOption.label);
    setShowExtras(material?.extras === 1);
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
      setAddOutflowInitialValues(null);
      setNewOutflow(initialOutflowState); // Αυτό θα το αδειάσει πραγματικά
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
      .then(() => fetchAPI(`${apiBaseUrl}/projectsAPI`))
      .then(data => {
        setProjects(data);
        setShowAddProjectForm(false);
      })
      .catch((error) => {
        console.error('Error in operation:', error);
      });
  }, [apiBaseUrl, fetchAPI, setProjects]);

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
                    .filter((material, index, self) => self.findIndex(m => m.materialid === material.materialid) === index)
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
                    .filter((material, index, self) => self.findIndex(m => m.materialid === material.materialid) === index)
                    .map((material) => ({
                      value: material.materialid,
                      label: materials.find((m) => m.matid === material.materialid)?.name || '',
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
                })).filter((width, index, self) => self.findIndex(w => w.value === width.value) === index)}
                onChange={(selectedOption) => handleChange({ target: { name: 'width', value: selectedOption.value } })}
                placeholder="Select a width"
                required
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
                  )?.remainingQuantity || 0
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
                step="0.01"
                max={
                  remainingQuantities.find(
                    (item) =>
                      item.location === newOutflow.location &&
                      item.materialid === newOutflow.materialid &&
                      item.width === newOutflow.width &&
                      item.lotnumber === newOutflow.lotnumber
                  )?.remainingQuantity || 0
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
                    .filter(employee => employee.active)
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
                  .filter(project => project.status.data[0] === 0)
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
                  value: item.id,
                  label: item.product_name,
                  title: item.product_description,
                }))}
                getOptionLabel={(item) => (
                  <span title={item.title}>{item.label}</span>
                )}
                onChange={(selectedOption) => {
                  setNewOutflow(prevOutflow => ({
                    ...prevOutflow,
                    quotedItemid: selectedOption.value,
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

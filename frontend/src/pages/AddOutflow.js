import React, { useCallback, useState, useEffect } from 'react';
import Select from 'react-select';
import './PurchaseFunc.css';
import AddProject from './AddProject.js';

const AddOutflow = ({ handleAdd, locations, materials, employees, projects, outflows, purchases, apiBaseUrl, setProjects, instOutflow }) => {



  const initialOutflowState = {
    location: '',
    locationname: '',
    materialid: '',
    materialname: '',
    quantity: '',
    width: null,
    lotnumber: '',
    cost: '',
    employee: '',
    project: '',
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
  const [availableQuantity, setAvailableQuantity] = useState(0);
  const [showAddProjectForm, setShowAddProjectForm] = useState(false);

  const openAddProjectForm = () => {
    setShowAddProjectForm(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (newOutflow.location) {
        try {

          const filteredMaterials = purchases.filter((mat) =>
            mat.location === newOutflow.location
          );
          const filteredOutflows = outflows.filter((out) =>
            out.location === newOutflow.location
          );

          const filteredNonZero = filteredMaterials.filter((mat) => {
            const sumOfOutflows = filteredOutflows
              .filter((outflow) => outflow.materialid === mat.materialid)
              .reduce((total, outflow) => total + parseFloat(outflow.quantity), 0);
            console.log('sumOfOutflows', sumOfOutflows);
            const sumOfPurchases = filteredMaterials
              .filter((purchase) => purchase.materialid === mat.materialid)
              .reduce((total, purchase) => total + parseFloat(purchase.quantity), 0);
            console.log('sumOfPurchases', sumOfPurchases);

            return sumOfPurchases - sumOfOutflows > 0;
          });

          setAvailableMaterials(filteredNonZero);
          console.log(filteredNonZero);
        } catch (error) {
          console.error('Error fetching material data:', error);
        }
      }

      if (newOutflow.materialid) {
        try {

          const filteredMats = purchases.filter((mat) =>
            mat.location === newOutflow.location &&
            mat.materialid === newOutflow.materialid
          );
          const filteredWidthNonZero = filteredMats.filter((mat) => {
            const sumOfOutflows = outflows
              .filter((outflow) => outflow.lotnumber === mat.lotnumber)
              .reduce((total, outflow) => total + parseInt(outflow.quantity), 0);
            return mat.quantity - sumOfOutflows > 0;
          });
          setAvailableWidths(filteredWidthNonZero);

          const remainingQuantity = () =>
            purchases
              .filter((mat) =>
                mat.location === newOutflow.location &&
                mat.materialid === newOutflow.materialid &&
                mat.width === null
              )
              .reduce((total, purchase) => total + parseFloat(purchase.quantity), 0) -
            outflows
              .filter((out) =>
                out.location === newOutflow.location &&
                out.materialid === newOutflow.materialid &&
                out.width === null
              )
              .reduce((total, outflow) => total + parseFloat(outflow.quantity), 0);

          const availquantity = remainingQuantity();
          setAvailableQuantity(availquantity);

        } catch (error) {
          console.error('Error fetching material data:', error);
        }

        if (newOutflow.location && newOutflow.materialid && newOutflow.quantity && !showExtras) {
          try {
            const filteredPurchases = purchases.filter(pur =>
              pur.location === newOutflow.location &&
              pur.materialid === newOutflow.materialid
            );
            console.log("Filtered Purchases:", filteredPurchases);

            const filteredOutflows = outflows.filter(out =>
              out.location === newOutflow.location &&
              out.materialid === newOutflow.materialid
            );
            console.log("Filtered Outflows:", filteredOutflows);

            // Calculate sum of previous outflows
            const totalPreviousOutflows = filteredOutflows.reduce((sum, out) => sum + parseFloat(out.quantity), 0);
            console.log("Sum of previous outflows:", totalPreviousOutflows);

            let sumOfQuantities = 0;
            let totalCost = 0;
            let remainingOutflowQuantity = newOutflow.quantity;
            let remQuant = 0;

            for (const purchase of filteredPurchases) {
              const purchaseQuantity = parseFloat(purchase.quantity);
              const purchasePrice = parseFloat(purchase.price);
              console.log("purchase:", purchase);
              console.log("purchaseQuantity:", purchaseQuantity);
              console.log("purchasePrice:", purchasePrice);
              sumOfQuantities += purchaseQuantity;
              remQuant = sumOfQuantities - totalPreviousOutflows;
              console.log("remQuantfinal:", remQuant);

              if (sumOfQuantities >= totalPreviousOutflows) {
                if (remainingOutflowQuantity <= remQuant) {
                  console.log("outflow quantity inside k:", remainingOutflowQuantity);
                  console.log("remQuant quantity inside k:", remQuant);
                  totalCost += remainingOutflowQuantity * purchasePrice;
                  console.log("totalcost:", totalCost);
                  break;
                } else {
                  console.log("outflow quantity inside k:", remainingOutflowQuantity);
                  console.log("remQuant quantity inside k:", remQuant);
                  totalCost += remQuant * purchasePrice;
                  console.log("totalcost:", totalCost);
                  remainingOutflowQuantity -= remQuant;
                }
                continue;
              }

            }
            setNewOutflow((prevPurchase) => ({
              ...prevPurchase,
              cost: totalCost,
            }));

            console.log("totalcostfinal:", totalCost);

          } catch (error) {
            console.error('Error calculating cost:', error);
          }
        } else if (newOutflow.lotnumber) {
          setNewOutflow((prevPurchase) => ({
            ...prevPurchase,
            cost: purchases.find((pur) => pur.materialid === newOutflow.materialid && pur.lotnumber === newOutflow.lotnumber).price * newOutflow.width * newOutflow.quantity

          }));

        }

      } else {
        setNewOutflow((prevPurchase) => ({
          ...prevPurchase,
          width: null,
        }));
      };

      if (newOutflow.width) {
        try {
          const filteredLots = purchases.filter((lot) =>
            lot.location === newOutflow.location &&
            lot.materialid === newOutflow.materialid &&
            lot.width === newOutflow.width
          );

          const filteredLotsWithQuantityCondition = filteredLots.filter((lot) => {
            const sumOfOutflows = outflows
              .filter((outflow) => outflow.lotnumber === lot.lotnumber)
              .reduce((total, outflow) => total + parseFloat(outflow.quantity), 0);
            return lot.quantity - sumOfOutflows >= parseFloat(newOutflow.quantity);
          });

          setAvailableLots(filteredLotsWithQuantityCondition);
        } catch (error) {
          console.error('Error fetching material data:', error);
        }
      } else {
        setNewOutflow((prevPurchase) => ({
          ...prevPurchase,
          lotnumber: '',
        }));
      }
    };

    fetchData();
  }, [newOutflow.location, newOutflow.materialid, newOutflow.width, newOutflow.quantity, outflows, purchases, showExtras, newOutflow.lotnumber]);

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





  return (
    <div className='container'>
      <form onSubmit={handleSubmit} className="form">
        <div className='form-row'>
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
            <div className='form-group'>
              <label>Quantity:</label>
              <input type="text" name="quantity" value={newOutflow.quantity || ''} onChange={handleChange} required />
            </div>
          )}
          {showExtras && newOutflow.quantity && (
            <div className='form-group'>
              <label>Lot No:</label>
              <Select
                name="lotnumber"
                value={newOutflow.lotnumber ? { value: newOutflow.lotnumber, label: newOutflow.lotnumber } : null}
                options={availableLots.map((lot) => ({
                  value: lot.lotnumber,
                  label: `${lot.lotnumber} (Available: ${lot.quantity - outflows
                    .filter((outflow) => outflow.lotnumber === lot.lotnumber)
                    .reduce((total, outflow) => total + parseFloat(outflow.quantity), 0)})`,
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
            <div className='form-group'>
              <label>Quantity:</label>
              <input
                type="number"
                name="quantity"
                value={newOutflow.quantity || ''}
                onChange={handleChange}
                required
                max={availableQuantity}
              />
              <div>
                Available Quantity: {availableQuantity}
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
          {!showExtras && newOutflow.quantity && (
            <div className='form-group'>
              <label>Employee:</label>
              <Select
                name="employee"
                value={newOutflow.employee ? { value: newOutflow.employee, label: employees.find(emp => emp.empid === newOutflow.employee)?.name } : null}
                options={employees.map((employee) => ({
                  value: employee.empid,
                  label: employee.name,
                }))}
                onChange={(selectedOption) =>
                  handleChange({ target: { name: 'employee', value: selectedOption.value, employeeName: selectedOption.label } })
                }
                placeholder="Select an Employee"
                required
              />
            </div>
          )}
          {showExtras && newOutflow.lotnumber && (
            <div className='form-group'>
              <label>Employee:</label>
              <Select
                name="employee"
                value={newOutflow.employee ? { value: newOutflow.employee, label: employees.find(emp => emp.empid === newOutflow.employee)?.name } : null}
                options={employees.map((employee) => ({
                  value: employee.empid,
                  label: employee.name,
                }))}
                onChange={(selectedOption) =>
                  handleChange({ target: { name: 'employee', value: selectedOption.value, employeeName: selectedOption.label } })
                }
                placeholder="Select an Employee"
                required
              />
            </div>
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

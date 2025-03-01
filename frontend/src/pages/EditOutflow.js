import React, { useMemo, useState, useEffect } from 'react';
import Select from 'react-select';
import './PurchaseFunc.css';

const EditOutflow = ({ outflow, handleUpdate, handleCancel, outflows, purchases, locations, materials, employees, projects }) => {

  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [availableWidths, setAvailableWidths] = useState([]);
  const [availableLots, setAvailableLots] = useState([]);
  const [availableSubProjects, setAvailableSubProjects] = useState([]);

  const [editedOutflow, setEditedOutflow] = useState({
    ...outflow,
    materialname: materials.find(mat => mat.matid === outflow.materialid)?.name,
    quantity: parseFloat(outflow.quantity) || 0 // Μετατροπή σε αριθμό
  });
  const [showExtras, setShowExtras] = useState(
    (outflow.width > 0)
  );


  useEffect(() => {

    const fetchData = async () => {

      if (editedOutflow.location) {
        try {

          const filteredMaterials = purchases.filter((mat) =>
            mat.location === editedOutflow.location
          );
          const filteredOutflows = outflows.filter((out) =>
            out.location === editedOutflow.location
          );

          const filteredNonZero = filteredMaterials.filter((mat) => {
            const sumOfOutflows = filteredOutflows
              .filter((outflow) => outflow.materialid === mat.materialid)
              .reduce((total, outflow) => total + parseFloat(outflow.quantity), 0);

            const sumOfPurchases = filteredMaterials
              .filter((purchase) => purchase.materialid === mat.materialid)
              .reduce((total, purchase) => total + parseFloat(purchase.quantity), 0);


            return sumOfPurchases - sumOfOutflows > 0;
          });

          setAvailableMaterials(filteredNonZero);
        } catch (error) {
          console.error('Error fetching material data:', error);
        }
      }

      if (editedOutflow.materialid) {
        try {

          const filteredMats = purchases.filter((mat) =>
            mat.location === editedOutflow.location &&
            mat.materialid === editedOutflow.materialid
          );
          const filteredWidthNonZero = filteredMats.filter((mat) => {
            const sumOfOutflows = outflows
              .filter((outflow) => outflow.lotnumber === mat.lotnumber)
              .reduce((total, outflow) => total + parseInt(outflow.quantity), 0);
            return mat.quantity - sumOfOutflows > 0;
          });
          setAvailableWidths(filteredWidthNonZero);


        } catch (error) {
          console.error('Error fetching material data:', error);
        }
      } else {
        setEditedOutflow((prevOutflow) => ({
          ...prevOutflow,
          width: '',
        }));
      };

      if (editedOutflow.width) {
        try {
          const filteredLots = purchases.filter((lot) =>
            lot.location === editedOutflow.location &&
            lot.materialid === editedOutflow.materialid &&
            lot.width === editedOutflow.width
          );

          const filteredLotsWithQuantityCondition = filteredLots.filter((lot) => {
            const sumOfOutflows = outflows
              .filter((outflow) => outflow.lotnumber === lot.lotnumber)
              .reduce((total, outflow) => total + parseFloat(outflow.quantity), 0);
            return lot.quantity - sumOfOutflows >= parseFloat(editedOutflow.quantity);
          });

          setAvailableLots(filteredLotsWithQuantityCondition);
        } catch (error) {
          console.error('Error fetching material data:', error);
        }
      } else {
        setEditedOutflow((prevOutflow) => ({
          ...prevOutflow,
          lotnumber: '',
        }));
      }
    };

    fetchData();
  }, [editedOutflow.location, editedOutflow.materialid, editedOutflow.width, editedOutflow.quantity, outflows, purchases, showExtras, editedOutflow.lotnumber]);

  useEffect(() => {
    if (editedOutflow.project) {
      const selectedProject = projects.find(project => project.prid === editedOutflow.project);
      if (selectedProject && selectedProject.quotedItems) {
        console.log('Setting availableSubProjects:', selectedProject.quotedItems);
        setAvailableSubProjects(selectedProject.quotedItems); // Ensure it sets the correct array
      } else {
        setAvailableSubProjects([]);
      }
    } else {
      setAvailableSubProjects([]);
    }
  }, [editedOutflow.project, projects]);

  console.log(availableSubProjects);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'location') {
      setEditedOutflow((prevOutflow) => ({
        ...prevOutflow,
        [name]: value,
        materialid: '',
        materialname: '',
        quantity: 0, // Αρχικοποιείται ως αριθμός
        width: null,
        lotnumber: '',
        subProject: '',
      }));
    } else if (name === 'materialid') {
      const selectedMaterial = materials.find(material => material.matid === value);

      if (selectedMaterial) {
        setEditedOutflow((prevOutflow) => ({
          ...prevOutflow,
          [name]: value,
          materialname: selectedMaterial.name,
          quantity: 0, // Αρχικοποιείται ως αριθμός
          width: null,
          lotnumber: "",
        }));

        setShowExtras(selectedMaterial.extras === 1);

        if (selectedMaterial.extras !== 1) {
          setEditedOutflow((prevOutflow) => ({
            ...prevOutflow,
            lotnumber: '',
            width: null,
          }));
        }
      }
    } else {
      setEditedOutflow((prevOutflow) => ({
        ...prevOutflow,
        [name]: name === 'quantity' ? parseFloat(value) || 0 : value, // Μετατροπή του quantity σε αριθμό
      }));
    }
  };


  const calculateAvailableQuantity = () => {
    let result = 0; // Default result to 0

    if (showExtras) {
      // Calculate total purchased quantity for a specific material and lot number
      const totalPurchasedQuantity = purchases
        .filter(p => p.lotnumber === editedOutflow.lotnumber && p.materialid === editedOutflow.materialid)
        .reduce((sum, purchase) => sum + parseFloat(purchase.quantity || 0), 0);

      // Calculate total outflow quantity for a specific material and lot number
      const totalOutflowQuantity = outflows
        .filter(out => out.materialid === editedOutflow.materialid && out.lotnumber === editedOutflow.lotnumber)
        .reduce((sum, out) => sum + parseFloat(out.quantity || 0), 0);

      // Calculate the available quantity
      result = totalPurchasedQuantity - totalOutflowQuantity;
    } else {
      const totalPurchasedQuantity = purchases
        .filter(p => p.materialid === editedOutflow.materialid && p.location === editedOutflow.location)
        .reduce((sum, purchase) => sum + parseFloat(purchase.quantity || 0), 0);

      // Calculate total outflow quantity for a specific material and lot number
      const totalOutflowQuantity = outflows
        .filter(out => out.materialid === editedOutflow.materialid && out.location === editedOutflow.location)
        .reduce((sum, out) => sum + parseFloat(out.quantity || 0), 0);

      // Calculate the available quantity
      result = totalPurchasedQuantity - totalOutflowQuantity;
    }
    return result; // Return the calculated result
  };

  const materialAvailableQuantity = useMemo(calculateAvailableQuantity, [editedOutflow, purchases, outflows, showExtras]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { location, materialid, quantity, employee, project } = editedOutflow;

    // Έλεγχος για υποχρεωτικά πεδία
    if (!location || !materialid || !quantity || !employee || !project) {
      alert('Please fill in all required fields.');
      return;
    }

    const updatedOutflow = {
      ...editedOutflow,
      width: editedOutflow.width || null, // Αντικατάσταση κενής τιμής με null
      lotnumber: editedOutflow.lotnumber || null,
      comments: editedOutflow.comments || null,
    };

    console.log('Submitting Edited Outflow:', updatedOutflow);

    try {
      handleUpdate(updatedOutflow);
      setEditedOutflow('');
      setShowExtras(false);
    } catch (error) {
      console.error('Error handling the form submission:', error);
    }
  };

  return (
    <div className='container'>
      <h2 className="heading">Edit Outflow</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className='form-row'>
          <div className='form-group'>
            <label>Location:</label>
            <Select
              name="location"
              value={editedOutflow.location ? { value: editedOutflow.location, label: locations.find(loc => loc.id === editedOutflow.location)?.locationname } : null}
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

          {editedOutflow.location && (
            <div>
              <div className='form-group'>
                <label>Material ID:</label>
                <Select
                  name="materialid"
                  value={editedOutflow.materialid ? { value: editedOutflow.materialid, label: editedOutflow.materialid } : null}
                  options={availableMaterials
                    .filter((material, index, self) => self.findIndex(m => m.materialid === material.materialid) === index) // Filter unique materials
                    .map((material) => ({
                      value: material.materialid,
                      label: material.materialid,
                    }))}
                  onChange={(selectedOption) => handleChange({ target: { name: 'materialid', value: selectedOption.value } })}
                  placeholder="Select a material"
                  required // Add the required attribute
                />

              </div>
              <div className='form-group'>
                <label>Material Name:</label>
                <input type="text" name="materialname" value={materials.find(mat => mat.matid === editedOutflow.materialid)?.name} readOnly required />
              </div>
            </div>
          )}
          {showExtras && editedOutflow.materialname && (
            <div className='form-group'>
              <label>Width:</label>
              <Select
                name="width"
                value={editedOutflow.width ? { value: editedOutflow.width, label: editedOutflow.width } : null}
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

          {showExtras && editedOutflow.width && (
            <div className='form-group'>
              <label>Quantity:</label>
              <input
                type="number"
                name="quantity"
                value={editedOutflow.quantity || ''}
                onChange={handleChange}
                step="0.01"
                required
                max={materialAvailableQuantity + outflow.quantity}
              />

              <div>
                Available Quantity: {parseFloat(materialAvailableQuantity) + parseFloat(outflow.quantity)}
              </div>
            </div>
          )}
          {showExtras && parseFloat(editedOutflow.quantity) && (
            <div className='form-group'>
              <label>Lot No:</label>
              <Select
                name="lotnumber"
                value={editedOutflow.lotnumber ? { value: editedOutflow.lotnumber, label: editedOutflow.lotnumber } : null}
                options={availableLots.map((lot) => ({
                  value: lot.lotnumber,
                  label: `${lot.lotnumber} (Available: ${parseFloat(lot.quantity) - outflows
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

          {!showExtras && editedOutflow.materialid && (
            <div className='form-group'>
              <label>Quantity:</label>
              <input
                type="number"
                name="quantity"
                value={parseFloat(editedOutflow.quantity) || ''}
                onChange={handleChange}
                required
                step="0.01"
                max={parseFloat(materialAvailableQuantity) + parseFloat(outflow.quantity)}
              />
              <div>
                Available Quantity: {parseFloat(materialAvailableQuantity) + parseFloat(outflow.quantity)}
              </div>
            </div>
          )}
          {!showExtras && parseFloat(editedOutflow.quantity) && (
            <div className='form-group'>
              <label>Employee:</label>
              <Select
                name="employee"
                value={editedOutflow.employee ? { value: editedOutflow.employee, label: employees.find(emp => emp.empid === editedOutflow.employee)?.name } : null}
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
          {showExtras && editedOutflow.lotnumber && (
            <div className='form-group'>
              <label>Employee:</label>
              <Select
                name="employee"
                value={editedOutflow.employee ? { value: editedOutflow.employee, label: employees.find(emp => emp.empid === editedOutflow.employee)?.name } : null}
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
          {editedOutflow.employee && (
            <div className='form-group'>
              <label>Project:</label>
              <Select
                name="project"
                value={editedOutflow.project ? { value: editedOutflow.project, label: projects.find(project => project.prid === editedOutflow.project)?.name } : null}
                options={projects.map((project) => ({
                  value: project.prid,
                  label: project.name,
                }))}
                onChange={(selectedOption) => handleChange({ target: { name: 'project', value: selectedOption.value } })}
                placeholder="Select a Project"
                required
              />
            </div>
          )}
          {editedOutflow.project && (
            <div className='form-group'>
              <label>Sub-Project:</label>
              <Select
                name="quotedItemid"
                value={
                  availableSubProjects.find(item => item.id === editedOutflow.quotedItemid)
                    ? { value: editedOutflow.quotedItemid, label: availableSubProjects.find(item => item.id === editedOutflow.quotedItemid).product_name }
                    : null
                }
                options={availableSubProjects.map((item) => ({
                  value: item.id,
                  label: item.product_name,
                }))}
                onChange={(selectedOption) =>
                  handleChange({ target: { name: 'quotedItemid', value: selectedOption.value } })
                }
                placeholder="Select a Sub-Project"
                
              />

            </div>
          )}
          <div className='form-group'>
            <label>
              Comments:
              <textarea type="text" name="comments" value={editedOutflow.comments} onChange={handleChange} />
            </label>
          </div>
          <button type="submit" className="add_btn">
            Edit
          </button>
          <button type="button" className="add_btn" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};


export default EditOutflow;

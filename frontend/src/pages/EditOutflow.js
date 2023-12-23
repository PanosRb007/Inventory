import React, { useMemo, useState, useEffect } from 'react';
import Select from 'react-select';
import './PurchaseFunc.css';

const EditOutflow = ({ outflow, handleUpdate, handleCancel, outflows, purchases, locations, materials, employees, projects }) => {
  console.log('materiallls', materials);

  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [availableWidths, setAvailableWidths] = useState([]);
  const [availableLots, setAvailableLots] = useState([]);
  const [availableQuantity, setAvailableQuantity] = useState(0);

  const [editedOutflow, setEditedOutflow] = useState({
    ...outflow,
    materialname: materials.find(mat => mat.matid === outflow.materialid)?.name
  });
  const [showExtras, setShowExtras] = useState(
    (outflow.width)
  );
  console.log('OUTFLOWMAT', outflow);
  console.log('xtras', showExtras);



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
            console.log('sumOfOutflows', sumOfOutflows);
            const sumOfPurchases = filteredMaterials
              .filter((purchase) => purchase.materialid === mat.materialid)
              .reduce((total, purchase) => total + parseFloat(purchase.quantity), 0);
            console.log('sumOfPurchases', sumOfPurchases);

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

          const remainingQuantity = () =>
            purchases
              .filter((mat) =>
                mat.location === editedOutflow.location &&
                mat.materialid === editedOutflow.materialid &&
                mat.width === null
              )
              .reduce((total, purchase) => total + parseFloat(purchase.quantity), 0) -
            outflows
              .filter((out) =>
                out.location === editedOutflow.location &&
                out.materialid === editedOutflow.materialid &&
                out.width === null
              )
              .reduce((total, outflow) => total + parseFloat(outflow.quantity), 0);

          const availquantity = remainingQuantity();
          setAvailableQuantity(availquantity);

        } catch (error) {
          console.error('Error fetching material data:', error);
        }

        if (editedOutflow.location && editedOutflow.materialid && editedOutflow.quantity && !showExtras) {
          try {
            const filteredPurchases = purchases.filter(pur =>
              pur.location === editedOutflow.location &&
              pur.materialid === editedOutflow.materialid
            );
            console.log("Filtered Purchases:", filteredPurchases);

            const filteredOutflows = outflows.filter(out =>
              out.location === editedOutflow.location &&
              out.materialid === editedOutflow.materialid
            );
            console.log("Filtered Outflows:", filteredOutflows);

            // Calculate sum of previous outflows
            const totalPreviousOutflows = filteredOutflows.reduce((sum, out) => sum + parseFloat(out.quantity), 0);
            console.log("Sum of previous outflows:", totalPreviousOutflows);

            let sumOfQuantities = 0;
            let totalCost = 0;
            let remainingOutflowQuantity = editedOutflow.quantity;
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
            setEditedOutflow((prevOutflow) => ({
              ...prevOutflow,
              cost: totalCost,
            }));

            console.log("totalcostfinal:", totalCost);

          } catch (error) {
            console.error('Error calculating cost:', error);
          }
        } else if (editedOutflow.lotnumber) {
          setEditedOutflow((prevOutflow) => ({
            ...prevOutflow,
            cost: purchases.find((pur) => pur.materialid === editedOutflow.materialid && pur.lotnumber === editedOutflow.lotnumber).price * editedOutflow.width * editedOutflow.quantity

          }));

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



  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'location') {
      setEditedOutflow((prevOutflow) => ({
        ...prevOutflow,
        [name]: value,
        materialid: '',
        materialname: '',
        quantity: '',
        width: null,
        lotnumber: '',
        cost: '',
      }));
    } else if (name === 'materialid') {
      const selectedMaterial = materials.find(material => material.matid === value);

      if (selectedMaterial) {
        setEditedOutflow((prevOutflow) => ({
          ...prevOutflow,
          [name]: value,
          materialname: selectedMaterial.name,
          quantity: '',
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
        [name]: value,
      }));
    }
  };

  const calculateAvailableQuantity = () => {
    let result = 0; // Default result to 0

    if (showExtras) {
        // Calculate total purchased quantity for a specific material and lot number
        const totalPurchasedQuantity = purchases
            .filter(p => p.lotnumber ===editedOutflow.lotnumber && p.materialid ===editedOutflow.materialid)
            .reduce((sum, purchase) => sum + parseFloat(purchase.quantity || 0), 0);

        // Calculate total outflow quantity for a specific material and lot number
        const totalOutflowQuantity = outflows
            .filter(out => out.materialid ===editedOutflow.materialid && out.lotnumber ===editedOutflow.lotnumber)
            .reduce((sum, out) => sum + parseFloat(out.quantity || 0), 0);

        // Calculate the available quantity
        result = totalPurchasedQuantity - totalOutflowQuantity;
    } else {
        const totalPurchasedQuantity = purchases
            .filter(p => p.materialid ===editedOutflow.materialid)
            .reduce((sum, purchase) => sum + parseFloat(purchase.quantity || 0), 0);

        // Calculate total outflow quantity for a specific material and lot number
        const totalOutflowQuantity = outflows
            .filter(out => out.materialid ===editedOutflow.materialid)
            .reduce((sum, out) => sum + parseFloat(out.quantity || 0), 0);

        // Calculate the available quantity
        result = totalPurchasedQuantity - totalOutflowQuantity;


    }

    return result; // Return the calculated result
};
const materialAvailableQuantity = useMemo(calculateAvailableQuantity, [editedOutflow, purchases, outflows, showExtras]);

  console.log('availmat', availableMaterials);
  console.log('extras', showExtras);
  console.log('availwidth', availableWidths);
  console.log('new', editedOutflow);
  console.log('availlot', availableLots);
  console.log('availquant', availableQuantity);
  console.log('availlot', availableLots);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      handleUpdate(editedOutflow);
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
              <input type="number" name="quantity" value={editedOutflow.quantity || ''} onChange={handleChange} required 
              max={parseFloat(materialAvailableQuantity)+parseFloat(outflow.quantity)}
              />
              <div>
                Available Quantity: {parseFloat(materialAvailableQuantity)+parseFloat(outflow.quantity)}
              </div>
            </div>
          )}
          {showExtras && editedOutflow.quantity && (
            <div className='form-group'>
              <label>Lot No:</label>
              <Select
                name="lotnumber"
                value={editedOutflow.lotnumber ? { value: editedOutflow.lotnumber, label: editedOutflow.lotnumber } : null}
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

          {!showExtras && editedOutflow.materialid && (
            <div className='form-group'>
              <label>Quantity:</label>
              <input
                type="number"
                name="quantity"
                value={editedOutflow.quantity || ''}
                onChange={handleChange}
                required
                max={parseFloat(materialAvailableQuantity)+parseFloat(outflow.quantity)}
              />
              <div>
                Available Quantity: {parseFloat(materialAvailableQuantity)+parseFloat(outflow.quantity)}
              </div>
            </div>
          )}
          {!showExtras && editedOutflow.quantity && (
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

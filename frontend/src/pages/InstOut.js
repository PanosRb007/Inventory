import React, { useCallback, useState, useEffect, useMemo } from 'react';
import './PurchaseFunc.css';
import Select from 'react-select';
import AddProject from './AddProject.js';

const AddOutflow = ({ handleAddInstOutflow, locations, materials, employees, projects, outflows, purchases, apiBaseUrl, setProjects, instOutflow }) => {
    const initialOutflowState = useMemo(() => ({
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
    }), []);

    const [newOutflow, setNewOutflow] = useState(instOutflow || initialOutflowState);
    const [showExtras, setShowExtras] = useState(false);
    const [showAddProjectForm, setShowAddProjectForm] = useState(false);

    useEffect(() => {
        if (instOutflow) {
            const hasExtras = materials.find((m) => m.matid === newOutflow.materialid)?.extras === 1;
            setShowExtras(hasExtras);
            const purchase = purchases.find((pur) => pur.materialid === newOutflow.materialid && pur.lotnumber === newOutflow.lotnumber);
            if (purchase && showExtras) {
                setNewOutflow(prev => ({
                    ...prev,
                    cost: purchase.price * newOutflow.width * newOutflow.quantity
                }));
            }else {
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
            }
        } else {
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
        }
    }, [instOutflow, materials, purchases, newOutflow.materialid, newOutflow.lotnumber, newOutflow.quantity, newOutflow.width,outflows,newOutflow.location,showExtras]);


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

    const openAddProjectForm = () => {
        setShowAddProjectForm(true);
    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewOutflow((prevOutflow) => ({
            ...prevOutflow,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            handleAddInstOutflow(newOutflow);
            setNewOutflow(initialOutflowState);
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
                        <input type="text" name="location" value={locations.find(l => l.id === parseInt(newOutflow.location))?.locationname || ''} readOnly required />
                    </div>
                    <div>
                        <div className='form-group'>
                            <label>Material ID:</label>
                            <input type="text" name="materialid" value={newOutflow.materialid} readOnly required />

                        </div>
                        <div className='form-group'>
                            <label>Material Name:</label>
                            <input type="text" name="materialname" value={materials.find(m => m.matid === newOutflow.materialid)?.name ||''} readOnly required />
                        </div>
                    </div>

                    {showExtras && (
                        <div className='form-group'>
                            <label>Width:</label>
                            <input type="number" name="width" value={parseFloat(newOutflow.width) || ''} readOnly required />
                        </div>

                    )}
                    {showExtras && (
                        <div className='form-group'>
                            <label>Lot:</label>
                            <input type="text" name="lotnumber" value={newOutflow.lotnumber || ''} onChange={handleChange} required />
                        </div>
                    )}


                    <div className='form-group'>
                        <label>Quantity:</label>
                        <input type="number" name="quantity" value={parseFloat(newOutflow.quantity) || ''} onChange={handleChange} required />
                        <div>

                        </div>
                    </div>

                    <div className='form-group'>
                        <label>Comments:</label>
                        <textarea
                            name="comments"
                            value={newOutflow.comments}
                            onChange={handleChange}
                        />
                    </div>

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


                    <div className='form-group'>
                        <label>Project:<span className="add-icon" onClick={openAddProjectForm}>
                            +
                        </span></label>
                        <Select
                            name="project"
                            value={newOutflow.project ? { value: newOutflow.project, label: projects.find(project => project.prid === newOutflow.project)?.name } : null}
                            options={projects.map((project) => ({
                                value: project.prid,
                                label: project.name,
                            }))}
                            onChange={(selectedOption) => handleChange({ target: { name: 'project', value: selectedOption.value } })}
                            placeholder="Select a Project"
                            required
                        />
                    </div>

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

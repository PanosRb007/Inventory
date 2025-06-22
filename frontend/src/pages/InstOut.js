import React, { useCallback, useState, useEffect, useMemo } from 'react';
import './PurchaseFunc.css';
import Select from 'react-select';
import AddProject from './AddProject.js';

const AddOutflow = ({ handleAddInstOutflow, locations, materials, employees, projects, outflows, purchases, apiBaseUrl, setProjects, instOutflow, remainingQuantities }) => {
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
        quotedItemid: '',
        comments: '',
    }), []);

    const [newOutflow, setNewOutflow] = useState(instOutflow || initialOutflowState);
    const [showExtras, setShowExtras] = useState(false);
    const [showAddProjectForm, setShowAddProjectForm] = useState(false);
    const [availableQuotedItems, setAvailableQuotedItems] = useState([]);


    useEffect(() => {
        if (instOutflow) {
            const hasExtras = materials.find((m) => m.matid === newOutflow.materialid)?.extras === 1;
            setShowExtras(hasExtras);

            if (showExtras) {
                setNewOutflow(prev => ({
                    ...prev,
                    cost: newOutflow.price * newOutflow.width * newOutflow.quantity
                }));

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
                let sumOfQuantities = 0;
                let totalCost = 0;
                let remainingOutflowQuantity = newOutflow.quantity;
                let remQuant = 0;

                for (const purchase of filteredPurchases) {
                    const purchaseQuantity = parseFloat(purchase.quantity);
                    const purchasePrice = parseFloat(purchase.price);
                    sumOfQuantities += purchaseQuantity;
                    remQuant = sumOfQuantities - totalPreviousOutflows;

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
        }
    }, [instOutflow, newOutflow.price, materials, purchases, newOutflow.materialid, newOutflow.lotnumber, newOutflow.quantity, newOutflow.width, outflows, newOutflow.location, showExtras]);

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



    const calculateAvailableQuantity = () => {
        if (!newOutflow.materialid || !newOutflow.location) return 0;

        // Βρες το σωστό entry από το array
        const entry = remainingQuantities.find((item) =>
            item.materialid === newOutflow.materialid &&
            item.location === newOutflow.location &&
            (
                !showExtras ||
                (
                    (item.lotnumber === newOutflow.lotnumber ||
                        (!item.lotnumber && (!newOutflow.lotnumber || newOutflow.lotnumber === "EMPTY")) ||
                        (item.lotnumber === "EMPTY" && (!newOutflow.lotnumber || newOutflow.lotnumber === "EMPTY")))
                    &&
                    (parseFloat(item.width) === parseFloat(newOutflow.width) ||
                        (item.width === null && (!newOutflow.width || parseFloat(newOutflow.width) === -1)) ||
                        (parseFloat(item.width) === -1 && (!newOutflow.width || parseFloat(newOutflow.width) === -1)))
                )
            )
        );

        return entry && !isNaN(parseFloat(entry.remaining_quantity))
            ? parseFloat(entry.remaining_quantity)
            : 0;
    };
    const materialAvailableQuantity = useMemo(calculateAvailableQuantity, [newOutflow, showExtras, remainingQuantities]);

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
                            <input type="text" name="materialname" value={materials.find(m => m.matid === newOutflow.materialid)?.name || ''} readOnly required />
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
                        <input type="number" name="quantity" value={parseFloat(newOutflow.quantity) || ''} onChange={handleChange} required
                            max={materialAvailableQuantity.toFixed(2)} />
                        <div>
                            Available Quantity: {materialAvailableQuantity.toFixed(2)}
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
                            options={employees
                                .filter(employee => employee.active) // ✅ Only active employees
                                .map((employee) => ({
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

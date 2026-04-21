import React, { useCallback, useState, useEffect, useMemo } from 'react';
import './PurchaseFunc.css';
import Select from 'react-select';
import AddProject from './AddProject.js';

const normalizeLotnumber = (value) => {
    if (value === undefined || value === null) {
        return null;
    }

    const trimmedValue = String(value).trim();
    return trimmedValue && trimmedValue !== 'EMPTY' ? trimmedValue : null;
};

const normalizeWidth = (value) => {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const parsedWidth = parseFloat(value);
    return Number.isNaN(parsedWidth) || parsedWidth === -1 ? null : parsedWidth;
};

const hasVariantValues = (item) =>
    normalizeLotnumber(item?.lotnumber) !== null || normalizeWidth(item?.width) !== null;

const matchesStockSlice = (candidate, target, requireExactVariant = false) => {
    if (
        candidate.materialid !== target.materialid ||
        Number(candidate.location) !== Number(target.location)
    ) {
        return false;
    }

    if (!requireExactVariant) {
        return true;
    }

    return (
        normalizeLotnumber(candidate.lotnumber) === normalizeLotnumber(target.lotnumber) &&
        normalizeWidth(candidate.width) === normalizeWidth(target.width)
    );
};

const AddOutflow = ({
    handleAddInstOutflow,
    locations,
    materials,
    employees,
    projects,
    outflows,
    purchases,
    apiBaseUrl,
    setProjects,
    instOutflow,
    remainingQuantities
}) => {
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
    const [menuPortalTarget, setMenuPortalTarget] = useState(null);

    useEffect(() => {
        setMenuPortalTarget(document.body);
    }, []);

    useEffect(() => {
        setNewOutflow(instOutflow || initialOutflowState);
    }, [initialOutflowState, instOutflow]);

    useEffect(() => {
        if (!instOutflow || !newOutflow.materialid || !newOutflow.location) {
            return;
        }

        const materialHasExtras = materials.find((material) => material.matid === newOutflow.materialid)?.extras === 1;
        const requireExactVariant = materialHasExtras || hasVariantValues(newOutflow);
        const requestedQuantity = parseFloat(newOutflow.quantity);

        setShowExtras(materialHasExtras);

        if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
            setNewOutflow((prevOutflow) => (
                prevOutflow.cost === '' ? prevOutflow : { ...prevOutflow, cost: '' }
            ));
            return;
        }

        const filteredPurchases = purchases.filter((purchase) =>
            matchesStockSlice(purchase, newOutflow, requireExactVariant)
        );
        const filteredOutflows = outflows.filter((outflow) =>
            matchesStockSlice(outflow, newOutflow, requireExactVariant)
        );

        if (materialHasExtras) {
            const purchasePrice = parseFloat(filteredPurchases[0]?.price ?? newOutflow.price);
            const nextCost = Number.isFinite(purchasePrice)
                ? purchasePrice * (normalizeWidth(newOutflow.width) || 0) * requestedQuantity
                : 0;

            setNewOutflow((prevOutflow) => (
                prevOutflow.cost === nextCost ? prevOutflow : { ...prevOutflow, cost: nextCost }
            ));
            return;
        }

        const totalPreviousOutflows = filteredOutflows.reduce(
            (sum, outflow) => sum + (parseFloat(outflow.quantity) || 0),
            0
        );

        let sumOfQuantities = 0;
        let totalCost = 0;
        let remainingOutflowQuantity = requestedQuantity;

        for (const purchase of filteredPurchases) {
            const purchaseQuantity = parseFloat(purchase.quantity) || 0;
            const purchasePrice = parseFloat(purchase.price) || 0;

            sumOfQuantities += purchaseQuantity;
            const remQuant = sumOfQuantities - totalPreviousOutflows;

            if (sumOfQuantities < totalPreviousOutflows || remQuant <= 0) {
                continue;
            }

            if (remainingOutflowQuantity <= remQuant) {
                totalCost += remainingOutflowQuantity * purchasePrice;
                remainingOutflowQuantity = 0;
                break;
            }

            totalCost += remQuant * purchasePrice;
            remainingOutflowQuantity -= remQuant;
        }

        setNewOutflow((prevOutflow) => (
            prevOutflow.cost === totalCost ? prevOutflow : { ...prevOutflow, cost: totalCost }
        ));
    }, [
        initialOutflowState,
        instOutflow,
        materials,
        newOutflow.location,
        newOutflow.lotnumber,
        newOutflow.materialid,
        newOutflow.price,
        newOutflow.quantity,
        newOutflow.width,
        outflows,
        purchases
    ]);

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

    const calculateAvailableQuantity = useCallback(() => {
        if (!newOutflow.materialid || !newOutflow.location) {
            return 0;
        }

        const materialHasExtras = materials.find((material) => material.matid === newOutflow.materialid)?.extras === 1;
        const requireExactVariant = materialHasExtras || hasVariantValues(newOutflow);
        const matchingEntries = remainingQuantities.filter((entry) =>
            matchesStockSlice(entry, newOutflow, requireExactVariant)
        );

        if (requireExactVariant) {
            const matchingEntry = matchingEntries[0];
            return matchingEntry && !isNaN(parseFloat(matchingEntry.remaining_quantity))
                ? parseFloat(matchingEntry.remaining_quantity)
                : 0;
        }

        return matchingEntries.reduce(
            (sum, entry) => sum + (parseFloat(entry.remaining_quantity) || 0),
            0
        );
    }, [materials, newOutflow, remainingQuantities]);

    const materialAvailableQuantity = useMemo(
        () => calculateAvailableQuantity(),
        [calculateAvailableQuantity]
    );

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const quantity = parseFloat(newOutflow.quantity);

            if (!Number.isFinite(quantity) || quantity <= 0) {
                alert('Please enter a valid quantity.');
                return;
            }

            if (quantity > materialAvailableQuantity) {
                alert(`The requested quantity exceeds the available quantity (${materialAvailableQuantity.toFixed(2)}).`);
                return;
            }

            const sanitizedOutflow = {
                ...newOutflow,
                quantity: quantity.toFixed(2),
                width: normalizeWidth(newOutflow.width),
                lotnumber: normalizeLotnumber(newOutflow.lotnumber),
                quotedItemid: newOutflow.quotedItemid === '' ? null : newOutflow.quotedItemid,
            };

            await handleAddInstOutflow(sanitizedOutflow);
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
                return fetchAPI(`${apiBaseUrl}/projectsAPI`);
            })
            .then(data => {
                setProjects(data);
                setShowAddProjectForm(false);
            })
            .catch((error) => {
                console.error('Error in operation:', error);
            });
    }, [apiBaseUrl, fetchAPI, setProjects]);

    const showVariantFields = showExtras || hasVariantValues(newOutflow);

    return (
        <div className='container'>
            <form onSubmit={handleSubmit} className="form">
                <div className='form-row'>
                    <div className='form-group'>
                        <label>Location:</label>
                        <input
                            type="text"
                            name="location"
                            value={locations.find(l => l.id === parseInt(newOutflow.location, 10))?.locationname || ''}
                            readOnly
                            required
                        />
                    </div>
                    <div>
                        <div className='form-group'>
                            <label>Material ID:</label>
                            <input type="text" name="materialid" value={newOutflow.materialid} readOnly required />
                        </div>
                        <div className='form-group'>
                            <label>Material Name:</label>
                            <input
                                type="text"
                                name="materialname"
                                value={materials.find(m => m.matid === newOutflow.materialid)?.name || ''}
                                readOnly
                                required
                            />
                        </div>
                    </div>

                    {showVariantFields && (
                        <div className='form-group'>
                            <label>Width:</label>
                            <input
                                type="number"
                                name="width"
                                value={newOutflow.width ?? ''}
                                readOnly
                                required
                            />
                        </div>
                    )}

                    {showVariantFields && (
                        <div className='form-group'>
                            <label>Lot:</label>
                            <input
                                type="text"
                                name="lotnumber"
                                value={newOutflow.lotnumber || ''}
                                onChange={handleChange}
                                readOnly={!showExtras}
                                required
                            />
                        </div>
                    )}

                    <div className='form-group'>
                        <label>Quantity:</label>
                        <input
                            type="number"
                            name="quantity"
                            value={newOutflow.quantity === '' ? '' : parseFloat(newOutflow.quantity) || ''}
                            onChange={handleChange}
                            required
                            step="0.01"
                            max={materialAvailableQuantity.toFixed(2)}
                        />
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
                            menuPortalTarget={menuPortalTarget}
                            menuPosition="fixed"
                            menuPlacement="auto"
                            styles={{
                                menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999
                                }),
                                menu: (base) => ({
                                    ...base,
                                    maxHeight: '300px'
                                })
                            }}
                            name="employee"
                            value={newOutflow.employee ? { value: newOutflow.employee, label: employees.find(emp => emp.empid === newOutflow.employee)?.name } : null}
                            options={
                                employees
                                    .filter(employee => employee.active)
                                    .map((employee) => ({
                                        value: employee.empid,
                                        label: employee.name,
                                    }))
                            }
                            onChange={(selectedOption) =>
                                handleChange({ target: { name: 'employee', value: selectedOption.value, employeeName: selectedOption.label } })
                            }
                            placeholder="Select an Employee"
                            required
                        />
                    </div>

                    <div className='form-group'>
                        <label>Project:<span className="add-icon" onClick={openAddProjectForm}>+</span></label>
                        <Select
                            menuPortalTarget={menuPortalTarget}
                            menuPosition="fixed"
                            menuPlacement="auto"
                            styles={{
                                menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999
                                }),
                                menu: (base) => ({
                                    ...base,
                                    maxHeight: '300px'
                                })
                            }}
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

                    <div className='form-group'>
                        <label>Quoted Items:</label>
                        <Select
                            menuPortalTarget={menuPortalTarget}
                            menuPosition="fixed"
                            menuPlacement="auto"
                            styles={{
                                menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999
                                }),
                                menu: (base) => ({
                                    ...base,
                                    maxHeight: '300px'
                                })
                            }}
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

import React, { useState, useEffect , useCallback} from 'react';
import Select from 'react-select';
import './CreateCombinedMaterial.css';

const EditCombinedMaterial = ({
    materialId,
    onClose,
    fetchAPI,
    apiBaseUrl,
    onMaterialEdited,
    materialchanges,
}) => {
    const [materialData, setMaterialData] = useState({ name: '', description: '', submaterials: [] });
    const [allMaterials, setAllMaterials] = useState([]);
    const [submaterials, setSubmaterials] = useState([]);
    const [error, setError] = useState(null);
    const [totalCost, setTotalCost] = useState(0);

    const calculateTotalCost = useCallback((submaterials) => {
        if (!materialchanges) {
            setTotalCost(0);
            return;
        }
    
        const total = submaterials.reduce((acc, submaterial) => {
            const filteredMaterialChanges = materialchanges.filter(p => p.material_id === submaterial.material_id);
            const latestMaterialChange = filteredMaterialChanges.reduce((prev, current) => {
                return prev.change_id > current.change_id ? prev : current;
            }, {});
            const price = latestMaterialChange.price || 0;
            const sum = price * submaterial.multiplier; // Calculate the sum correctly
            return acc + sum;
        }, 0);
        setTotalCost(total.toFixed(2));
    }, [materialchanges]);
    
    

    useEffect(() => {
        const fetchData = async () => {
            try {
                const materials = await fetchAPI(`${apiBaseUrl}/materiallist`);
                setAllMaterials(materials);
                const data = await fetchAPI(`${apiBaseUrl}/combinedMaterials/${materialId}`);
                setMaterialData(data);
                const submatdata = await fetchAPI(`${apiBaseUrl}/submaterials/${materialId}`);
                setSubmaterials(submatdata);
                calculateTotalCost(submatdata);
            } catch (error) {
                setError(error.message);
            }
        };
        fetchData();
    }, [materialId, fetchAPI, apiBaseUrl,calculateTotalCost]);

    const handleMaterialChange = (e) => {
        const { name, value } = e.target;
        setMaterialData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmaterialChange = (index, field, value) => {
        const updatedSubmaterials = submaterials.map((submat, i) =>
            i === index ? { ...submat, [field]: value } : submat
        );
        setSubmaterials(updatedSubmaterials);
        calculateTotalCost(updatedSubmaterials);
    };

    const addSubmaterial = () => {
        setSubmaterials([...submaterials, { material_id: '', multiplier: 1 }]);
    };

    const removeSubmaterial = (index) => {
        const filteredSubmaterials = submaterials.filter((_, i) => i !== index);
        setSubmaterials(filteredSubmaterials);
        calculateTotalCost(filteredSubmaterials);
    };

    const saveChanges = async () => {
        if (!materialData.name || !materialData.description) {
            setError("Please fill out all fields.");
            return;
        }

        try {
            // Delete old submaterials
            await fetchAPI(`${apiBaseUrl}/submaterials/${materialId}`, {
                method: 'DELETE'
            });

            // Update combined material
            await fetchAPI(`${apiBaseUrl}/combinedMaterials/${materialId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...materialData }),
            });

            // Add new submaterials
            await fetchAPI(`${apiBaseUrl}/submaterials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ submaterials: submaterials.map(sub => ({ ...sub, combined_material_id: materialId })) }),
            });

            onMaterialEdited(); // Trigger refresh of material list
            onClose(); // Close the popup
        } catch (error) {
            setError(error.message);
        }
    };

    


    return (
        <div className="material-input-form-container">
            <div className="material-input-form">
                <h3>Edit Combined Material</h3>
                {error && <div className="error-message">Error: {error}</div>}
                <span className="close-popup" onClick={onClose}>&times;</span>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="name">Name:</label>
                        <input
                            id="name"
                            name="name"
                            value={materialData.name}
                            onChange={handleMaterialChange}
                            className="form-control"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Description:</label>
                        <textarea
                            id="description"
                            name="description"
                            value={materialData.description}
                            onChange={handleMaterialChange}
                            className="form-control"
                        />
                    </div>
                </div>

                {submaterials.map((submaterial, index) => (
                    <div key={index} className="material-selection">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Material</label>
                                <Select
                                    className="form-control"
                                    value={submaterial.material_id ? { value: submaterial.material_id, label: allMaterials.find(m => m.matid === submaterial.material_id)?.name } : null}
                                    onChange={(selectedOption) => handleSubmaterialChange(index, 'material_id', selectedOption.value)}
                                    options={allMaterials.map(material => ({ value: material.matid, label: material.name }))}
                                    placeholder="Select Material"
                                    isSearchable={true}
                                />
                            </div>
                            <div className="form-group">
                                <label>Multiplier</label>
                                <input
                                    type="number"
                                    value={submaterial.multiplier}
                                    onChange={(e) => handleSubmaterialChange(index, 'multiplier', e.target.value)}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>Price</label>
                                <input
                                    type="number"
                                    value={(() => {
                                        const filteredMaterialChanges = materialchanges.filter(p => p.material_id === submaterial.material_id);
                                        const latestMaterialChange = filteredMaterialChanges.reduce((prev, current) => {
                                            return prev.change_id > current.change_id ? prev : current;
                                        }, {});
                                        return latestMaterialChange.price || '';
                                    })()}
                                    readOnly
                                    className="form-control"
                                />
                            </div>

                            <div className="form-group">
    <label>Sum</label>
    <input
        type="number"
        value={(() => {
            const filteredMaterialChanges = materialchanges.filter(p => p.material_id === submaterial.material_id);
            const latestMaterialChange = filteredMaterialChanges.reduce((prev, current) => {
                return prev.change_id > current.change_id ? prev : current;
            }, {});
            const price = latestMaterialChange.price || 0;
            return (price * submaterial.multiplier).toFixed(2);
        })()}
        readOnly
        className="form-control"
    />
</div>


                            <div className="form-group">
                                <label>Comments</label>
                                <input
                                    type="text"
                                    value={submaterial.comments}
                                    onChange={(e) => handleSubmaterialChange(index, 'comments', e.target.value)}
                                    className="form-control"
                                />
                            </div>
                            <div className="price-remove-container">
                                {submaterials.length > 1 && (
                                    <button
                                        className="remove-btn"
                                        onClick={() => removeSubmaterial(index)}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                <div>
                    <div className="total-cost-container">
                        <span className="total-cost-label">Total Cost:</span>
                        <span className="total-cost-value">{totalCost}</span>
                    </div>
                    <button
                        className="btn btn-primary add-btn" onClick={addSubmaterial}>Add Submaterial</button>
                    <button className="btn btn-success save-btn" onClick={saveChanges}>Save Changes</button>
                    <button className="remove-btn" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default EditCombinedMaterial;

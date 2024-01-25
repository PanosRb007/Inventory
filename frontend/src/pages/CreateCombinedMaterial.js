import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';

import './CreateCombinedMaterial.css';

const CombinedMaterialInputForm = ({
    onClose,
    fetchAPI,
    apiBaseUrl,
    onMaterialAdded,
}) => {
    const initialComboMat = {
        name: '',
        description: '',
    };
    const initialEmptyMaterial = {
        combined_material_id: null,
        materialId: '',
        multiplier: 1,  // Assuming a default multiplier of 1
    };

    const [comboMat, setComboMat] = useState(initialComboMat);
    const [error, setError] = useState(null);
    const [materials, setMaterials] = useState([]);
    const [submaterials, setSubmaterials] = useState([initialEmptyMaterial]);

    const fetchData = useCallback(async () => {
        try {
            const MaterialData = await fetchAPI(`${apiBaseUrl}/materiallist`);
            setMaterials(MaterialData);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError(error.message);
        }
    }, [fetchAPI, apiBaseUrl]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setComboMat((prevComboMat) => ({
            ...prevComboMat,
            [name]: value,
        }));
    };

    const handleSubmaterialChange = (index, field, value) => {
        const updatedSubmaterials = [...submaterials];
        updatedSubmaterials[index][field] = value;
        setSubmaterials(updatedSubmaterials);
    };

    const saveCombinedMaterial = async () => {
        try {
            // Attempt to save the new combined material by making a POST request
            const combinedMaterialData = await fetchAPI(`${apiBaseUrl}/combinedMaterials`, {
                method: 'POST',
                body: JSON.stringify({
                    name: comboMat.name,
                    description: comboMat.description,
                }),
            });

            console.log(combinedMaterialData);
            // Check if the combined material was successfully created
            if (combinedMaterialData.success) {
                // Extract the ID of the newly created combined material
                const combined_material_id = combinedMaterialData.id;
                console.log('combined_material_id', combined_material_id);

                // Prepare submaterials payload
                const submaterialsPayload = submaterials.map(submaterial => ({
                    combined_material_id: combined_material_id, // This is the insertId from the combined material creation
                    material_id: submaterial.materialId,
                    multiplier: submaterial.multiplier,
                }));

                // Send a POST request to add submaterials
                const submaterialsResponse = await fetchAPI(`${apiBaseUrl}/submaterials`, {
                    method: 'POST',
                    body: JSON.stringify({ submaterials: submaterialsPayload }),
                });

                // Check if the submaterials were successfully added
                if (submaterialsResponse.success) {
                    alert('Combined material and submaterials saved successfully!');
                    setComboMat(initialComboMat); // Reset the form to initial state
                    setSubmaterials([initialEmptyMaterial]); // Reset the submaterials
                    onMaterialAdded(); // Invoke callback for material addition
                    onClose(); // Close the form/modal
                } else {
                    // Handle the case where the API response indicates failure in adding submaterials
                    alert(`Error creating submaterials: ${submaterialsResponse.error || 'Unknown error'}`);
                }
            } else {
                // Handle the case where the API response indicates failure in creating combined material
                console.error('Failed to create combined material');
                alert('Failed to create combined material');
            }
        } catch (error) {
            // Handle any errors that occurred during the process
            console.error('Error in saveCombinedMaterial:', error);
            alert(`Error: ${error.message}`);
        }
    };


    const addMaterial = () => {
        setSubmaterials([...submaterials, { ...initialEmptyMaterial }]);
    };

    const removeMaterial = (index) => {
        setSubmaterials(submaterials.filter((_, i) => i !== index));
    };

    if (error) return <div>Error: {error}</div>;

    return (
        <div className="material-input-form-container">
        <div className="material-input-form">
            <h3>Combine Materials</h3>
            <span className="close-popup" onClick={onClose}>&times;</span>
            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="comboName">Combo Name</label>
                    <input
                        id="comboName"
                        type="text"
                        name="name"
                        value={comboMat.name}
                        onChange={handleChange}
                        placeholder="Enter combined material name"
                        className="form-control"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={comboMat.description}
                        onChange={handleChange}
                        placeholder="Enter Description"
                        className="form-control"
                    />
                </div>
            </div>

            {materials.length > 0 && submaterials.map((selection, index) => (
                <div key={index} className="material-selection">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Material</label>
                            <Select
                                className="form-control"
                                value={selection.materialId ? { value: selection.materialId, label: materials.find(m => m.matid === selection.materialId)?.name } : null}
                                onChange={(selectedOption) => handleSubmaterialChange(index, 'materialId', selectedOption.value)}
                                options={materials.map(material => ({ value: material.matid, label: material.name }))}
                                placeholder="Select Material"
                                isSearchable={true}
                            />
                        </div>
                        <div className="form-group">
                            <label>Multiplier</label>
                            <input
                                type="number"
                                value={selection.multiplier}
                                onChange={(e) => handleSubmaterialChange(index, 'multiplier', e.target.value)}
                                className="form-control"
                            />
                        </div>
                        <div className="price-remove-container">
                            {submaterials.length > 1 && (
                                <button
                                    className="remove-btn"
                                    onClick={() => removeMaterial(index)}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            <button className="btn btn-primary add-btn" onClick={addMaterial}>Add Material</button>
            <button className="btn btn-success save-btn" onClick={saveCombinedMaterial}>Save Combined Material</button>
        </div>
        </div>
    );
    
};

export default CombinedMaterialInputForm;

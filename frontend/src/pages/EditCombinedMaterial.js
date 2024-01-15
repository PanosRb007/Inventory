import React, { useState, useEffect } from 'react';
import './CreateCombinedMaterial.css';

const EditCombinedMaterial = ({
    materialId,
    onClose,
    fetchAPI,
    apiBaseUrl,
    onMaterialEdited,
}) => {
    const [materialData, setMaterialData] = useState({ name: '', description: '', submaterials: [] });
    const [allMaterials, setAllMaterials] = useState([]);
    const [submaterials, setSubmaterials] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const materials = await fetchAPI(`${apiBaseUrl}/materiallist`);
                setAllMaterials(materials);
                const data = await fetchAPI(`${apiBaseUrl}/combinedMaterials/${materialId}`);
                setMaterialData(data);
                const submatdata = await fetchAPI(`${apiBaseUrl}/submaterials/${materialId}`);
                setSubmaterials(submatdata);
            } catch (error) {
                setError(error.message);
            }
        };
        fetchData();
    }, [materialId, fetchAPI, apiBaseUrl]);

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
        console.log('editsubmat', submaterials);
    };

    const addSubmaterial = () => {
        setSubmaterials([...submaterials, { material_id: '', multiplier: 1 }]);
    };

    const removeSubmaterial = (index) => {
        const filteredSubmaterials = submaterials.filter((_, i) => i !== index);
        setSubmaterials(filteredSubmaterials);
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
                            <select
                                value={submaterial.material_id}
                                onChange={(e) => handleSubmaterialChange(index, 'material_id', e.target.value)}
                                className="form-control"
                            >
                                <option value="">Select Material</option>
                                {allMaterials.map(material => (
                                    <option key={material.matid} value={material.matid}>{material.name}</option>
                                ))}
                            </select>
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

            <button
                className="btn btn-primary add-btn" onClick={addSubmaterial}>Add Submaterial</button>
            <div>
                <button className="btn btn-success save-btn" onClick={saveChanges}>Save Changes</button>
                <button className="remove-btn" onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};

export default EditCombinedMaterial;
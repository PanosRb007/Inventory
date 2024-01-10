import React, { useState, useEffect } from 'react';
import './CreateCombinedMaterial.css'; // Import CSS for styling

const EditCombinedMaterial = ({
    materialId,
    onClose,
    fetchAPI,
    apiBaseUrl,
    onMaterialUpdated,
}) => {
    const [materialData, setMaterialData] = useState({
    });
    const [error, setError] = useState(null);
    const [allMaterials, setAllMaterials] = useState([]);
    const [submaterials, setSubmaterials] = useState([]);

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
    console.log(submaterials);
    console.log('gggg', submaterials);
    console.log(materialId);



    const handleMaterialChange = (e) => {
        const { name, value } = e.target;
        setMaterialData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmaterialChange = (index, field, value) => {
        const updatedSubmaterials = materialData.submaterials.map((submat, i) =>
            i === index ? { ...submat, [field]: value } : submat
        );
        setMaterialData({ ...materialData, submaterials: updatedSubmaterials });
    };

    const addSubmaterial = () => {
        setMaterialData({
            ...materialData,
            submaterials: [...materialData.submaterials, { material_id: '', multiplier: 1, price: 0 }],
        });
    };

    const removeSubmaterial = (index) => {
        const filteredSubmaterials = materialData.submaterials.filter((_, i) => i !== index);
        setMaterialData({ ...materialData, submaterials: filteredSubmaterials });
    };

    const saveChanges = async () => {
        if (!materialData.name || !materialData.description) {
            setError("Please fill out all fields.");
            return;
        }

        try {
            const response = await fetchAPI(`${apiBaseUrl}/saveCombinedMaterial/${materialId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(materialData),
            });

            if (response.ok) {
                onMaterialUpdated(); // Trigger refresh of material list
                onClose(); // Close the popup
            } else {
                const errorData = await response.json();
                setError(errorData.message || "Failed to update material");
            }
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="material-input-form">
            <h3>Edit Combined Material</h3>
            {error && <div>Error: {error}</div>}
            <span className="close-popup" onClick={onClose}>
                &times;
            </span>
            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="name">Name:</label>
                    <input
                        id="name"
                        name="name"
                        value={materialData.name}
                        onChange={handleMaterialChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description:</label>
                    <textarea
                        id="description"
                        name="description"
                        value={materialData.description}
                        onChange={handleMaterialChange}
                    />
                </div>    
            </div>
            {allMaterials.length > 0 && submaterials.map((selection, index) => (
                <div key={index} className="material-selection">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Material</label>
                            <select
                                value={submaterials.material_id}
                                onChange={(e) => handleSubmaterialChange(index, 'materialId', e.target.value)}
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
                                value={selection.multiplier}
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

            <button className="btn btn-primary add-btn" onClick={addSubmaterial}>Add Submaterial</button>

            <div className="form-actions">
                <button className="btn btn-success save-btn" onClick={saveChanges}>Save Changes</button>
                <button className="btn btn-primary add-btn" onClick={onClose}>Cancel</button>
            </div>
        </div>

    );
};

export default EditCombinedMaterial;

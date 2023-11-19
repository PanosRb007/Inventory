import React from 'react';
import './CreateCombinedMaterial.css'; // Import CSS for styling

const CombinedMaterialInputForm = ({ onClose, combinedMaterialName, combinedMaterialDescription, setcombinedMaterialDescription, setCombinedMaterialName, selectedMaterials, handleMaterialChange, handleMultiplierChange, addMaterial, saveCombinedMaterial, materials, removeMaterial }) => {
    return (
        <div className="material-input-form">
            
        <h3>Combine Materials</h3>
        <span className="close-popup" onClick={onClose}>
                &times;
            </span>
        <div className="form-row">
            <div className="form-group">
                <label htmlFor="comboName">Combo Name</label>
                <input 
                    id="comboName"
                    type="text"
                    value={combinedMaterialName}
                    onChange={(e) => setCombinedMaterialName(e.target.value)}
                    placeholder="Enter combined material name"
                    className="form-control"
                />
            </div>
            <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea 
                    id="description"
                    value={combinedMaterialDescription}
                    onChange={(e) => setcombinedMaterialDescription(e.target.value)}
                    placeholder="Enter Description"
                    className="form-control"
                />
            </div>
        </div>
        
        {selectedMaterials.map((selection, index) => (
            <div key={index} className="material-selection">
                <div className="form-row">
                    <div className="form-group">
                        <label>Material</label>
                        <select
                            value={selection.materialId}
                            onChange={(e) => handleMaterialChange(index, e.target.value)}
                            className="form-control"
                        >
                            <option value="">Select Material</option>
                            {materials.map(material => (
                                <option key={material.matid} value={material.matid}>{material.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Multiplier</label>
                        <input
                            type="number"
                            value={selection.multiplier}
                            onChange={(e) => handleMultiplierChange(index, e.target.value)}
                            className="form-control"
                        />
                    </div>
                    <div className="price-remove-container">
                        <div className="unit-price">
                            <span>Unit Price: {selection.unitPrice.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="price-remove-container">
                        {selectedMaterials.length > 1 && (
                            <button className="remove-btn" onClick={() => removeMaterial(index)}>Remove</button>
                        )}
                    </div>
                </div>
            </div>
        ))}

        <button className="btn btn-primary add-btn" onClick={addMaterial}>Add Material</button>
        <button className="btn btn-success save-btn" onClick={saveCombinedMaterial}>Save Combined Material</button>
    </div>
    
    );
};

export default CombinedMaterialInputForm;

import React, { useState, useEffect, useCallback } from 'react';

const MaterialCombiner = ({ apiBaseUrl }) => {
    const [materials, setMaterials] = useState([]);
    const [materialChanges, setMaterialChanges] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMaterials, setSelectedMaterials] = useState([{ materialId: '', multiplier: 1, unitPrice: 0 }]);

    const fetchAPI = useCallback(async (url, options = {}) => {
        const authToken = sessionStorage.getItem('authToken');
        const response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${authToken}`,
            },
        });
        if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(errorResponse.message || `Error fetching ${url}`);
        }
        return response.json();
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const materialData = await fetchAPI(`${apiBaseUrl}/materiallist`);
            const materialChangesData = await fetchAPI(`${apiBaseUrl}/materialchangesAPI`);
            setMaterials(materialData);
            setMaterialChanges(materialChangesData);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    }, [fetchAPI, apiBaseUrl]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleMaterialChange = (index, value) => {
        const updatedMaterials = [...selectedMaterials];
        updatedMaterials[index].materialId = value;
    
        // Find the latest price for the selected material
        const latestPriceEntry = materialChanges
            .filter(mp => mp.material_id === value)
            .sort((a, b) => b.change_id - a.change_id)[0]; // Sorting to get the latest entry
    
        updatedMaterials[index].unitPrice = latestPriceEntry ? parseFloat(latestPriceEntry.price) : 0;
    
        setSelectedMaterials(updatedMaterials);
    };
    

    const handleMultiplierChange = (index, value) => {
        const updatedMaterials = [...selectedMaterials];
        updatedMaterials[index].multiplier = Number(value);
        setSelectedMaterials(updatedMaterials);
    };

    const addMaterial = () => {
        setSelectedMaterials([...selectedMaterials, { materialId: '', multiplier: 1, unitPrice: 0 }]);
    };

    const removeMaterial = (index) => {
        const updatedMaterials = selectedMaterials.filter((_, i) => i !== index);
        setSelectedMaterials(updatedMaterials);
    };

    const calculateTotal = () => {
        const total = selectedMaterials.reduce((acc, material) => {
            return acc + (material.unitPrice * material.multiplier);
        }, 0);
        alert(`Total Cost: ${total.toFixed(2)}`);
    };

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h2>Combine Materials</h2>
            {selectedMaterials.map((selection, index) => (
                <div key={index}>
                    <select
                        value={selection.materialId}
                        onChange={(e) => handleMaterialChange(index, e.target.value)}
                    >
                        <option value="">Select Material</option>
                        {materials.map(material => (
                            <option key={material.matid} value={material.matid}>{material.name}</option>
                        ))}
                    </select>
                    <input
                        type="number"
                        value={selection.multiplier}
                        onChange={(e) => handleMultiplierChange(index, e.target.value)}
                    />
                    <span>Unit Price: {selection.unitPrice.toFixed(2)}</span>
                    {selectedMaterials.length > 1 && (
                        <button onClick={() => removeMaterial(index)}>Remove</button>
                    )}
                </div>
            ))}
            <button onClick={addMaterial}>+</button>
            <button onClick={calculateTotal}>Calculate Total</button>
        </div>
    );
};

export default MaterialCombiner;

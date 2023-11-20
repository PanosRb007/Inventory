import React, { useState, useEffect, useCallback } from 'react';
import { useTable } from 'react-table';
import CreateCombinedMaterial from './CreateCombinedMaterial.js'; // Import the new component
import './PurchaseFunc.css';

const MaterialCombiner = ({ apiBaseUrl }) => {
    const [combinedMaterialName, setCombinedMaterialName] = useState('');
    const [combinedMaterialDescription, setcombinedMaterialDescription] = useState('');
    const [materials, setMaterials] = useState([]);
    const [materialChanges, setMaterialChanges] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMaterials, setSelectedMaterials] = useState([{ materialId: '', multiplier: 1, unitPrice: 0 }]);
    const [combinedMaterials, setCombinedMaterials] = useState([]);
    const [showCreateCombinedMaterial, setShowCreateCombinedMaterial] = useState(false);

    const openCreateCombinedMaterialForm = () => {
        setShowCreateCombinedMaterial(true);
    };

    const closeCreateCombinedMaterialForm = () => {
        setShowCreateCombinedMaterial(false);
    };
    

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
            const data = await fetchAPI(`${apiBaseUrl}/combinedMaterials`);
            setMaterials(materialData);
            setMaterialChanges(materialChangesData);
            setCombinedMaterials(data);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    }, [fetchAPI, apiBaseUrl]);


    useEffect(() => {
        fetchData();
    }, [fetchData]); // Now fetchCombinedMaterials is stable

    const tableData = combinedMaterials.map(({ submaterials, ...material }) => material);

    console.log('tabledata', tableData);


    const handleMaterialChange = (index, value) => {
        const updatedMaterials = [...selectedMaterials];
        updatedMaterials[index].materialId = value;
    
        const latestPriceEntry = materialChanges
            .filter(mp => mp.material_id === value)
            .sort((a, b) => b.change_id - a.change_id)[0];
    
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

    const saveCombinedMaterial = async () => {
        try {
            const payload = {
                name: combinedMaterialName,
                description : combinedMaterialDescription,
                submaterials: selectedMaterials
            };
            await fetchAPI(`${apiBaseUrl}/saveCombinedMaterial`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            alert('Combined material saved successfully!');
            fetchData(); // Fetch the updated list of combined materials
    
            // Reset the form fields
            setCombinedMaterialName('');
            setcombinedMaterialDescription('');
            setSelectedMaterials([{ materialId: '', multiplier: 1, unitPrice: 0 }]);
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };
    
    const handleEdit = (materialId) => {
        // Logic to handle edit (e.g., open a modal or navigate to an edit page)
      };
      
      const handleDelete = useCallback(async (materialId) => {
        if (window.confirm('Are you sure you want to delete this material?')) {
            try {
                await fetchAPI(`${apiBaseUrl}/combinedMaterials/${materialId}`, {
                    method: 'DELETE',
                });
                // Refresh the list or remove the item from the state
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        }
    }, [fetchAPI, apiBaseUrl]); // Add any dependencies here
    
      const columns = React.useMemo(
        () => [
            {
                Header: 'ID',
                accessor: 'id'
            },
            {
                Header: 'Combo Name',
                accessor: 'name'
            },
            {
                Header: 'Description',
                accessor: 'description',
            },
            {
                Header: 'Total Cost',
                accessor: 'totalCost',
                Cell: ({ value }) => `$${value.toFixed(2)}`
            },
            
            {
                Header: 'Actions',
                accessor: '',
                Cell: ({ value }) => (
                    <div>
                        <button onClick={() => handleEdit(value)}>Edit</button>
                        <button onClick={() => handleDelete(value)}>Delete</button>
                    </div>
                )
            }
        ],
        [handleDelete]
    );

    const data = React.useMemo(
        () => tableData,
        [tableData]
    );

    const tableInstance = useTable({ columns, data });

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = tableInstance;

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className='container'>
            <div className='form-group'>
            <button className='add_btn' onClick={openCreateCombinedMaterialForm}>Add Material Combination</button>
            </div>
            {showCreateCombinedMaterial && (
                <div className="create-combined-material-overlay">
                    <div className="create-combined-material-popup">
                        <CreateCombinedMaterial 
                            onClose={closeCreateCombinedMaterialForm}
                            combinedMaterialName={combinedMaterialName}
                            combinedMaterialDescription={combinedMaterialDescription}
                            setcombinedMaterialDescription={setcombinedMaterialDescription}
                            setCombinedMaterialName={setCombinedMaterialName}
                            selectedMaterials={selectedMaterials}
                            handleMaterialChange={handleMaterialChange}
                            handleMultiplierChange={handleMultiplierChange}
                            addMaterial={addMaterial}
                            saveCombinedMaterial={saveCombinedMaterial}
                            materials={materials}
                            removeMaterial={removeMaterial}
                        />
                    </div>
                </div>
            )}
            <div className="table-container">
                <table {...getTableProps()} className="table">
                    <thead>
                        {headerGroups.map(headerGroup => (
                            <tr {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map(column => (
                                    <th {...column.getHeaderProps()}>{column.render('Header')}</th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody {...getTableBodyProps()}>
                        {rows.map(row => {
                            prepareRow(row);
                            return (
                                <tr {...row.getRowProps()}>
                                    {row.cells.map(cell => {
                                        return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>;
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MaterialCombiner;
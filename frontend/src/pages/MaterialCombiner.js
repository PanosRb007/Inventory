import React, { useState, useEffect, useCallback } from 'react';
import { useTable, useGlobalFilter, usePagination } from 'react-table';
import CreateCombinedMaterial from './CreateCombinedMaterial.js'; // Import the new component
import './PurchaseFunc.css';

const MaterialCombiner = ({ apiBaseUrl }) => {
  const [combinedMaterialName, setCombinedMaterialName] = useState('');
  const [combinedMaterialDescription, setcombinedMaterialDescription] = useState('');
  const [materials, setMaterials] = useState([]);
  const [materialChanges, setMaterialChanges] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMaterials, setSelectedMaterials] = useState([{ materialId: '', multiplier: null, unitPrice: 0 }]);
  const [combinedMaterials, setCombinedMaterials] = useState([]);
  const [showCreateCombinedMaterial, setShowCreateCombinedMaterial] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);


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
      setIsLoading(true); // Set loading state to true at the beginning of the fetch operation

      const materialData = await fetchAPI(`${apiBaseUrl}/materiallist`);
      const materialChangesData = await fetchAPI(`${apiBaseUrl}/materialchangesAPI`);
      const combinedMaterialData = await fetchAPI(`${apiBaseUrl}/combinedMaterials`);

      setMaterials(materialData);
      setMaterialChanges(materialChangesData);
      setCombinedMaterials(combinedMaterialData);
    } catch (error) {
      setError(error.message); // Set error state if there's an error during fetching
    } finally {
      setIsLoading(false); // Set loading state to false once fetching is complete
    }
  }, [fetchAPI, apiBaseUrl]); // Dependencies for useCallback

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Dependency array includes fetchData to ensure it runs when fetchData changes



  console.log('tabledata', combinedMaterials);


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
        description: combinedMaterialDescription,
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
      closeCreateCombinedMaterialForm();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleEdit = useCallback((materialId) => {
    const materialToEdit = combinedMaterials.find(material => material.id === materialId);
    if (materialToEdit) {
      setEditingMaterial(materialToEdit);
      openCreateCombinedMaterialForm();
    }
  }, [combinedMaterials]); // Add any dependencies here



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
        accessor: '', // This is an empty accessor as this column doesn't correspond to a specific data field
        Cell: ({ row }) => ( // Destructure row from the cell object
          <div>
            <button onClick={() => handleEdit(row.original.id)}>Edit</button>
            <button onClick={() => handleDelete(row.original.id)}>Delete</button>
          </div>
        )
      }
    ],
    [handleDelete, handleEdit]
  );


  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    state: { pageIndex, pageSize, globalFilter },
    gotoPage,
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage,
    setPageSize,
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data: combinedMaterials,
      initialState: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
    useGlobalFilter,
    usePagination
  );



  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className='container'>
      <div className='form-group'>
        <div className='form-row'>
          <button className='add_btn' onClick={openCreateCombinedMaterialForm}>Add Material Combination</button>
        </div>
      </div>
      {showCreateCombinedMaterial && (
        <div className="overlay">
          <div className="popup">
            <CreateCombinedMaterial
              onClose={closeCreateCombinedMaterialForm}
              combinedMaterialName={combinedMaterialName}
              setCombinedMaterialName={setCombinedMaterialName}
              combinedMaterialDescription={combinedMaterialDescription}
              setcombinedMaterialDescription={setcombinedMaterialDescription}
              selectedMaterials={selectedMaterials}
              handleMaterialChange={handleMaterialChange}
              handleMultiplierChange={handleMultiplierChange}
              addMaterial={addMaterial}
              saveCombinedMaterial={saveCombinedMaterial}
              materials={materials}
              removeMaterial={removeMaterial}
              editingMaterial={editingMaterial}
            />
          </div>
        </div>
      )}
      <div className="search">
        <input
          type="text"
          value={globalFilter || ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search..."
        />
      </div>
      <table {...getTableProps()} className="table">
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>
                  {column.render('Header')}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row) => {
            prepareRow(row);
            return (
              <React.Fragment key={row.getRowProps().key}>
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell) => (
                    <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                  ))}
                </tr>

              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      <div className='pagination'>
        <button className='button' onClick={() => previousPage()} disabled={!canPreviousPage}>
          Previous
        </button>
        <button className='button' onClick={() => nextPage()} disabled={!canNextPage}>
          Next
        </button>
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {Math.ceil(combinedMaterials.length / pageSize)}
          </strong>{' '}
        </span>
        <span>
          | Go to page:{' '}
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              gotoPage(page);
            }}
            style={{ width: '50px' }}
          />
        </span>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[10, 25, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default MaterialCombiner;
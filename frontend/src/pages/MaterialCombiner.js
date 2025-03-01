import React, { useState, useEffect, useCallback } from 'react';
import { useTable, useGlobalFilter, usePagination } from 'react-table';
import CreateCombinedMaterial from './CreateCombinedMaterial.js';
import EditCombinedMaterial from './EditCombinedMaterial.js';
import './PurchaseFunc.css';

const MaterialCombiner = ({ apiBaseUrl }) => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [combinedMaterials, setCombinedMaterials] = useState([]);
  const [showCreateCombinedMaterial, setShowCreateCombinedMaterial] = useState(false);
  const [showEditCombinedMaterial, setShowEditCombinedMaterial] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [materialchanges, setMaterialChanges] = useState([]);

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

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const combinedMaterialData = await fetchAPI(`${apiBaseUrl}/combinedMaterials`);
      const submaterialsData = await fetchAPI(`${apiBaseUrl}/submaterials`);
      const materialChangesData = await fetchAPI(`${apiBaseUrl}/materialchangesAPI`);

      const calculateTotalCost = (combinedMaterialId, submaterialsData, materialChangesData) => {
        const relevantSubmaterials = submaterialsData.filter(submat => submat.combined_material_id === combinedMaterialId);
        
        const totalCost = relevantSubmaterials.reduce((acc, submat) => {
          // Filter to find all changes for this material
          const changesForMaterial = materialChangesData.filter(mc => mc.material_id === submat.material_id);
          
          // Find the change with the largest change_id
          const latestChange = changesForMaterial.reduce((latest, current) => {
            return (latest.change_id > current.change_id) ? latest : current;
          }, { change_id: -1, price: 0 });
          
          // Use the price from the latest change
          const latestPrice = parseFloat(latestChange.price);
          
          const costForSubmaterial = latestPrice * submat.multiplier;
          
          console.log(`Submaterial: ${submat.material_id}, Latest Change Price: ${latestPrice}, Multiplier: ${submat.multiplier}, Cost for Submaterial: ${costForSubmaterial}`);
          
          return acc + costForSubmaterial;
        }, 0);
        
        console.log(`Total Cost for Combined Material ${combinedMaterialId}: ${totalCost}`);
        
        return totalCost;
      };
      
      
      

      const combinedMaterialsWithCost = combinedMaterialData.map(material => ({
        ...material,
        totalCost: calculateTotalCost(material.id, submaterialsData, materialChangesData)
      }));

      setCombinedMaterials(combinedMaterialsWithCost);
      setMaterialChanges(materialChangesData);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAPI, apiBaseUrl]);

  useEffect(() => {
    fetchData().catch(console.error);
  }, [fetchData]);


  const openCreateCombinedMaterialForm = useCallback(() => {
    setShowCreateCombinedMaterial(true);
  }, []);

  const closeCreateCombinedMaterialForm = () => {
    setShowCreateCombinedMaterial(false);
  };

  const openEditCombinedMaterialForm = useCallback((materialId) => {
    setEditingMaterialId(materialId);
    setShowEditCombinedMaterial(true);
  }, []);

  const closeEditCombinedMaterialForm = () => {
    setEditingMaterialId(null);
    setShowEditCombinedMaterial(false);
  };

  const handleDelete = useCallback(async (materialId) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await fetchAPI(`${apiBaseUrl}/combinedMaterials/${materialId}`, { method: 'DELETE' });
        fetchData();
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    }
  }, [fetchAPI, apiBaseUrl, fetchData]);

  

  const columns = React.useMemo(
    () => [
      {
        Header: 'ID',
        accessor: 'id',
      },
      {
        Header: 'Combo Name',
        accessor: 'name',
      },
      {
        Header: 'Description',
        accessor: 'description',
      },
      {
        Header: 'Total Cost',
        accessor: 'totalCost',
        Cell: ({ value }) => `${value.toFixed(2)}€` // Format as currency
      }      ,
      {
        Header: 'Actions',
        accessor: '',
        Cell: ({ row }) => (
          <div>
            <button onClick={() => openEditCombinedMaterialForm(row.original.id)}>Edit</button>
            <button onClick={() => handleDelete(row.original.id)}>Delete</button>
          </div>
        ),
      },
    ],
    [openEditCombinedMaterialForm, handleDelete]
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
    <div className="container">
      <div className="form-group">
        <div className="form-row">
          <button className="add_btn" onClick={openCreateCombinedMaterialForm}>
            Add Material Combination
          </button>
        </div>
      </div>
      {showCreateCombinedMaterial && (
        <div className="overlay">
          <div className="popup">
            <CreateCombinedMaterial
              onClose={closeCreateCombinedMaterialForm}
              fetchAPI={fetchAPI}
              apiBaseUrl={apiBaseUrl}
              onMaterialAdded={fetchData}
              materialchanges={materialchanges}
            />
          </div>
        </div>
      )}
      {showEditCombinedMaterial && (
        <div className="overlay">
          <div className="popup">
            <EditCombinedMaterial
              onClose={closeEditCombinedMaterialForm}
              fetchAPI={fetchAPI}
              apiBaseUrl={apiBaseUrl}
              materialId={editingMaterialId}
              onMaterialEdited={fetchData}
              materialchanges={materialchanges}
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
                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => (
                  <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="pagination">
        <button className="button" onClick={() => previousPage()} disabled={!canPreviousPage}>
          Previous
        </button>
        <button className="button" onClick={() => nextPage()} disabled={!canNextPage}>
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


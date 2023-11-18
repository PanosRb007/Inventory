import React, { useState, useEffect, useCallback } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import './MaterialList.css';
import EditMaterial from './EditMaterial.js';
import AddMaterial from './AddMaterial.js';


const MaterialList = React.memo(({apiBaseUrl}) => {
  
  const [materials, setMaterials] = useState([]);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const materialResponse = await fetchAPI(`${apiBaseUrl}/materiallist`);
        setMaterials(materialResponse);
      } catch (error) {
        console.log('Error fetching data:', error);
      }
    };
  
    fetchData();
  }, [apiBaseUrl, fetchAPI]);

  

  const [editingMaterial, setEditingMaterial] = useState(null);

  const handleAdd = useCallback(async (newMaterial) => {
    const materialExists = materials.some(
      (material) => material.matid === newMaterial.matid || material.name === newMaterial.name
    );
    if (materialExists) {
      alert('Material ID or name already exists.');
      return;
    }
  
    try {
      const addedMaterial = await fetchAPI(`${apiBaseUrl}/materiallist`, {
        method: 'POST',
        body: JSON.stringify(newMaterial),
      });
      setMaterials([...materials, addedMaterial]);
    } catch (error) {
      console.log('Error adding material:', error);
    }
  }, [materials, setMaterials, apiBaseUrl, fetchAPI]);
   

  const handleDelete = useCallback(async (deletedMaterial) => {
    const confirmDeletion = window.confirm('Are you sure you want to delete this material?');
  
    if (confirmDeletion) {
      try {
        await fetchAPI(`${apiBaseUrl}/MaterialList/${deletedMaterial.matid}`, {
          method: 'DELETE',
        });
        const updatedMaterialList = materials.filter((m) => m.matid !== deletedMaterial.matid);
        setMaterials(updatedMaterialList);
      } catch (error) {
        console.log('Error deleting material:', error);
      }
    }
  }, [materials, setMaterials, apiBaseUrl, fetchAPI]);
  

  const handleEdit = useCallback((material) => {
    if (editingMaterial && editingMaterial.matid === material.matid) {
      alert('Material is already being edited.');
      return;
    }
    setEditingMaterial(material);
  }, [editingMaterial]);

  const handleUpdate = useCallback(async (updatedMaterial) => {
    const materialExists = materials.some(
      (material) =>
        (material.matid === updatedMaterial.matid || material.name === updatedMaterial.name) &&
        material.matid !== updatedMaterial.matid
    );
    if (materialExists) {
      alert('Material ID or name already exists.');
      return;
    }
  
    try {
      await fetchAPI(`${apiBaseUrl}/MaterialList/${updatedMaterial.matid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedMaterial),
      });
      const updatedMaterialList = materials.map((m) =>
        m.matid === updatedMaterial.matid ? updatedMaterial : m
      );
      setMaterials(updatedMaterialList);
      setEditingMaterial(null);
    } catch (error) {
      console.log('Error updating material:', error);
    }
  }, [materials, setMaterials, setEditingMaterial, apiBaseUrl, fetchAPI]);
  

  const columns = React.useMemo(
    () => [
      { Header: 'Material ID', accessor: 'matid' },
      { Header: 'Name', accessor: 'name' },
      { Header: 'Description', accessor: 'description' },
      { Header: 'Field', accessor: 'field' },
      { Header: 'Unit of Measure', accessor: 'unit_of_measure' },
      { Header: 'Extra Characteristics', accessor: 'extras'},
      { Header: 'Shelf Life', accessor: 'shelflife' },
      { Header: 'Minimum Stock', accessor: 'minstock' },
      {
        Header: 'Actions',
        Cell: ({ row }) => (
          <div>
            <button onClick={() => handleEdit(row.original)}>Edit</button>
            <button onClick={() => handleDelete(row.original)}>Delete</button>
          </div>
        ),
      },
    ],
    [handleEdit, handleDelete]
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
      data: materials,
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  if (materials.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <AddMaterial handleAdd={handleAdd}/>
      <div className="search">
        <input
          type="text"
          value={globalFilter || ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search..."
        />
      </div>
      <table {...getTableProps()} className="material-table">
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render('Header')}
                  <span>{column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}</span>
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
                {editingMaterial && editingMaterial.matid === row.original.matid && (
                  <tr>
                    <td colSpan={columns.length}>
                      <EditMaterial material={editingMaterial} handleUpdate={handleUpdate} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      <div>
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          Previous
        </button>
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          Next
        </button>
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {Math.ceil(materials.length / pageSize)}
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
});

export default MaterialList;

import React, { useState, useEffect, useCallback } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import './PurchaseFunc.css';
import EditMaterial from './EditMaterial.js';
import AddMaterial from './AddMaterial.js';


const MaterialList = React.memo(({ apiBaseUrl }) => {

  const [materials, setMaterials] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [relatedMaterials, setRelatedMaterials] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newRelated, setNewRelated] = useState('');

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
        const purchaseData = await fetchAPI(`${apiBaseUrl}/PurchasesAPI`);
        setMaterials(materialResponse);
        setPurchases(purchaseData);
      } catch (error) {
        console.log('Error fetching data:', error);
      }
    };

    fetchData();
  }, [apiBaseUrl, fetchAPI]);

 const openRelatedModal = useCallback((material) => {
  setSelectedMaterial(material);
  fetchAPI(`${apiBaseUrl}/related_materialsAPI/${material.matid}`)
    .then(setRelatedMaterials);
  setShowModal(true);
  setNewRelated('');
}, [apiBaseUrl, fetchAPI]);

  const handleAddRelated = async () => {
    if (!newRelated) return;
    await fetchAPI(`${apiBaseUrl}/related_materialsAPI`, {
      method: 'POST',
      body: JSON.stringify({ materialid: selectedMaterial.matid, related_materialid: newRelated }),
    });
    // Refresh
    fetchAPI(`${apiBaseUrl}/related_materialsAPI/${selectedMaterial.matid}`)
      .then(setRelatedMaterials);
    setNewRelated('');
  };

  const handleDeleteRelated = async (id) => {
    await fetchAPI(`${apiBaseUrl}/related_materialsAPI/${id}`, { method: 'DELETE' });
    setRelatedMaterials(relatedMaterials.filter(r => r.id !== id));
  };
  

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

  const handleCancel = () => {
    setEditingMaterial(null);
  };


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
      { Header: 'Extra Characteristics', accessor: 'extras' },
      { Header: 'Shelf Life', accessor: 'shelflife' },
      { Header: 'Minimum Stock', accessor: 'minstock' },
      {
        Header: 'Last Moved',
        Cell: ({ row }) => {
          const materialPurchases = purchases
            .filter(purchase => purchase.materialid === row.original.matid)
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Ταξινόμηση κατά ημερομηνία (από πιο πρόσφατη)

          const lastMovedDate = materialPurchases.length > 0
            ? materialPurchases[0].date
            : null; // Αν δεν υπάρχει ημερομηνία, επιστρέφει null

          return (
            <span>
              {lastMovedDate ? new Date(lastMovedDate).toLocaleDateString('el-GR') : 'No purchases'}
            </span>
          );
        },
        accessor: (row) => {
          const materialPurchases = purchases
            .filter(purchase => purchase.materialid === row.matid)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

          return materialPurchases.length > 0 ? materialPurchases[0].date : null;
        },
        sortType: (rowA, rowB, columnId) => {
          const dateA = rowA.values[columnId] ? new Date(rowA.values[columnId]) : new Date(0);
          const dateB = rowB.values[columnId] ? new Date(rowB.values[columnId]) : new Date(0);
          return dateB - dateA; // Ταξινόμηση από πιο πρόσφατη προς παλαιότερη
        },
      },
      {
        Header: 'Times Bought This Year',
        accessor: (row) => {
          const currentYear = new Date().getFullYear(); // Παίρνει το τρέχον έτος

          // Φιλτράρει τις αγορές για το συγκεκριμένο υλικό που έγιναν φέτος
          const purchasesThisYear = purchases.filter(purchase =>
            purchase.materialid === row.matid &&
            new Date(purchase.date).getFullYear() === currentYear
          );

          return purchasesThisYear.length; // Επιστρέφει τον αριθμό των αγορών
        },
        Cell: ({ value }) => <span>{value}</span>, // Εμφανίζει το αποτέλεσμα στη στήλη
        sortType: 'basic', // Επιτρέπει ταξινόμηση αριθμών
      },
      {
        Header: 'Total Quantity Bought This Year',
        accessor: (row) => {
          const currentYear = new Date().getFullYear(); // Παίρνει το τρέχον έτος

          // Φιλτράρει τις αγορές για το συγκεκριμένο υλικό που έγιναν φέτος
          const purchasesThisYear = purchases.filter(purchase =>
            purchase.materialid === row.matid &&
            new Date(purchase.date).getFullYear() === currentYear
          );

          // Υπολογίζει το άθροισμα των ποσοτήτων από τις φετινές αγορές
          const totalQuantity = purchasesThisYear.reduce((sum, purchase) => sum + parseFloat(purchase.quantity || 0), 0);

          return totalQuantity; // Επιστρέφει τη συνολική ποσότητα αγορών
        },
        Cell: ({ value }) => <span>{value.toFixed(2)}</span>, // Εμφανίζει το αποτέλεσμα με 2 δεκαδικά
        sortType: 'basic', // Επιτρέπει ταξινόμηση αριθμών
      },



      {
        Header: 'Actions',
        Cell: ({ row }) => (
          <div>
            <button onClick={() => handleEdit(row.original)}>Edit</button>
            <button onClick={() => handleDelete(row.original)}>Delete</button>
            <button onClick={() => openRelatedModal(row.original)}>Related Materials</button>
          </div>
        ),
      },
    ],
    [handleEdit, handleDelete, purchases, openRelatedModal]
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
    <div className='container'>
      <AddMaterial handleAdd={handleAdd} />
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
                      <EditMaterial material={editingMaterial} handleUpdate={handleUpdate} handleCancel={handleCancel} />
                    </td>
                  </tr>
                )}
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
      {showModal && (
        <div className="overlay">
          <div className="popup">
            <h3>Related Materials for: {selectedMaterial?.name}</h3>
            <ul>
              {relatedMaterials.map(rm => {
                const relMat = materials.find(m => m.matid === rm.related_materialid);
                return (
                  <li key={rm.id}>
                    {relMat ? relMat.name : rm.related_materialid}
                    <button onClick={() => handleDeleteRelated(rm.id)}>Διαγραφή</button>
                  </li>
                );
              })}
            </ul>
            <select
              value={newRelated}
              onChange={e => setNewRelated(e.target.value)}
            >
              <option value="">--Επιλογή related υλικού--</option>
              {materials
                .filter(m => m.matid !== selectedMaterial.matid && !relatedMaterials.some(r => r.related_materialid === m.matid))
                .map(m => (
                  <option key={m.matid} value={m.matid}>{m.name}</option>
                ))}
            </select>
            <button onClick={handleAddRelated}>Προσθήκη</button>
            <button onClick={() => setShowModal(false)}>Κλείσιμο</button>
          </div>
        </div>
      )}

    </div>
  );
});

export default MaterialList;

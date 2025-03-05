import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import EditPurchase from './EditPurchase.js';
import PurchaseVerification from './PurchaseVerification.js';
import './PurchaseFunc.css';
import AddPurchase from './AddPurchase.js';
import InstOut from './InstOut.js';
import VendPurc from './VendPurc.js';
import MatPurch from './MatPurch.js';


const PurchaseFunc = ({ apiBaseUrl }) => {
  const [purchases, setPurchases] = useState([]);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [verPurchase, setVerPurchase] = useState(null);
  const [locations, setLocations] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [outflows, setOutflows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [materialchanges, setMaterialchanges] = useState([]);
  const [selectedOutflowRow, setSelectedOutflowRow] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // New state to track loading status
  const [globalFilterOne, setGlobalFilterOne] = useState('');
  const [globalFilterTwo, setGlobalFilterTwo] = useState('');
  const [showAddInstOutflowForm, setShowAddInstOutflowForm] = useState(false);
  const [showVendPurc, setShowVendPurc] = useState(false);
  const [showMatPurc, setShowMatPurc] = useState(false);
  const [rowdata, setRowdata] = useState([]);
  const [remainingQuantities, setRemainingQuantities] = useState([]);

  const openAddOutflowForm = useCallback((row) => {
    setSelectedOutflowRow(row);
    setShowAddInstOutflowForm(true);
  }, []);

  const openVendPurc = (rowd) => {
    setShowVendPurc(true);
    setRowdata(rowd);
  };

  const openMATPurc = (rowd) => {
    setShowMatPurc(true);
    setRowdata(rowd);
  };

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
      const [purchaseData, locationData, materialData, vendorData, materialchangesData, outflowsData, employeesData, projectsData, remainingQuantityData] = await Promise.all([
        fetchAPI(`${apiBaseUrl}/PurchasesAPI`),
        fetchAPI(`${apiBaseUrl}/LocationsAPI`),
        fetchAPI(`${apiBaseUrl}/materiallist`),
        fetchAPI(`${apiBaseUrl}/vendors`),
        fetchAPI(`${apiBaseUrl}/materialchangesAPI`),
        fetchAPI(`${apiBaseUrl}/outflowsAPI`),
        fetchAPI(`${apiBaseUrl}/employeesAPI`),
        fetchAPI(`${apiBaseUrl}/projectsAPI`),
        fetchAPI(`${apiBaseUrl}/remaining_quantityAPI`),
      ]);

      setPurchases(purchaseData);
      setLocations(locationData);
      setMaterials(materialData);
      setVendors(vendorData);
      setMaterialchanges(materialchangesData);
      setOutflows(outflowsData);
      setEmployees(employeesData);
      setProjects(projectsData);
      setRemainingQuantities(remainingQuantityData);


    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAPI, apiBaseUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
    console.log('rems',remainingQuantities);

  const filteredData = useMemo(() => {
    const lowerCaseFilterOne = globalFilterOne.toLowerCase();
    const lowerCaseFilterTwo = globalFilterTwo.toLowerCase();

    return purchases.filter(row => {
      const locationName = locations.find(loc => loc.id === row.location)?.locationname.toLowerCase() || '';
      const vendorName = vendors.find(vendor => vendor.vendorid === row.vendor)?.name.toLowerCase() || '';
      const materialName = materials.find(material => material.matid === row.materialid)?.name.toLowerCase() || '';

      const rowString = `${Object.values(row).join(' ').toLowerCase()} ${locationName} ${vendorName} ${materialName}`;
      return rowString.includes(lowerCaseFilterOne) && rowString.includes(lowerCaseFilterTwo);
    });
  }, [purchases, globalFilterOne, globalFilterTwo, locations, vendors, materials]);

  const handleAdd = useCallback(async (newPurchase) => {
    try {
      // Run duplicate check only when width is not null
      if (newPurchase.width !== null) {
        const duplicate = purchases.some(
          (purchase) =>
            purchase.lotnumber === newPurchase.lotnumber
        );
  
        if (duplicate) {
          alert(
            'The specified Lot Number already exists for this material with the same width.'
          );
          return;
        }
      }
      // Proceed with adding the new purchase if no duplicate is found
      await fetchAPI(`${apiBaseUrl}/PurchasesAPI`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPurchase),
      });
  
      fetchData(); // Refresh data after adding the purchase
    } catch (error) {
      console.error('Error adding purchase:', error.message);
      alert('Failed to add the purchase. Please try again.');
    }
  }, [fetchData, apiBaseUrl, fetchAPI, purchases]);
  

  const handleDelete = useCallback((deletedPurchase) => {
    const { materialid, lotnumber, location, width, quantity } = deletedPurchase;
  
    // ✅ Normalize lotnumber and width
    const normalizedLotnumber = (!lotnumber || lotnumber.trim() === '') ? null : lotnumber;
    const normalizedWidth = (!width || width.trim() === '') ? null : width;
  
    console.log(`🔍 Checking remaining quantity for: 
      Material: ${materialid}, 
      Location: ${location}, 
      Lot: ${normalizedLotnumber || 'NULL'}, 
      Width: ${normalizedWidth || 'NULL'}`);
  
    // 🔎 Find the correct `remaining_quantity`
    const matchingEntry = remainingQuantities.find((entry) =>
      entry.materialid === materialid &&
      entry.location === location &&
      (
        entry.lotnumber === normalizedLotnumber || 
        (!entry.lotnumber && (!normalizedLotnumber || normalizedLotnumber === "EMPTY")) ||
        (entry.lotnumber === "EMPTY" && (!normalizedLotnumber || normalizedLotnumber === "EMPTY"))
      ) &&
      (
        parseFloat(entry.width) === parseFloat(normalizedWidth) || 
        (entry.width === null && (!normalizedWidth || parseFloat(normalizedWidth) === -1)) ||
        (parseFloat(entry.width) === -1 && (!normalizedWidth || parseFloat(normalizedWidth) === -1))
      )
    );
  
    if (!matchingEntry) {
      alert(`❌ Error: No remaining quantity data found for this purchase.`);
      return;
    }
  
    const remaining = parseFloat(matchingEntry.remaining_quantity) || 0;
    console.log(`✅ Found Remaining Quantity: ${remaining.toFixed(2)} for this material.`);
  
    // ❌ Block delete if remaining quantity is smaller than row quantity
    if (remaining < quantity) {
      alert(`❌ Cannot delete: Remaining quantity (${remaining.toFixed(2)}) is less than the purchase quantity (${quantity}).`);
      return;
    }
  
    // ✅ Proceed with delete only if all checks pass
    if (window.confirm('Are you sure you want to delete this purchase?')) {
      fetchAPI(`${apiBaseUrl}/PurchasesAPI/${deletedPurchase.id}`, {
        method: 'DELETE',
      })
        .then(() => {
          setPurchases((prevPurchases) => prevPurchases.filter((p) => p.id !== deletedPurchase.id));
          alert('✅ Purchase deleted successfully.');
        })
        .catch((error) => {
          console.error('❌ Error deleting purchase:', error);
          alert('❌ Error deleting purchase.');
        });
    }
  }, [remainingQuantities, apiBaseUrl, fetchAPI]);
  
  
  

  const handleEdit = useCallback((purchase) => {
    if (editingPurchase && editingPurchase.id === purchase.id) {
      alert('Purchase is already being edited.');
      return;
    }

    setEditingPurchase(purchase);
  }, [editingPurchase]);

  const handleVerification = useCallback((purchase) => {
    if (verPurchase && verPurchase.id === purchase.id) {
      alert('Purchase is already being edited.');
      return;
    }

    setVerPurchase(purchase);
  }, [verPurchase]);

  const handleUpdate = useCallback((updatedPurchase) => {
    const { id, materialid, lotnumber, location, width, quantity } = updatedPurchase;
  
    // ✅ Normalize lotnumber and width
    const normalizedLotnumber = (!lotnumber || lotnumber.trim() === '') ? null : lotnumber;
    const normalizedWidth = (!width || width.trim() === '') ? null : width;
  
    console.log(`🔍 Checking remaining quantity before edit:
      Material: ${materialid}, 
      Location: ${location}, 
      Lot: ${normalizedLotnumber || 'NULL'}, 
      Width: ${normalizedWidth || 'NULL'}, 
      New Quantity: ${quantity}`);
  
    // 🔎 Find the current `remaining_quantity`
    const matchingEntry = remainingQuantities.find((entry) =>
      entry.materialid === materialid &&
      entry.location === location &&
      (
        entry.lotnumber === normalizedLotnumber || 
        (!entry.lotnumber && (!normalizedLotnumber || normalizedLotnumber === "EMPTY")) ||
        (entry.lotnumber === "EMPTY" && (!normalizedLotnumber || normalizedLotnumber === "EMPTY"))
      ) &&
      (
        parseFloat(entry.width) === parseFloat(normalizedWidth) || 
        (entry.width === null && (!normalizedWidth || parseFloat(normalizedWidth) === -1)) ||
        (parseFloat(entry.width) === -1 && (!normalizedWidth || parseFloat(normalizedWidth) === -1))
      )
    );
  
    if (!matchingEntry) {
      alert(`❌ Error: No remaining quantity data found for this purchase.`);
      return;
    }
  
    const currentRemaining = parseFloat(matchingEntry.remaining_quantity) || 0;
    console.log(`✅ Found Current Remaining Quantity: ${currentRemaining.toFixed(2)}`);
  
    // ✅ Find the original purchase quantity before updating
    const originalPurchase = purchases.find(p => p.id === id);
    if (!originalPurchase) {
      alert(`❌ Error: Cannot find the original purchase.`);
      return;
    }
  
    const originalQuantity = parseFloat(originalPurchase.quantity) || 0;
    console.log(`🔄 Original Purchase Quantity: ${originalQuantity}`);
  
    // 🔹 Calculate the maximum allowed quantity
    const minQuantity = originalQuantity - currentRemaining;
    console.log(`🔄 Minimum Allowed Quantity: ${minQuantity.toFixed(2)}`);
  
    // ❌ Block update if it exceeds the maximum allowed quantity
    if (quantity < minQuantity) {
      alert(`❌ Cannot update: The new quantity (${quantity}) exceeds the available stock (${minQuantity.toFixed(2)}).`);
      return;
    }
  
    // ✅ Proceed with update only if all checks pass
    fetchAPI(`${apiBaseUrl}/PurchasesAPI/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedPurchase),
    })
      .then(() => {
        fetchData(); // Refresh data after update
        setEditingPurchase(null);
        alert('✅ Purchase updated successfully.');
      })
      .catch((error) => {
        console.error('❌ Error updating the purchase:', error);
        alert('❌ Error updating purchase.');
      });
  }, [purchases, remainingQuantities, apiBaseUrl, fetchAPI, fetchData]);
  
  

  /*const handleUpdate = useCallback(async (updatedPurchase) => {
    try {
      await fetchAPI(`${apiBaseUrl}/PurchasesAPI/${updatedPurchase.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPurchase),
      });
      fetchData();
      setEditingPurchase(null);
      setVerPurchase(null);
      alert('Edit Success.');
    } catch (error) {
      console.error('Error updating the purchase:', error);
      alert('Edit Error.');
    }
  }, [fetchData, apiBaseUrl, fetchAPI]);*/


  const handleCancel = () => {
    setEditingPurchase(null);
    setVerPurchase(null);
  };

  const handleOrder = useCallback(async (row) => {
    const orderData = {
      location_id: row.location,
      material_id: row.materialid,
      vendor_id: row.vendor,
    };

    try {
      // Make a POST request to the order_list API
      await fetchAPI(`${apiBaseUrl}/order_listAPI`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      alert('Order added.');
      // Optionally, handle any actions after successful posting
    } catch (error) {
      console.error('Error creating order:', error.message);
      alert('Error creating order:', error.message);
    }
  }, [fetchAPI, apiBaseUrl]);


  const handleAddInstOutflow = useCallback(async (newOutflow) => {
    try {
      await fetchAPI(`${apiBaseUrl}/outflowsAPI`, {
        method: 'POST',
        body: JSON.stringify(newOutflow),
      });
  
      console.log('✅ Outflow added successfully.');
  
      // Force update purchases and outflows
      await fetchData();
  
      // Close the InstOut form
      setShowAddInstOutflowForm(false);
  
      alert('✅ Outflow added successfully.');
    } catch (error) {
      console.error('❌ Error adding outflow:', error.message);
      alert('❌ Error adding outflow.');
    }
  }, [apiBaseUrl, fetchAPI, fetchData, setShowAddInstOutflowForm]);
  
  
  
  
  

  const columns = React.useMemo(
    () => [
      { Header: 'ID', accessor: 'id' },
      {
        Header: 'Location',
        accessor: (value) => {
          const locationnm = locations.find((loc) => loc.id === value.location);
          return locationnm ? locationnm.locationname : 'location not found';
        },
      },
      {
        Header: 'Material ID',
        accessor: 'materialid',
        Cell: ({ row }) => (
            <span 
                style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                onClick={() => openMATPurc(row.original)}
            >
                {row.original.materialid}
            </span>
        ),
    },
          {
        Header: 'Material Name',
        accessor: (row) => {
          const material = materials.find((material) => material.matid === row.materialid);
          return material ? material.name : 'Material not found';
        },
      },
      { Header: 'Width', accessor: 'width' },
      { Header: 'Lot No', accessor: 'lotnumber' },
      { Header: 'Quantity', accessor: 'quantity' },
      {
        Header: 'Remaining Quantity',
        accessor: (row) => {
          // Εύρεση αντιστοιχίας στο testremaining
          const data = remainingQuantities.find((entry) =>
            entry.materialid === row.materialid && // Ταιριάζει το materialid
            entry.location === row.location && // Σιγουρεύουμε ότι το location είναι αριθμός
            (
              entry.lotnumber === row.lotnumber || // Σωστή αντιστοίχιση lotnumber
              (!entry.lotnumber && (!row.lotnumber || row.lotnumber === "EMPTY")) || // Αν το entry.lotnumber είναι null/empty και το row.lotnumber είναι επίσης empty
              (entry.lotnumber === "EMPTY" && (!row.lotnumber || row.lotnumber === "EMPTY")) // Αν το entry.lotnumber είναι "EMPTY"
          )
           &&
            (
              parseFloat(entry.width) === parseFloat(row.width) || // Σωστή σύγκριση width
              (entry.width === null && (!row.width || parseFloat(row.width) === -1)) || // Αν entry.width είναι null, τότε row.width πρέπει να είναι -1 ή undefined
              (parseFloat(entry.width) === -1 && (!row.width || parseFloat(row.width) === -1)) // Αν entry.width είναι -1, το row.width πρέπει να είναι το ίδιο
            )
          );

          // Αν υπάρχει σωστό remaining_quantity, εμφανίζεται, αλλιώς 'N/A'
          const remaining = data && !isNaN(parseFloat(data.remaining_quantity))
            ? parseFloat(data.remaining_quantity).toFixed(2)
            : 'N/A';

          return <span style={{ color: 'red' }}>{remaining}</span>;
        },
      }
      ,
      
      {
        Header: 'Price',
        accessor: 'price',
        Cell: ({ row }) => {
          const materialpricechanges = materialchanges.filter((mp) => mp.material_id === row.original.materialid);
          const tooltipContent = materialpricechanges.map((mp) => `Date: ${formatDateTime(mp.change_date)} Price: ${(mp.price)} €  Vendor: ${vendors.find(vendor => vendor.vendorid === mp.vendor)?.name}`).join('\n');

          return (
            <span title={tooltipContent || 'Vendor not found'}>
              {(row.original.price)} €
            </span>
          );
        },
      },
      {
        Header: 'Total Cost',
        accessor: (row) => {
          const totalCost = row.width ? row.width * row.quantity * row.price : row.quantity * row.price;
          return `${(totalCost.toFixed(2))} €`;
        },
      },
      {
        Header: 'Vendor',
        accessor: (row) => {
          const vendor = vendors.find((v) => v.vendorid === row.vendor);
          return vendor ? vendor.name : 'Vendor not found';
        },
        Cell: ({ value, row }) => {
          const vendor = vendors.find((v) => v.vendorid === row.original.vendor);
          if (vendor) {
            const tooltipContent = `Vendor Name: ${vendor.name}\nField: ${vendor.field}\neMail: ${vendor.mail}\nTelephone: ${vendor.tel}\nContact Name: ${vendor.contactname}`;
            return (
              <div>
                <span title={tooltipContent}
                  style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }} 
                  onClick={() => openVendPurc(row.original)}>
                  {value}
                </span>
              </div>
            );
          }
          return 'Vendor not found';
        },
      },


      {
        Header: 'Date', accessor: 'date', Cell: ({ value }) => formatDateTime(value),
      },
      {
        Header: 'Actions', accessor: 'actions',
        Cell: ({ row }) => (
          <div>
            <button className='button' onClick={() => openAddOutflowForm(row.original)}>Ins.Out</button>
            <button className='button' onClick={() => handleEdit(row.original)}>Edit</button>
            <button className='button' onClick={() => handleDelete(row.original)}>Delete</button>
            <button className='button' onClick={() => handleVerification(row.original)}>Verification</button>
            <button className='button' onClick={() => handleOrder(row.original)}>Order</button>
          </div>
        ),
      },
      {
        Header: 'Comments',
        accessor: 'comments',
        Cell: ({ cell }) => (
          <div className="comment-cell">
            {cell.value}
          </div>
        ),
      },
      {
        Header: 'Verification Date',
        accessor: 'verification',
        Cell: ({ value }) => (value ? formatDateTime(value) : ''), // Check for empty verification date
      },
    ],
    [handleEdit, handleDelete, handleVerification, locations, materials, vendors, materialchanges, openAddOutflowForm, handleOrder, remainingQuantities]
  );

  function formatDateTime(dateTimeString) {
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Europe/Athens', // Set to Athens time zone for Greece
    };

    const dateTime = new Date(dateTimeString);
    const formattedDateTime = dateTime.toLocaleString('el-GR', options);
    return formattedDateTime;
  }

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    state: { pageIndex, pageSize },
    gotoPage,
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage,
    setPageSize,
  } = useTable(
    {
      columns,
      data: filteredData,
      locations,
      materials,
      initialState: {
        pageIndex: 0,
        pageSize: 10,
        sortBy: [
          {
            id: 'id', // ID column accessor
            desc: true, // Sorting in descending order
          },
        ],
      },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );


  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }


  return (
    <div className='container'>
      <AddPurchase handleAdd={handleAdd} locations={locations} vendors={vendors} setVendors={setVendors} materials={materials} setMaterials={setMaterials} apiBaseUrl={apiBaseUrl} />

      <div className="search">
        <input
          value={globalFilterOne}
          onChange={e => setGlobalFilterOne(e.target.value)}
          placeholder="Global Filter 1"
        />
        <input
          value={globalFilterTwo}
          onChange={e => setGlobalFilterTwo(e.target.value)}
          placeholder="Global Filter 2"
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
                {editingPurchase && editingPurchase.id === row.original.id && (
                  <tr>
                    <td colSpan={columns.length}>
                      <EditPurchase 
                      purchase={editingPurchase} 
                      handleUpdate={handleUpdate} 
                      vendors={vendors} 
                      locations={locations} 
                      materials={materials} 
                      purchases={purchases} 
                      setPurchases={setPurchases} 
                      handleCancel={handleCancel} 
                      apiBaseUrl={apiBaseUrl} />
                    </td>
                  </tr>
                )}
                {verPurchase && verPurchase.id === row.original.id && (
                  <tr>
                    <td colSpan={columns.length}>
                      <PurchaseVerification 
                      purchase={verPurchase} 
                      handleCancel={handleCancel} 
                      handleUpdate={handleUpdate} />
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
            {pageIndex + 1} of {Math.ceil(purchases.length / pageSize)}
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
      {showAddInstOutflowForm && selectedOutflowRow && (
        <div className="overlay">
          <div className="popup">
            <span className="close-popup" onClick={() => setShowAddInstOutflowForm(false)}>
              &times;
            </span>
            <InstOut
              handleAddInstOutflow={handleAddInstOutflow}
              locations={locations}
              materials={materials}
              employees={employees}
              projects={projects}
              outflows={outflows}
              purchases={purchases}
              apiBaseUrl={apiBaseUrl}
              setProjects={setProjects}
              instOutflow={selectedOutflowRow}
            />
          </div>
        </div>
      )}
      {showVendPurc && (
        <div className="overlay">
          <div className="popup">
            <span className="close-popup" onClick={() => setShowVendPurc(false)}>
              &times;
            </span>
            <VendPurc
              rowdata={rowdata}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              handleCancel={handleCancel}
              materials={materials}
              locations={locations}
              employees={employees}
              projects={projects}
              outflows={outflows}
              purchases={purchases}
              handleOrder={handleOrder}
              formatDateTime={formatDateTime} />
          </div>
        </div>
      )}

{showMatPurc && (
        <div className="overlay">
          <div className="popup">
            <span className="close-popup" onClick={() => setShowMatPurc(false)}>
              &times;
            </span>
            <MatPurch
              rowdata={rowdata}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              handleCancel={handleCancel}
              materials={materials}
              locations={locations}
              employees={employees}
              projects={projects}
              outflows={outflows}
              purchases={purchases}
              handleOrder={handleOrder}
              formatDateTime={formatDateTime} />
          </div>
        </div>
      )}

    </div>
  );
};

export default PurchaseFunc;

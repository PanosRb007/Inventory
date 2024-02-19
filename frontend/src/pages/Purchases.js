import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import EditPurchase from './EditPurchase.js';
import PurchaseVerification from './PurchaseVerification.js';
import './PurchaseFunc.css';
import AddPurchase from './AddPurchase.js';
import InstOut from './InstOut.js';
import VendPurc from './VendPurc.js';


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
  const [rowdata, setRowdata] = useState([]);

  const openAddOutflowForm = useCallback((row) => {
    setSelectedOutflowRow(row);
    setShowAddInstOutflowForm(true);
  }, []);

  const openVendPurc = (rowd) => {
    setShowVendPurc(true);
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
      const [purchaseData, locationData, materialData, vendorData, materialchangesData, outflowsData, employeesData, projectsData] = await Promise.all([
        fetchAPI(`${apiBaseUrl}/PurchasesAPI`),
        fetchAPI(`${apiBaseUrl}/LocationsAPI`),
        fetchAPI(`${apiBaseUrl}/materiallist`),
        fetchAPI(`${apiBaseUrl}/vendors`),
        fetchAPI(`${apiBaseUrl}/materialchangesAPI`),
        fetchAPI(`${apiBaseUrl}/outflowsAPI`),
        fetchAPI(`${apiBaseUrl}/employeesAPI`),
        fetchAPI(`${apiBaseUrl}/projectsAPI`),
      ]);
      setPurchases(purchaseData);
      setLocations(locationData);
      setMaterials(materialData);
      setVendors(vendorData);
      setMaterialchanges(materialchangesData);
      setOutflows(outflowsData);
      setEmployees(employeesData);
      setProjects(projectsData);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAPI, apiBaseUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  console.log('purhases, purchases', purchases);

  const filteredData = useMemo(() => {
    return purchases.filter(row => {
      // Find the location name for the current row
      const location = locations.find(loc => loc.id === row.location);
      const locationName = location ? location.locationname.toLowerCase() : '';

      // Find the vendor name for the current row
      const vendor = vendors.find(v => v.vendorid === row.vendor);
      const vendorName = vendor ? vendor.name.toLowerCase() : '';

      const material = materials.find(m => m.matid === row.materialid);
      const materialName = material ? material.name.toLowerCase() : '';

      // Create a string that includes all the row values, location name, and vendor name
      const rowString = Object.values(row).map(val => String(val).toLowerCase()).join(' ') + ' ' + locationName + ' ' + vendorName+ ' ' + materialName;

      // Check if the row string includes both global filters
      return rowString.includes(globalFilterOne.toLowerCase()) && rowString.includes(globalFilterTwo.toLowerCase());
    });
  }, [purchases, globalFilterOne, globalFilterTwo, locations, vendors, materials]);

  const handleAdd = useCallback(async (newPurchase) => {
    try {
      await fetchAPI(`${apiBaseUrl}/PurchasesAPI`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPurchase),
      });
      fetchData();
    } catch (error) {
      console.error('Error adding purchase:', error.message);
    }
  }, [fetchData, apiBaseUrl, fetchAPI]);


  const handleDelete = useCallback((deletedPurchase) => {

    const isConfirmed = window.confirm('Are you sure you want to delete this purchase?');

    if (isConfirmed) {
      fetchAPI(`${apiBaseUrl}/PurchasesAPI/${deletedPurchase.id}`, {
        method: 'DELETE',
      })
        .then(() => {
          const updatedPurchaseList = purchases.filter((p) => p.id !== deletedPurchase.id);
          setPurchases(updatedPurchaseList);
        })
        .catch((error) => {
          console.log('Error deleting purchase:', error);
        });
    }
  }, [purchases, apiBaseUrl, fetchAPI]);

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

  const handleUpdate = useCallback(async (updatedPurchase) => {
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
    } catch (error) {
      console.error('Error updating the purchase:', error);
    }
  }, [fetchData, apiBaseUrl, fetchAPI]);


  const handleCancel = () => {
    setEditingPurchase(null);
    setVerPurchase(null);
  };

  const handleOrder = useCallback(async (row) => {
    // Extract the necessary details from the row
    const orderData = {
      location_id: row.location,
      material_id: row.materialid,
      vendor_id: row.vendor,
      // Add any other fields that are required for the order
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
  

  const handleAddInstOutflow = useCallback((newOutflow) => {
    fetchAPI(`${apiBaseUrl}/outflowsAPI`, {
      method: 'POST',
      body: JSON.stringify(newOutflow),
    })
    .then((data) => {
   
      setShowAddInstOutflowForm(false);
      console.log('Outflow added successfully', data);
    })
    
      .catch((error) => {
        console.error('Error adding outflow:', error.message);
      });
  }, [ apiBaseUrl, fetchAPI,setShowAddInstOutflowForm]);
  

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
      { Header: 'Material ID', accessor: 'materialid' },
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
          const materialId = row.materialid;
          const lotNumber = row.lotnumber;
          const location = row.location;

          // Filter purchases and outflows for the current row's material ID, lot number, and location
          const filteredPurchases = purchases.filter(purchase =>
            purchase.materialid === materialId &&
            purchase.lotnumber === lotNumber &&
            purchase.location === location
          );
          console.log('Outflows:', outflows);

          const filteredOutflows = outflows.filter(outflow =>
            outflow.materialid === materialId &&
            outflow.lotnumber === lotNumber &&
            outflow.location === location
          );

          // Calculate total quantity (sum of purchases - sum of outflows)
          const totalPurchases = filteredPurchases.reduce((sum, purchase) => sum + parseFloat(purchase.quantity), 0);
          const totalOutflows = filteredOutflows.reduce((sum, outflow) => sum + parseFloat(outflow.quantity), 0);
          const remainingQuantity = (totalPurchases - totalOutflows).toFixed(2);

          return (
            <span style={{ color: 'red' }}>{remainingQuantity}</span>
          );
        }
      },
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
                style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }} onClick={() => openVendPurc(row.original)}>
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
        Header: 'Verification Date', accessor: 'verification', Cell: ({ value }) => formatDateTime(value),
      },
    ],
    [handleEdit, handleDelete, handleVerification , outflows, purchases, locations, materials, vendors, materialchanges,openAddOutflowForm, handleOrder]
  );

  function formatDateTime(dateTimeString) {
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
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
                      <EditPurchase purchase={editingPurchase} handleUpdate={handleUpdate} vendors={vendors} locations={locations} materials={materials} purchases={purchases} setPurchases={setPurchases} handleCancel={handleCancel} apiBaseUrl={apiBaseUrl} />
                    </td>
                  </tr>
                )}
                {verPurchase && verPurchase.id === row.original.id && (
                  <tr>
                    <td colSpan={columns.length}>
                      <PurchaseVerification purchase={verPurchase} handleCancel={handleCancel} handleUpdate={handleUpdate} />
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



    </div>
  );
};

export default PurchaseFunc;

import React, { useEffect, useState, useCallback } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import EditPurchase from './EditPurchase.js';
import './PurchaseFunc.css';
import AddPurchase from './AddPurchase.js';

const PurchaseFunc = ({apiBaseUrl}) => {
  const [purchases, setPurchases] = useState([]);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [locations, setLocations] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [materialchanges, setMaterialchanges] = useState([]);
  const [error, setError] = useState(null);

  
  const [isLoading, setIsLoading] = useState(true); // New state to track loading status

  const fetchData = useCallback(async () => {
    const authToken = localStorage.getItem('authToken');
    console.log('tokenprefetch',authToken);
    const fetchAPI = async (url) => {
      console.log('Fetching data...');
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${authToken}`, // Include the token in the request headers
        },
      });
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`Error fetching ${url}`);
      }
      return response.json();
    };
  
    try {
      const purchaseData = await fetchAPI(`${apiBaseUrl}/PurchasesAPI`);
      setPurchases(purchaseData);
    } catch (error) {
      console.log('Error fetching purchases:', error);
      setError(error.message);
    }
  
    try {
      const locationData = await fetchAPI(`${apiBaseUrl}/LocationsAPI`);
      setLocations(locationData);
    } catch (error) {
      console.log('Error fetching locations:', error);
      setError(error.message);
    }
  
    try {
      const materialData = await fetchAPI(`${apiBaseUrl}/materiallist`);
      setMaterials(materialData);
    } catch (error) {
      console.log('Error fetching materials:', error);
      setError(error.message);
    }
  
    try {
      const vendorData = await fetchAPI(`${apiBaseUrl}/vendors`);
      setVendors(vendorData);
    } catch (error) {
      console.log('Error fetching vendors:', error);
      setError(error.message);
    }
  
    try {
      const materialchangesData = await fetchAPI(`${apiBaseUrl}/materialchangesAPI`);
      setMaterialchanges(materialchangesData);
    } catch (error) {
      console.log('Error fetching material changes:', error);
      setError(error.message);
    }
  
    setIsLoading(false);
  }, [apiBaseUrl]);
  

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  console.log('purhases, purchases', purchases);

  const handleAdd = useCallback((newPurchase) => {
    
    // Make a POST request to add the new purchase
    fetch(`${apiBaseUrl}/PurchasesAPI`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newPurchase),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Error adding purchase');
        }
      })
      .then(() => {
        fetchData();
      })  
      .catch((error) => {
        console.log('Error adding purchase:', error);
      });
  }, [fetchData, apiBaseUrl]);

  const handleDelete = useCallback((deletedPurchase) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this purchase?');
  
    if (isConfirmed) {
      fetch(`${apiBaseUrl}/PurchasesAPI/${deletedPurchase.id}`, {
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
  }, [purchases, apiBaseUrl]);

  const handleEdit = useCallback((purchase) => {
    if (editingPurchase && editingPurchase.id === purchase.id) {
      alert('Purchase is already being edited.');
      return;
    }

    setEditingPurchase(purchase);
  }, [editingPurchase]);

  const handleUpdate = useCallback((updatedPurchase) => {
    fetch(`${apiBaseUrl}/PurchasesAPI/${updatedPurchase.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedPurchase),
    })
      .then((response) => response.json())
      .then(() => {
        fetchData();
        setEditingPurchase(null);
      })
      .catch((error) => {
        console.error('Error updating the purchase:', error);
      });
  }, [fetchData, apiBaseUrl]);

  const handleCancel = () => {
    setEditingPurchase(null);
  };

  
 
  const columns = React.useMemo(
    () => [
      { Header: 'ID', accessor: 'id' },
      {
        Header: 'Location',
        accessor: (value) => {
          const locationnm  = locations.find((loc) => loc.id ===  value.location);
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
        accessor: (value) => {
          const vendor = vendors.find((v) => v.vendorid === value.vendor);
          return vendor ? (
            <span title={`Vendor Name: ${vendor.name}\nField: ${vendor.field}\neMail: ${vendor.mail}\nTelephone: ${vendor.tel}\nContact Name: ${vendor.contactname}\n`}>
              <a href={`${apiBaseUrl}/vendors/${vendor.vendorid}`} target="_blank" rel="noopener noreferrer">
                {vendor.name}
              </a>
            </span>
          ) : (
            'Vendor not found'
          );
        },
      },
      { Header: 'Date', accessor: 'date' ,Cell: ({ value }) => formatDateTime(value), 
      },
      { Header: 'Actions', accessor: 'actions',
        Cell: ({ row }) => (
          <div>
            <button onClick={() => handleEdit(row.original)}>Edit</button>
            <button onClick={() => handleDelete(row.original)}>Delete</button>
          </div>
        ),
      },
    ],
    [handleEdit, handleDelete, locations, materials, vendors, materialchanges, apiBaseUrl]
  );

  function formatDateTime(dateTimeString) {
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC', // Ensure the input date is interpreted as UTC
    };
  
      const dateTime = new Date(dateTimeString);
      const formattedDateTime = dateTime.toLocaleString('en-GB', options);
    return formattedDateTime;
  }
  
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
      data: purchases,
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
    <div>
      <AddPurchase handleAdd={handleAdd} locations={locations} vendors={vendors} setVendors={setVendors} materials={materials} setMaterials={setMaterials} apiBaseUrl={apiBaseUrl}/>

      <div className="search">
        <input
          type="text"
          value={globalFilter || ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search..."
        />
      </div>
      <table {...getTableProps()} className="purchase-table">
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
                      <EditPurchase purchase={editingPurchase} handleUpdate={handleUpdate} vendors={vendors} locations={locations} materials={materials} purchases={purchases} setPurchases={setPurchases} handleCancel={handleCancel} apiBaseUrl={apiBaseUrl}/>
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
    </div>
  );
};

export default PurchaseFunc;

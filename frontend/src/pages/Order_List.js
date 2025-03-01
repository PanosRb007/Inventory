import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import EditOrder from './EditOrder';
import AddPurchase from './AddPurchOrder';

const OrderList = ({ apiBaseUrl }) => {
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [locations, setLocations] = useState([]);
  const [outflows, setOutflows] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [editedOrder, setEditedOrder] = useState([]);
  const [latestdata, setLatestdata] = useState([]);
  const [orderInflow, setOrderInflow] = useState(null);
  const [showAddInflowForm, setShowAddInflowForm] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const orderlistr = await fetchAPI(`${apiBaseUrl}/order_listAPI`);
      const materialsr = await fetchAPI(`${apiBaseUrl}/materiallist`);
      const vendorsr = await fetchAPI(`${apiBaseUrl}/vendors`);
      const locr = await fetchAPI(`${apiBaseUrl}/LocationsAPI`);
      const outr = await fetchAPI(`${apiBaseUrl}/outflowsAPI`);
      const purr = await fetchAPI(`${apiBaseUrl}/PurchasesAPI`);
      const latestdata = await fetchAPI(`${apiBaseUrl}/materialchangesAPI`);
      setOrders(orderlistr);
      setMaterials(materialsr);
      setVendors(vendorsr);
      setLocations(locr);
      setOutflows(outr);
      setPurchases(purr);
      setLatestdata(latestdata);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, fetchAPI]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = useCallback((deletedOrder) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this order?');

    if (isConfirmed) {
      fetchAPI(`${apiBaseUrl}/order_listAPI/${deletedOrder.order_list_id}`, {
        method: 'DELETE',
      })
        .then(() => {
          const updatedOrderList = orders.filter((p) => p.order_list_id !== deletedOrder.order_list_id);
          setOrders(updatedOrderList);
        })
        .catch((error) => {
          console.log('Error deleting order:', error);
        });
    }
  }, [apiBaseUrl, fetchAPI, orders]);

  const handleEdit = useCallback((order) => {
    setEditedOrder(order);
  }, []);

  const handleCancel = useCallback(() => {
    setEditedOrder(null);
  }, []);

  const handleUpdate = useCallback(async (updatedOrder, updatedStatus) => {
    try {
      await fetchAPI(`${apiBaseUrl}/order_listAPI/${updatedOrder.order_list_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...updatedOrder,
          status: updatedStatus,
        }),
      });
      fetchData();
    } catch (error) {
      console.error('Error updating the orders:', error);
    } finally {
      setEditedOrder(null);
    }
  }, [fetchData, apiBaseUrl, fetchAPI]);

  const handleAddInflow = useCallback((order) => {
    setOrderInflow(order);
    setShowAddInflowForm(true);
  }, []);

  const handleAdd = useCallback(async (newPurchase) => {
    console.log('finalpurch',newPurchase);
    try {
      // Check if newPurchase includes order_list_id and extract it
      const { order_list_id, ...purchaseDetails } = newPurchase;
  
      console.log('order_list_id:', order_list_id); // Debug to ensure order_list_id is received
  
      // Proceed to add the new purchase
      await fetchAPI(`${apiBaseUrl}/PurchasesAPI`, {
        method: 'POST',
        body: JSON.stringify(purchaseDetails),
      });
  
        await fetchAPI(`${apiBaseUrl}/order_listAPI/${order_list_id}`, {
          method: 'DELETE',
        });
        alert('Inflow Added and Order Deleted successfully.');
  
      // Fetch updated data and close the AddInflowForm
      fetchData();
      setShowAddInflowForm(false);
    } catch (error) {
      console.error('Error adding purchase:', error);
    }
  }, [fetchData, apiBaseUrl, fetchAPI, setShowAddInflowForm]);
  
  

  const columns = useMemo(
    () => [
      { Header: 'Order ID', accessor: 'order_list_id' },
      {
        Header: 'Location',
        accessor: (value) => {
          const locationnm = locations.find((loc) => loc.id === value.location_id);
          return locationnm ? locationnm.locationname : 'location not found';
        },
      },
      { Header: 'Material', accessor: 'material_id' },
      {
        Header: 'Material Name',
        accessor: (row) => {
          const matnm = materials.find((m) => m.matid === row.material_id);
          return matnm ? matnm.name : 'material not found';
        },
      },
      { Header: 'Order Quantity', accessor: 'quantity' },
      {
        Header: 'Unit of Measure',
        accessor: (row) => {
          const material = materials.find((m) => m.matid === row.material_id);
          return material ? material.unit_of_measure : 'Unit not found';
        },
      },
      {
        Header: 'Price / UoM',
        accessor: (row) => {
          if (row.unitprice > 0) {
            return row.unitprice;
          } else {
            const latestRecord = latestdata.filter((l) => l.material_id === row.material_id)
              .reduce((prev, current) => (prev.change_id > current.change_id) ? prev : current, {});
            return latestRecord ? latestRecord.price : 'Price not found';
          }
        },
      },
      {
        Header: 'Remaining Quantity',
        accessor: (row) => {
          const materialId = row.material_id;
          const location = row.location_id;
          const filteredPurchases = purchases.filter(purchase =>
            purchase.materialid === materialId &&
            purchase.location === location
          );
          const filteredOutflows = outflows.filter(outflow =>
            outflow.materialid === materialId &&
            outflow.location === location
          );
          const totalPurchases = filteredPurchases.reduce((sum, purchase) => sum + parseFloat(purchase.quantity), 0);
          const totalOutflows = filteredOutflows.reduce((sum, outflow) => sum + parseFloat(outflow.quantity), 0);
          const remainingQuantity = totalPurchases - totalOutflows;
          return remainingQuantity.toFixed(2);
        }
      },
      
      {
        Header: 'Vendor',
        accessor: (row) => {
          const vendor = vendors.find((v) => v.vendorid === row.vendor_id);
          return vendor ? vendor.name : 'Vendor not found';
        },
        Cell: ({ value, row }) => {
          const vendor = vendors.find((v) => v.vendorid === row.original.vendor_id);
          if (vendor) {
            const tooltipContent = `Vendor Name: ${vendor.name}\nField: ${vendor.field}\neMail: ${vendor.mail}\nTelephone: ${vendor.tel}\nContact Name: ${vendor.contactname}`;
            return (
              <span title={tooltipContent}>
                {value}
              </span>
            );
          }
          return 'Vendor not found';
        },
      },
      { Header: 'Comments', accessor: 'comments' },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ row }) => {
          const statusValue = row.original.status.data[0];
          return (
            <label>
              check if ordered:
              <input
                type="checkbox"
                checked={statusValue === 1}
                onChange={() => handleUpdate(row.original, statusValue === 1 ? 0 : 1)}
              />
            </label>
          );
        },
      },
      {
        Header: 'Actions',
        Cell: ({ row }) => (
          <div>
            <button onClick={() => { handleEdit(row.original); console.log(row.original); }}>Edit</button>
            <button onClick={() => handleDelete(row.original)}>Delete</button>
            {row.original.status.data[0] === 1 && <button onClick={() => handleAddInflow(row.original)}>Add Inflow</button>}
          </div>
        ),
      },
    ],
    [locations, materials, latestdata, vendors, outflows, purchases, handleEdit, handleUpdate, handleDelete, handleAddInflow]
  );

  const orderStatus0 = useMemo(() => orders.filter(o => o.status.data[0] === 0), [orders]);
  const orderStatus1 = useMemo(() => orders.filter(o => o.status.data[0] === 1), [orders]);

  const tableInstance0 = useTable(
    {
      columns,
      data: orderStatus0,
      initialState: { pageIndex: 0 }
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const tableInstance1 = useTable(
    {
      columns,
      data: orderStatus1,
      initialState: { pageIndex: 0 }
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const renderTable = (tableInstance) => {
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
    } = tableInstance;


    return (
      <div className='container'>

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
                  {editedOrder && editedOrder.order_list_id === row.original.order_list_id && (
                    <tr>
                      <td colSpan={columns.length}>
                        <EditOrder
                          order={editedOrder}
                          handleUpdate={handleUpdate}
                          handleCancel={handleCancel}
                          setMaterials={setMaterials}
                          vendors={vendors}
                          setVendors={setVendors}
                          locations={locations}
                          materials={materials} // Pass the materials prop here
                          latestdata={latestdata}
                          handleAdd={handleAdd}
                           apiBaseUrl={apiBaseUrl}

                        />
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
              {pageIndex + 1} of {Math.ceil(orders.length / pageSize)}
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

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className='container'>
      <h2 className='heading'>Pending Orders</h2>
      {renderTable(tableInstance0)}
      <h2 className='heading'>Completed Orders</h2>
      {renderTable(tableInstance1)}
      {showAddInflowForm && (
        <div className="overlay">
          <div className="popup">
            <span className="close-popup" onClick={() => setShowAddInflowForm(false)}>
              &times;
            </span>
            <AddPurchase
              order={orderInflow}
              handleClose={() => setShowAddInflowForm(false)}
              materials={materials}
              locations={locations}
              vendors={vendors}
              handleAdd={handleAdd}
              setMaterials={setMaterials}
              setVendors={setVendors}
              apiBaseUrl={apiBaseUrl}

            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;

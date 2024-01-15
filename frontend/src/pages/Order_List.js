// OrderList.js
import React, { useState,useCallback, useEffect } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';

const OrderList = ({ apiBaseUrl }) => {
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [material_changes, setMaterial_Changes] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [locations, setLocations] = useState([]);
  const [outflows, setOutflows] = useState([]);
  const [purchases, setPurchases] = useState([]);  
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

  console.log(locations);



  useEffect(() => {
    const fetchData = async () => {
      try {
        const orderlistr = await fetchAPI(`${apiBaseUrl}/order_listAPI`);
        const materialsr = await fetchAPI(`${apiBaseUrl}/materiallist`);
        const mat_chr = await fetchAPI(`${apiBaseUrl}/materialchangesAPI`);
        const vendorsr = await fetchAPI(`${apiBaseUrl}/vendors`);
        const locr = await fetchAPI(`${apiBaseUrl}/LocationsAPI`);
        const outr = await fetchAPI(`${apiBaseUrl}/outflowsAPI`);
        const purr = await fetchAPI(`${apiBaseUrl}/PurchasesAPI`);
        setOrders(orderlistr);
        setMaterials(materialsr);
        setMaterial_Changes(mat_chr);
        setVendors(vendorsr);
        setLocations(locr);
        setOutflows(outr);
        setPurchases(purr);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [apiBaseUrl, fetchAPI]);

  console.log(orders);

  const columns = React.useMemo(
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
      { Header: 'Material Name', 
      accessor: (row) => {
        const matnm = materials.find((m) => m.matid === row.material_id);
        return matnm ? matnm.name : 'material not found';
      },
    },
      { Header: 'Order Quantity', accessor: 'quantity' },
      {
        Header: 'Remaining Quantity',
        accessor: (row) => {
          const materialId = row.material_id;
          const location = row.location_id;

          // Filter purchases and outflows for the current row's material ID, lot number, and location
          const filteredPurchases = purchases.filter(purchase =>
            purchase.materialid === materialId &&
            purchase.location === location
          );

          const filteredOutflows = outflows.filter(outflow =>
            outflow.materialid === materialId &&
            outflow.location === location
          );

          // Calculate total quantity (sum of purchases - sum of outflows)
          const totalPurchases = filteredPurchases.reduce((sum, purchase) => sum + parseFloat(purchase.quantity), 0);
          const totalOutflows = filteredOutflows.reduce((sum, outflow) => sum + parseFloat(outflow.quantity), 0);

          return totalPurchases - totalOutflows;
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

              />
            </label>
          );
        },
      },
      {
        Header: 'Actions',
        Cell: ({ row }) => (
          <div>
            <button >Edit</button>
            <button >Delete</button>
          </div>
        ),
      },
    ],
    [locations, materials, vendors, outflows,purchases]
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
      data: orders,
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

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
export default OrderList;

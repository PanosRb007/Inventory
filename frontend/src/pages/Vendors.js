import React, { useEffect, useState, useCallback } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import AddVendor from './AddVendor.js';
import EditVendor from './EditVendor.js';


const VendorsFunc = ({apiBaseUrl}) => {
  const [editingVendor, setEditingVendor] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // New state to track loading status

  const fetchAPI = useCallback(async (url, options = {}) => {
    const authToken = localStorage.getItem('authToken');
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
      const vendorResponse = await fetchAPI(`${apiBaseUrl}/vendors`);
      setVendors(vendorResponse);
      setIsLoading(false);
    } catch (error) {
      console.log('Error fetching data:', error);
      setIsLoading(false);
    }
  }, [apiBaseUrl, fetchAPI]);
  

  useEffect(() => {
    fetchData();
  }, [fetchData, apiBaseUrl,fetchAPI]);

  const handleAddVendor = useCallback((newVendor) => {
    fetchAPI(`${apiBaseUrl}/vendors`, {
      method: 'POST',
      body: JSON.stringify(newVendor),
    })
    .then((data) => {
      setVendors([...vendors, data]); // Assuming the API returns the added vendor
      fetchData();
    })
    .catch((error) => {
      console.log('Error adding vendor:', error);
    });
  }, [vendors, setVendors, fetchData, apiBaseUrl, fetchAPI]);
  


  const handleDelete = useCallback((deletedVendor) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this vendor?');
  
    if (isConfirmed) {
      fetchAPI(`${apiBaseUrl}/vendors/${deletedVendor.vendorid}`, {
        method: 'DELETE',
      })
      .then(() => {
        const updatedVendorList = vendors.filter((v) => v.vendorid !== deletedVendor.vendorid);
        setVendors(updatedVendorList);
      })
      .catch((error) => {
        console.log('Error deleting vendor:', error);
      });
    }
  }, [vendors, apiBaseUrl, fetchAPI]);
  

  const handleEdit = useCallback((vendor) => {
    if (editingVendor && editingVendor.vendorid === vendor.vendorid) {
      alert('Vendor is already being edited.');
      return;
    }

    setEditingVendor(vendor);
  }, [editingVendor]);

  const handleUpdate = useCallback((updatedVendor) => {
    fetchAPI(`${apiBaseUrl}/vendors/${updatedVendor.vendorid}`, {
      method: 'PUT',
      body: JSON.stringify(updatedVendor),
    })
    .then(() => {
      fetchData();
      setEditingVendor(null);
    })
    .catch((error) => {
      console.error('Error updating the vendor:', error);
    });
  }, [fetchData, apiBaseUrl, fetchAPI]);
  
  const columns = React.useMemo(
    () => [
      { Header: 'ID', accessor: 'vendorid' },
      { Header: 'Name', accessor: 'name' },
      { Header: 'Field', accessor: 'field' },
      { Header: 'Mail', accessor: 'mail' },
      { Header: 'Telephone', accessor: 'tel' },
      { Header: 'Contact Name', accessor: 'contactname' },
      { Header: 'Actions', accessor: 'actions',
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
      data: vendors,
      initialState: {
        pageIndex: 0,
        pageSize: 10,
        sortBy: [
          {
            id: 'vendorid', // ID column accessor
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

  return (
    <div>
      <AddVendor handleAddVendor={handleAddVendor} />

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
                {editingVendor && editingVendor.vendorid === row.original.vendorid && (
                  <tr>
                    <td colSpan={columns.length}>
                      <EditVendor vendor={editingVendor} handleUpdate={handleUpdate} />
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
            {pageIndex + 1} of {Math.ceil(vendors.length / pageSize)}
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

export default VendorsFunc;

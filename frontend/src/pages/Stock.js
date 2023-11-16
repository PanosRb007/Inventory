import React, { useState, useEffect, useCallback } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import './PurchaseFunc.css';


const Stocks = ({apiBaseUrl}) => {

  const [materials, setMaterials] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [locations, setLocations] = useState([]);
  const [outflows, setOutflows] = useState([]);
  const [selectedLocantion, setSelectedLocation] = useState('');
  const [stock, setStock] = useState([]);

  const fetchAPI = useCallback(async (url, options = {}) => {
    const authToken = localStorage.getItem('authToken');
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


  useEffect(() => {
  const fetchData = async () => {
    try {
      const [materialResponse, purchaseResponse, locationResponse, outflowsResponse] = await Promise.all([
        fetchAPI(`${apiBaseUrl}/materiallist`),
        fetchAPI(`${apiBaseUrl}/PurchasesAPI`),
        fetchAPI(`${apiBaseUrl}/LocationsAPI`),
        fetchAPI(`${apiBaseUrl}/outflowsAPI`),
      ]);

      // Filter and process stock based on extras and location
      const processedStock = purchaseResponse.reduce((acc, purchase) => {
        if (purchase.location === parseInt(selectedLocantion)) {
          const material = materialResponse.find(mat => mat.matid === purchase.materialid);
          if (material) {
            if (material.extras === 0) {
              // For extras === 0, include only if it's not already included
              if (!acc.some(item => item.materialid === purchase.materialid)) {
                acc.push(purchase);
              }
            } else {
              // For extras === 1, include all
              acc.push(purchase);
            }
          }
        }
        return acc;
      }, []);

      setMaterials(materialResponse);
      setPurchases(purchaseResponse);
      setLocations(locationResponse);
      setOutflows(outflowsResponse);
      setStock(processedStock);
    } catch (error) {
      console.log('Error fetching data:', error);
    }
  };
  fetchData();
}, [apiBaseUrl, fetchAPI, selectedLocantion]);


  console.log("purchases", purchases);

  const calculateTotalQuantity = React.useCallback((materialId) => {
    const selectedMaterial = materials.find((mat) => mat.matid === materialId && mat.extras === 0);
  
    if (selectedMaterial) {
      return purchases.reduce((total, purchase) => {
        if (purchase.materialid === materialId) {
          return total + (parseFloat(purchase.quantity) * parseFloat(purchase.price));
        }
        return total;
      }, 0);
    }
  
    return 0; // Return a default value if no matching material is found
  }, [materials, purchases]);
  
  
  const uniqueMaterialIds = [...new Set(stock.map(item => item.materialid))];

  console.log('uniqueMaterialIds', uniqueMaterialIds);


  const handleChange = (e) => {
    const { value } = e.target;
    setSelectedLocation(value)
  };
  
  const columns = React.useMemo(
    () => [
      
      { Header: 'ID', accessor: 'id' },
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
        Header: 'Average Cost',
        accessor: (row) => calculateTotalQuantity(row.materialid),
      },

    ],
    [ materials, calculateTotalQuantity]
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
      data: stock,
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


  return (
    <div>
      <div>
          <label>Location:</label>
          <select name="location" value={selectedLocantion} onChange={handleChange} required>
            <option value="">Select a location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.locationname}
              </option>
            ))}
          </select>
     </div>

      <div className="search">
      <input
        type="text"
        value={globalFilter || ''}
        onChange={(e) => {
          console.log('Global filter value:', e.target.value); // Add this line
          setGlobalFilter(e.target.value);
        }}
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
            {pageIndex + 1} of {Math.ceil(outflows.length / pageSize)}
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

export default Stocks;

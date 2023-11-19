import React, { useState, useEffect, useCallback } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import './PurchaseFunc.css';


const Stocks = ({apiBaseUrl}) => {

  const [materials, setMaterials] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [locations, setLocations] = useState([]);
  const [outflows, setOutflows] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [stock, setStock] = useState([]);

  const fetchAPI = useCallback(async (url, options = {}) => {
    const authToken = sessionStorage.getItem('authToken');
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
        if (purchase.location === parseInt(selectedLocation)) {
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
}, [apiBaseUrl, fetchAPI, selectedLocation]);


  console.log("purchases", purchases);
  console.log("outflows", outflows);


  const calculateTotalCost = useCallback((materialId, location, lotNumber) => {
    let totalCost = 0;
  
    // Calculate cost from purchases
    const filteredPurchases = purchases.filter(purchase => 
      purchase.materialid === materialId && purchase.location === location && purchase.lotnumber === lotNumber
    );
    filteredPurchases.forEach(purchase => {
      totalCost += parseFloat(purchase.quantity) * parseFloat(purchase.price);
    });
  
    // Calculate cost reduction from outflows using FIFO
    let remainingOutflow = outflows
      .filter(outflow => outflow.materialid === materialId && outflow.location === location && outflow.lotnumber === lotNumber)
      .reduce((total, outflow) => total + parseFloat(outflow.quantity), 0);
  
    for (const purchase of filteredPurchases) {
      if (remainingOutflow <= 0) break;
      const availableQuantity = parseFloat(purchase.quantity);
      const usedQuantity = Math.min(availableQuantity, remainingOutflow);
      totalCost -= usedQuantity * parseFloat(purchase.price);
      remainingOutflow -= usedQuantity;
    }
  
    return totalCost;
  }, [purchases, outflows]);
  
  
  
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
      {
  Header: 'Quantity',
  accessor: (row) => {
    const materialId = row.materialid;
    const lotNumber = row.lotnumber;
    const location = parseInt(selectedLocation);

    // Filter purchases and outflows for the current row's material ID, lot number, and location
    const filteredPurchases = purchases.filter(purchase => 
      purchase.materialid === materialId && 
      purchase.lotnumber === lotNumber && 
      purchase.location === location
    );

    const filteredOutflows = outflows.filter(outflow => 
      outflow.materialid === materialId && 
      outflow.lotnumber === lotNumber && 
      outflow.location === location
    );

    // Calculate total quantity (sum of purchases - sum of outflows)
    const totalPurchases = filteredPurchases.reduce((sum, purchase) => sum + parseFloat(purchase.quantity), 0);
    const totalOutflows = filteredOutflows.reduce((sum, outflow) => sum + parseFloat(outflow.quantity), 0);

    return totalPurchases - totalOutflows;
  }
},

{
  Header: 'Average Cost',
  accessor: (row) => calculateTotalCost(row.materialid, parseInt(selectedLocation), row.lotnumber),
},


    ],
    [ materials, calculateTotalCost, outflows, purchases, selectedLocation]
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
    <div className='container'>
      <div>
          <label>Location:</label>
          <select name="location" value={selectedLocation} onChange={handleChange} required>
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

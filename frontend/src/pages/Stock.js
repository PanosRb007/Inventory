import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import './PurchaseFunc.css';


const Stocks = ({ apiBaseUrl }) => {

  const [materials, setMaterials] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [locations, setLocations] = useState([]);
  const [outflows, setOutflows] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [stock, setStock] = useState([]);
  const [globalFilterOne, setGlobalFilterOne] = useState('');
  const [globalFilterTwo, setGlobalFilterTwo] = useState('');

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

  const filteredData = useMemo(() => {
    const calculatedData = stock.map((row) => {
      const materialId = row.materialid;
      const lotNumber = row.lotnumber;
      const location = parseInt(selectedLocation); // Ενημερωμένο location
  
      const filteredPurchases = purchases.filter(purchase =>
        purchase.materialid === materialId &&
        purchase.lotnumber === lotNumber &&
        purchase.location === location // Φιλτράρισμα βάσει location
      );
  
      const filteredOutflows = outflows.filter(outflow =>
        outflow.materialid === materialId &&
        outflow.lotnumber === lotNumber &&
        outflow.location === location // Φιλτράρισμα βάσει location
      );
  
      const totalPurchases = filteredPurchases.reduce((sum, purchase) => sum + parseFloat(purchase.quantity), 0);
      const totalOutflows = filteredOutflows.reduce((sum, outflow) => sum + parseFloat(outflow.quantity), 0);
  
      const quantity = (totalPurchases - totalOutflows).toFixed(2);
  
      return {
        ...row,
        quantity: parseFloat(quantity), // Υπολογισμένο υπόλοιπο
      };
    });
  
    // Φιλτράρισμα γραμμών όπου quantity > 0
    return calculatedData.filter((row) => {
      if (row.quantity <= 0) {
        return false; // Εξαίρεση γραμμών με quantity <= 0
      }
  
      const material = materials.find((m) => m.matid === row.materialid);
      const materialName = material ? material.name.toLowerCase() : '';
      const rowString =
        Object.values(row)
          .map((val) => String(val).toLowerCase())
          .join(' ') + ' ' + materialName;
  
      return (
        rowString.includes(globalFilterOne.toLowerCase()) &&
        rowString.includes(globalFilterTwo.toLowerCase())
      );
    });
  }, [stock, purchases, outflows, selectedLocation, globalFilterOne, globalFilterTwo, materials]);
  


  const calculateTotalCost = useCallback((materialId, location, lotNumber, width) => {
    let totalCost = 0;
  
    // 1. Φιλτράρισμα Αγορών
    const filteredPurchases = purchases.filter(purchase =>
      purchase.materialid === materialId && purchase.location === location && purchase.lotnumber === lotNumber
    );
  
    filteredPurchases.forEach(purchase => {
      const adjustedQuantity = purchase.width ? purchase.quantity * parseFloat(purchase.width) : purchase.quantity;
      totalCost += parseFloat(adjustedQuantity) * parseFloat(purchase.price);
    });
  
    // 2. Φιλτράρισμα Εξόδων
    let remainingOutflow = outflows
      .filter(outflow => outflow.materialid === materialId && outflow.location === location && outflow.lotnumber === lotNumber)
      .reduce((total, outflow) => {
        const adjustedQuantity = outflow.width ? outflow.quantity * parseFloat(outflow.width) : outflow.quantity;
        return total + parseFloat(adjustedQuantity);
      }, 0);
  
    // 3. Υπολογισμός με FIFO
    for (const purchase of filteredPurchases) {
      if (remainingOutflow <= 0) break; // Αν δεν υπάρχει υπόλοιπο για έξοδο, σταματάμε
      const availableQuantity = purchase.width
        ? purchase.quantity * parseFloat(purchase.width)
        : purchase.quantity;
      const usedQuantity = Math.min(availableQuantity, remainingOutflow); // Παίρνουμε όσο χρειάζεται ή όσο είναι διαθέσιμο
      totalCost -= usedQuantity * parseFloat(purchase.price); // Αφαιρούμε το κόστος
      remainingOutflow -= usedQuantity; // Μειώνουμε το υπόλοιπο των εξόδων
    }
  
    return totalCost; // Επιστροφή του τελικού κόστους
  }, [purchases, outflows]);
  

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
      {
        Header: 'Material Field', // Προσθήκη Material Field
        accessor: (row) => {
          const material = materials.find((m) => m.matid === row.materialid);
          return material ? material.field : 'Field not available';
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
      
          // Φιλτράρισμα των αγορών και των outflows
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
      
          // Υπολογισμός του συνολικού quantity (αγορές - outflows)
          const totalPurchases = filteredPurchases.reduce((sum, purchase) => sum + parseFloat(purchase.quantity), 0);
          const totalOutflows = filteredOutflows.reduce((sum, outflow) => sum + parseFloat(outflow.quantity), 0);
      
          return (totalPurchases - totalOutflows).toFixed(2); // Επιστροφή με 2 δεκαδικά
        },
        Cell: ({ value }) => `${value}`, // Προβολή με 2 δεκαδικά
      },
      

      {
        Header: 'Average Cost',
        accessor: (row) => {
          const totalCost = calculateTotalCost(row.materialid, parseInt(selectedLocation), row.lotnumber);
          const formattedCost = row.width ? (totalCost * parseFloat(row.width)).toFixed(2) : totalCost.toFixed(2);
          return `${formattedCost} €`;
        },
      },

    ],
    [materials, calculateTotalCost, outflows, purchases, selectedLocation]
  );

  const totalStockCost = useMemo(() => {
    return filteredData.reduce((sum, row) => {
      const totalCost = calculateTotalCost(row.materialid, parseInt(selectedLocation), row.lotnumber);
      return sum + totalCost;
    }, 0);
  }, [filteredData, calculateTotalCost, selectedLocation]);
  
  
  
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


  return (
    <div className='container'>
      <div className='form-group'>
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
          {[10, 25, 2000].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
      <div className="total-cost">
  <strong>Total Inventory Cost:</strong> {totalStockCost.toFixed(2)} €
</div>

    </div>
  );
};

export default Stocks;

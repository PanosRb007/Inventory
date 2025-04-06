import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

import './PurchaseFunc.css';


const Stocks = ({ apiBaseUrl, userRole }) => {

  const [materials, setMaterials] = useState([]);
  const [locations, setLocations] = useState([]);
  const [outflows, setOutflows] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [globalFilterOne, setGlobalFilterOne] = useState('');
  const [globalFilterTwo, setGlobalFilterTwo] = useState('');
  const [testremaining, setTestRem] = useState([]);
  const [materialchanges, setMaterialchanges] = useState([]);

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
    const fetchLocations = async () => {
      try {
        const locationResponse = await fetchAPI(`${apiBaseUrl}/LocationsAPI`);
        setLocations(locationResponse);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    fetchLocations();
  }, [apiBaseUrl, fetchAPI]);



  useEffect(() => {
    const fetchData = async () => {
      if (!selectedLocation) return; // ⛔ Μην συνεχίσεις αν δεν έχει επιλεγεί τοποθεσία

      try {
        const [
          materialResponse,
          outflowsResponse,
          testrem,
          materialchangesData
        ] = await Promise.all([
          fetchAPI(`${apiBaseUrl}/materiallist`),
          fetchAPI(`${apiBaseUrl}/outflowsAPI`),
          fetchAPI(`${apiBaseUrl}/remaining_quantityAPI/${selectedLocation}`), // ✅ εδώ το dynamic call
          fetchAPI(`${apiBaseUrl}/materialchangesAPI`),
        ]);

        setMaterials(materialResponse);

        setOutflows(outflowsResponse);

        setTestRem(testrem.filter(entry => parseFloat(entry.remaining_quantity) > 0));
        // 🔄 πιο μικρό dataset τώρα!
        setMaterialchanges(materialchangesData);

      } catch (error) {
        console.log('Error fetching data:', error);
      }
    };

    fetchData();
  }, [apiBaseUrl, fetchAPI, selectedLocation]);

  const filteredData = useMemo(() => {
    return testremaining.filter(entry => {
      const material = materials.find(m => m.matid === entry.materialid);
      const materialName = material ? material.name.toLowerCase() : '';
      const entryString = `${entry.materialid} ${entry.lotnumber} ${entry.location} ${entry.width} ${materialName}`;
      return (
        entryString.includes(globalFilterOne.toLowerCase()) &&
        entryString.includes(globalFilterTwo.toLowerCase())
      );
    });
  }, [testremaining, globalFilterOne, globalFilterTwo, materials]);

  const exportToExcel = () => {
    const parseWidth = (w) => {
      const parsed = parseFloat(w);
      return isNaN(parsed) || parsed === -1 ? 1 : parsed;
    };

    const dataToExport = filteredData.map(row => {
      const material = materials.find(m => m.matid === row.materialid);
      const entry = testremaining.find(entry =>
        entry.materialid === row.materialid &&
        entry.location === row.location &&
        (
          entry.lotnumber === row.lotnumber ||
          (!entry.lotnumber && (!row.lotnumber || row.lotnumber === "EMPTY")) ||
          (entry.lotnumber === "EMPTY" && (!row.lotnumber || row.lotnumber === "EMPTY"))
        ) &&
        parseFloat(entry.width || -1) === parseFloat(row.width || -1)
      );

      const quantity = entry?.remaining_quantity ?? 0;
      const width = parseWidth(row.width);
      const price = materialchanges
        .filter(mc =>
          mc.material_id === row.materialid &&
          (mc.location === row.location || mc.location === null)
        )
        .sort((a, b) => new Date(b.change_date) - new Date(a.change_date))[0]?.price ?? 0;
      const cost = quantity * width * price;

      return {
        'Material ID': row.materialid,
        'Material Name': material?.name ?? '',
        'Field': material?.field ?? '',
        'Width': row.width,
        'Lot Number': row.lotnumber,
        'Quantity': quantity,
        'Latest Price (€)': parseFloat(price).toFixed(2),
        'Total Cost (€)': cost.toFixed(2),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const file = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(file, `Inventory_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };


  /*const filteredData = useMemo(() => {
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
  */


  /*const calculateTotalCost = useCallback((materialId, location, lotNumber, width) => {
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
  }, [purchases, outflows]);*/


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
      {
        Header: 'Width',
        accessor: 'width',
        Cell: ({ value }) => (parseFloat(value) === -1 ? '' : value),
      },

      {
        Header: 'Lot No',
        accessor: 'lotnumber',
        Cell: ({ value }) => (value === 'EMPTY' ? '' : value),
      },

      {
        Header: 'Quantity',
        accessor: (row) => {
          const parseWidth = (w) => isNaN(parseFloat(w)) || parseFloat(w) === -1 ? -1 : parseFloat(w);
          const rowWidth = parseWidth(row.width);

          const entry = testremaining.find((entry) =>
            entry.materialid === row.materialid &&
            entry.location === row.location &&
            (
              entry.lotnumber === row.lotnumber ||
              (!entry.lotnumber && (!row.lotnumber || row.lotnumber === "EMPTY")) ||
              (entry.lotnumber === "EMPTY" && (!row.lotnumber || row.lotnumber === "EMPTY"))
            ) &&
            parseFloat(entry.width || -1) === rowWidth
          );

          return entry && !isNaN(parseFloat(entry.remaining_quantity))
            ? parseFloat(entry.remaining_quantity)
            : 0;
        },
        Cell: ({ value }) => {
          return (
            <span style={{ color: value === 0 ? 'gray' : 'black' }}>
              {value.toFixed(2)}
            </span>
          );
        },
        sortType: 'basic'
      },

      {
        Header: 'Latest Price',
        accessor: (row) => {
          const matchingPrices = materialchanges
            .filter(mc =>
              mc.material_id === row.materialid &&
              (mc.location === row.location || mc.location === null)
            )
            .sort((a, b) => new Date(b.change_date) - new Date(a.change_date));

          const latestPrice = matchingPrices[0]?.price ?? 0;
          return parseFloat(latestPrice);
        },
        Cell: ({ value }) => (
          <span style={{ color: 'blue' }}>
            {value.toFixed(2)} €
          </span>
        ),
        sortType: 'basic'
      },


      /*{
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
      },*/
      {
        Header: 'Latest Price Cost',
        accessor: (row) => {
          // Υπολογισμός αριθμητικής τιμής (χωρίς JSX εδώ)
          const parseWidth = (w) => isNaN(parseFloat(w)) || parseFloat(w) === -1 ? 1 : parseFloat(w);
          const rowWidth = parseWidth(row.width);

          const entry = testremaining.find((entry) =>
            entry.materialid === row.materialid &&
            entry.location === row.location &&
            (
              entry.lotnumber === row.lotnumber ||
              (!entry.lotnumber && (!row.lotnumber || row.lotnumber === "EMPTY")) ||
              (entry.lotnumber === "EMPTY" && (!row.lotnumber || row.lotnumber === "EMPTY"))
            ) &&
            parseFloat(entry.width || -1) === parseFloat(row.width || -1)
          );

          if (!entry || isNaN(parseFloat(entry.remaining_quantity))) return 0;

          const remainingQty = parseFloat(entry.remaining_quantity);

          const matchingPrices = materialchanges
            .filter(mc =>
              mc.material_id === row.materialid &&
              (mc.location === row.location || mc.location === null)
            )
            .sort((a, b) => new Date(b.change_date) - new Date(a.change_date));

          const latestPrice = matchingPrices[0]?.price ?? 0;

          return remainingQty * rowWidth * parseFloat(latestPrice); // αριθμητική τιμή
        },
        Cell: ({ value, row }) => {
          const rowData = row.original;
          const parseWidth = (w) => isNaN(parseFloat(w)) || parseFloat(w) === -1 ? 1 : parseFloat(w);
          const rowWidth = parseWidth(rowData.width);

          const entry = testremaining.find((entry) =>
            entry.materialid === rowData.materialid &&
            entry.location === rowData.location &&
            (
              entry.lotnumber === rowData.lotnumber ||
              (!entry.lotnumber && (!rowData.lotnumber || rowData.lotnumber === "EMPTY")) ||
              (entry.lotnumber === "EMPTY" && (!rowData.lotnumber || rowData.lotnumber === "EMPTY"))
            ) &&
            parseFloat(entry.width || -1) === parseFloat(rowData.width || -1)
          );

          const remainingQty = entry?.remaining_quantity ?? 0;

          const matchingPrices = materialchanges
            .filter(mc =>
              mc.material_id === rowData.materialid &&
              (mc.location === rowData.location || mc.location === null)
            )
            .sort((a, b) => new Date(b.change_date) - new Date(a.change_date));

          const latestPrice = matchingPrices[0]?.price ?? 0;

          const tooltipText = `${remainingQty} × ${rowWidth} × ${latestPrice} = ${value.toFixed(2)} €`;

          return (
            <span style={{ color: 'red', cursor: 'help' }} title={tooltipText}>
              {value.toFixed(2)} €
            </span>
          );
        },
        sortType: 'basic'
      }
    ],
    [materials, testremaining, materialchanges]
  );

  const totalStockCost = useMemo(() => {
    const parseWidth = (w) => {
      const parsed = parseFloat(w);
      return isNaN(parsed) || parsed === -1 ? 1 : parsed;
    };

    return filteredData.reduce((sum, row) => {
      const rowWidth = parseWidth(row.width);

      const entry = testremaining.find((entry) =>
        entry.materialid === row.materialid &&
        entry.location === row.location &&
        (
          entry.lotnumber === row.lotnumber ||
          (!entry.lotnumber && (!row.lotnumber || row.lotnumber === "EMPTY")) ||
          (entry.lotnumber === "EMPTY" && (!row.lotnumber || row.lotnumber === "EMPTY"))
        ) &&
        parseFloat(entry.width || -1) === parseFloat(row.width || -1)
      );

      if (!entry || isNaN(parseFloat(entry.remaining_quantity))) return sum;

      const remainingQty = parseFloat(entry.remaining_quantity);

      const matchingPrices = materialchanges
        .filter(mc =>
          mc.material_id === row.materialid &&
          (mc.location === row.location || mc.location === null)
        )
        .sort((a, b) => new Date(b.change_date) - new Date(a.change_date));

      const latestPrice = parseFloat(matchingPrices[0]?.price ?? 0);
      const total = remainingQty * rowWidth * latestPrice;

      return sum + total;
    }, 0);
  }, [filteredData, testremaining, materialchanges]);

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
      {userRole === 'Admin' && (
        <>
          <div className="total-cost">
            <strong>Total Inventory Cost:</strong> {totalStockCost.toFixed(2)} €
          </div>

          <button onClick={exportToExcel} className="button" style={{ marginTop: '1rem' }}>
            Export to Excel
          </button>
        </>
      )}

    </div>
  );
};

export default Stocks;

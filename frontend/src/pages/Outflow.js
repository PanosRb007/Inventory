import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import EditOutflow from './EditOutflow.js';
import './PurchaseFunc.css';
import AddOutflow from './AddOutflow.js';
import OutMatQuery from './OutMatQuery.js';

const OutflowFunc = ({ apiBaseUrl, userRole }) => {

  const [materials, setMaterials] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [locations, setLocations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [outflows, setOutflows] = useState([]);
  const [materialchanges, setMaterialchanges] = useState([]);
  const [editingOutflow, setEditingOutflow] = useState(null);
  const [globalFilterOne, setGlobalFilterOne] = useState('');
  const [globalFilterTwo, setGlobalFilterTwo] = useState('');
  const [showOutMatQuery, setShowOutMatQuery] = useState(false);
  const [rowdata, setRowdata] = useState([]);
  const [testremaining, setTestRem] = useState([]);


  const openProjectOutflowTable = useCallback((projectId) => {
    window.open(`/ProjectOutflows?projectId=${projectId}`, '_blank');
  }, []);

  const openOutMatQuery = (rowd) => {
    setShowOutMatQuery(true);
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
      const [materialResponse, purchaseResponse, locationResponse, projectResponse, employeesResponse, outflowsResponse, materialchangesData, testrem] = await Promise.all([
        fetchAPI(`${apiBaseUrl}/materiallist`),
        fetchAPI(`${apiBaseUrl}/PurchasesAPI`),
        fetchAPI(`${apiBaseUrl}/LocationsAPI`),
        fetchAPI(`${apiBaseUrl}/projectsAPI`),
        fetchAPI(`${apiBaseUrl}/employeesAPI`),
        fetchAPI(`${apiBaseUrl}/outflowsAPI`),
        fetchAPI(`${apiBaseUrl}/materialchangesAPI`),
        fetchAPI(`${apiBaseUrl}/remaining_quantityAPI`),
      ]);
  
      setMaterials(materialResponse);
      setPurchases(purchaseResponse);
      setLocations(locationResponse);
      setProjects(projectResponse);
      setEmployees(employeesResponse);
      setOutflows(outflowsResponse);
      setMaterialchanges(materialchangesData);
  
      const processedTestRemaining = testrem.map(item => ({
        ...item,
        width: parseFloat(item.width), // Μετατροπή width σε αριθμό
        location: parseInt(item.location), // Βεβαιωνόμαστε ότι το location είναι αριθμός
        purchase: parseFloat(item.purchase),
        outflow: parseFloat(item.outflow),
        remaining_quantity: parseFloat(item.remaining_quantity)
      }));
  
      setTestRem(processedTestRemaining);
  
    } catch (error) {
      console.log('Error fetching data:', error);
    }
  }, [apiBaseUrl, fetchAPI]); // ✅ Εξαρτήσεις για να μην αλλάζει χωρίς λόγο
  
  // ✅ Τώρα το καλούμε στο useEffect
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // useMemo: Υπολογίζει τις ποσότητες μόνο όταν αλλάζουν purchases ή outflows
  /*const remainingQuantities = useMemo(() => {
    const quantitiesMap = new Map();

    purchases.forEach((purchase) => {
      const key = `${purchase.materialid}-${purchase.lotnumber || 'null'}-${purchase.location}`;
      const current = quantitiesMap.get(key) || { purchases: 0, outflows: 0 };
      current.purchases += parseFloat(purchase.quantity) || 0;
      quantitiesMap.set(key, current);
    });

    outflows.forEach((outflow) => {
      const key = `${outflow.materialid}-${outflow.lotnumber || 'null'}-${outflow.location}`;
      const current = quantitiesMap.get(key) || { purchases: 0, outflows: 0 };
      current.outflows += parseFloat(outflow.quantity) || 0;
      quantitiesMap.set(key, current);
    });

    return quantitiesMap;
  }, [purchases, outflows]); // Υπολογίζει μόνο όταν αλλάζουν purchases ή outflows*/


  console.log('remsssss', testremaining);

  const filteredData = useMemo(() => {
    const lowerCaseFilterOne = globalFilterOne.toLowerCase();
    const lowerCaseFilterTwo = globalFilterTwo.toLowerCase();
  
    return outflows
      .filter(row => {
        // ✅ Εφαρμόζουμε το φίλτρο για graphics
        if (userRole === 'graphics' && row.employee !== 6) return false;
  
        const locationName = locations.find(loc => loc.id === row.location)?.locationname.toLowerCase() || '';
        const employeeName = employees.find(emp => emp.empid === row.employee)?.name.toLowerCase() || '';
        const materialName = materials.find(material => material.matid === row.materialid)?.name.toLowerCase() || '';
        const projectName = projects.find(project => project.prid === row.project)?.name.toLowerCase() || '';
  
        const rowString = `${Object.values(row).join(' ').toLowerCase()} ${locationName} ${employeeName} ${materialName} ${projectName}`;
        return rowString.includes(lowerCaseFilterOne) && rowString.includes(lowerCaseFilterTwo);
      });
  }, [outflows, globalFilterOne, globalFilterTwo, locations, employees, materials, projects, userRole]);
  

  console.log('outflowspurch', purchases);

  const handleAdd = useCallback(async (newOutflow) => {
    console.log('Outflow being sent:', newOutflow);
  
    // ✅ Μετατροπή των "" σε null για quotedItemid και lotnumber
    const sanitizedOutflow = {
      ...newOutflow,
      quantity: parseFloat(newOutflow.quantity).toFixed(2), // ✅ Διασφαλίζει ότι είναι αριθμός
      lotnumber: newOutflow.lotnumber === "" ? null : newOutflow.lotnumber,
      quotedItemid: newOutflow.quotedItemid === "" ? null : newOutflow.quotedItemid,
    };
  
    console.log('Sanitized Outflow:', sanitizedOutflow);
  
    try {
      const response = await fetchAPI(`${apiBaseUrl}/outflowsAPI`, {
        method: 'POST',
        body: JSON.stringify(sanitizedOutflow),
      });
  
      console.log("Server response:", response);
  
      setOutflows((prevOutflows) => [...prevOutflows, response]);
      await fetchData();
    } catch (error) {
      console.error('Error adding outflow:', error);
      alert(`Failed to add outflow: ${error.message}`);
    }
  }, [apiBaseUrl, fetchAPI, setOutflows, fetchData]);
  


  const handleDelete = useCallback((deletedOutflow) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this outflow?');

    if (isConfirmed) {
      fetchAPI(`${apiBaseUrl}/outflowsAPI/${deletedOutflow.outflowid}`, {
        method: 'DELETE',
      })
        .then(() => {
          const updatedOutflowList = outflows.filter((p) => p.outflowid !== deletedOutflow.outflowid);
          setOutflows(updatedOutflowList);
          alert('Outflow is Deleted.');
          return fetchData()
        })
        .catch((error) => {
          console.log('Error deleting outflow:', error);
        });
    }
  }, [outflows, setOutflows, apiBaseUrl, fetchAPI, fetchData]);

  const handleEdit = useCallback((outflow) => {
    if (editingOutflow && editingOutflow.outflowid === outflow.outflowid) {
      alert('Outflow is already being edited.');
      return;
    }

    // Add a console.log statement here to see the original row data
    console.log('Original Row Data:', outflow);

    setEditingOutflow(outflow);
    return fetchData()
  }, [editingOutflow, setEditingOutflow, fetchData]);


  const handleUpdate = useCallback((updatedOutflow) => {
    fetchAPI(`${apiBaseUrl}/outflowsAPI/${updatedOutflow.outflowid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedOutflow),
    })
      .then(() => fetchAPI(`${apiBaseUrl}/outflowsAPI`))
      .then((updatedOutflows) => {
        setOutflows(updatedOutflows);
        setEditingOutflow(null);
        return fetchData()
      })
      .catch((error) => {
        console.error('Error updating the outflow:', error.message);
      });
  }, [setOutflows, setEditingOutflow, apiBaseUrl, fetchAPI, fetchData]);


  const handleCancel = () => {
    setEditingOutflow(null);
  };

  const handleOrder = useCallback(async (row) => {
    // Extract the necessary details from the row
    const orderData = {
      location_id: row.location,
      material_id: row.materialid,
      vendor_id: (() => {
        // Filter materialchanges based on materialId
        const filteredMaterialChanges = materialchanges.filter(
          (materialChange) => materialChange.material_id === row.materialid
        );

        // Sort filtered materialchanges by date in descending order to get the latest record
        const latestMaterialChange = filteredMaterialChanges.reduce((latest, current) => {
          return (latest.change_id > current.change_id) ? latest : current;
        }, { change_id: -1, vendor: 0 });


        // Extract the vendor_id from the latest material change record
        return latestMaterialChange ? latestMaterialChange.vendor : '';
      })(),
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
  }, [fetchAPI, apiBaseUrl, materialchanges]);

  const formatDateTime = useCallback((dateTimeString) => {
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
  }, []);

  const columns = React.useMemo(
    () => [

      { Header: 'ID', accessor: 'outflowid' },
      {
        Header: 'Location',
        accessor: (value) => {
          const locationnm = locations.find((loc) => loc.id === value.location);
          return locationnm ? locationnm.locationname : 'location not found';
        },
      },
      {
        Header: 'Material ID',
        accessor: 'materialid'
      },
      {
        Header: 'Material Name',
        accessor: (row) => {
          const material = materials.find((material) => material.matid === row.materialid);
          return material ? material.name : 'Material not found';
        },
      },
      { Header: 'Width', accessor: 'width' },
      { Header: 'Lot No', accessor: 'lotnumber',
        Cell: ({ row }) => (
          <span style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }} onClick={() => openOutMatQuery(row.original)}>
            {row.original.lotnumber} {/* Display the actual materialid value */}
          </span>
        ) },
      {
        Header: 'Quantity',
        accessor: 'quantity',
        Cell: ({ value }) => parseFloat(value).toFixed(2), // Format to 2 decimal places
      },

      /*{
        Header: 'Remaining Quantity',
        accessor: (row) => {
          const key = `${row.materialid}-${row.lotnumber || 'null'}-${row.location}`;
          const data = remainingQuantities.get(key);
          const remaining = data ? (data.purchases - data.outflows).toFixed(2) : 'N/A';
          return <span style={{ color: 'red' }}>{remaining}</span>;
        },
      },*/
      {
        Header: 'Remaining Quantity',
        accessor: (row) => {
          // Εύρεση αντιστοιχίας στο testremaining
          const data = testremaining.find((entry) =>
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
        Header: 'Cost (€)',
        accessor: 'cost',
        Cell: ({ value }) => value ? `${parseFloat(value).toFixed(2)} € ` : 'N/A'
      }
      ,
      {
        Header: 'Employee',
        accessor: (value) => {
          const employee = employees.find((emp) => emp.empid === value.employee);
          return employee ? `${employee.name}` : 'Employee not found';
        },
      },
      // Update the column definition for the "Project" column
      {
        Header: 'Project',
        accessor: (value) => {
          const project = projects.find((prj) => prj.prid === value.project);
          return project ? project.name : 'Project not found';
        },
        filter: 'text',
        Cell: ({ row }) => {
          const project = projects.find((prj) => prj.prid === row.original.project);

          if (!project) {
            return 'Project not found';
          }

          const projectOutflows = outflows.filter((outflow) => outflow.project === project.prid);

          // Create an array of strings that include Material ID, Material Name, and Quantity
          const outflowDetails = projectOutflows.map((outflow) => {
            const material = materials.find((material) => material.matid === outflow.materialid);
            const materialName = material ? material.name : 'Material not found';
            return `Material: ${materialName}, Quantity: ${outflow.quantity}`;
          });

          return (
            <span
              title={projectOutflows.length > 0 ? outflowDetails.join('\n') : 'No outflows for this project'}
              style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
              onClick={() => openProjectOutflowTable(project.prid)}
            >
              {project.name}
            </span>
          );
        },
      },
      {
        Header: 'Sub Project',
        accessor: (row) => {
          const project = projects.find(prj => prj.prid === row.project);
          const quotedItem = project?.quotedItems?.find(item => item.id === row.quotedItemid);
          return quotedItem ? quotedItem.product_name : ''; // Επιστροφή του product_name αν υπάρχει
        },
        Cell: ({ value }) => (
          <span style={{ color: 'green' }}>{value}</span> // Εμφάνιση του product_name με πράσινο κείμενο
        ),
      },
      


      { Header: 'Comments', accessor: 'comments' },
      {
        Header: 'Date', accessor: 'date', Cell: ({ value }) => formatDateTime(value),
      },
      {
        Header: 'Actions', accessor: 'actions',
        Cell: ({ row }) => (
          <div>
            <button onClick={() => handleEdit(row.original)}>Edit</button>
            <button onClick={() => handleDelete(row.original)}>Delete</button>
            <button className='button' onClick={() => handleOrder(row.original)}>Order</button>
          </div>
        ),
      },
    ],
    [handleEdit, handleOrder, handleDelete, materials, locations, employees, projects, outflows, formatDateTime, openProjectOutflowTable/*, remainingQuantities*/, testremaining]
  );

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
      employees,
      projects,
      initialState: {
        pageIndex: 0,
        pageSize: 10,
        sortBy: [
          {
            id: 'outflowid', // ID column accessor
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
      <AddOutflow
        handleAdd={handleAdd}
        locations={locations}
        materials={materials}
        employees={employees}
        projects={projects}
        outflows={outflows}
        setOutflows={setOutflows}
        purchases={purchases}
        fetchAPI={fetchAPI}
        apiBaseUrl={apiBaseUrl}
        setProjects={setProjects}
        useEffect={useEffect}
        userRole={userRole}
      />

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
                {editingOutflow && editingOutflow.outflowid === row.original.outflowid && (
                  <tr>
                    <td colSpan={columns.length}>
                      <EditOutflow outflow={editingOutflow}
                        handleUpdate={handleUpdate}
                        locations={locations}
                        materials={materials}
                        employees={employees}
                        projects={projects}
                        purchases={purchases}
                        outflows={outflows}
                        setPurchases={setPurchases}
                        handleCancel={handleCancel} />
                    </td>
                  </tr>
                )}
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

      {showOutMatQuery && (
        <div className="overlay">
          <div className="popup">
            <span className="close-popup" onClick={() => setShowOutMatQuery(false)}>
              &times;
            </span>
            <OutMatQuery
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
              openProjectOutflowTable={openProjectOutflowTable}
              formatDateTime={formatDateTime}
              userRole={userRole} />
          </div>
        </div>
      )}


    </div>
  );
};

export default OutflowFunc;

import React, {useMemo, useState, useCallback, useEffect } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import EditOutflow from './EditOutflow.js';
import './PurchaseFunc.css';
import AddOutflow from './AddOutflow.js';

const OutflowFunc = ({apiBaseUrl}) => {

  const [materials, setMaterials] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [locations, setLocations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [outflows, setOutflows] = useState([]);
  const [editingOutflow, setEditingOutflow] = useState(null);
  const [globalFilterOne, setGlobalFilterOne] = useState('');
  const [globalFilterTwo, setGlobalFilterTwo] = useState('');

  const openProjectOutflowTable = (projectId) => {
    // Append projectId as a query parameter to the URL
    window.open(`/ProjectOutflows?projectId=${projectId}`, '_blank');
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
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [materialResponse, purchaseResponse, locationResponse, projectResponse, employeesResponse, outflowsResponse] = await Promise.all([
          fetchAPI(`${apiBaseUrl}/materiallist`),
          fetchAPI(`${apiBaseUrl}/PurchasesAPI`),
          fetchAPI(`${apiBaseUrl}/LocationsAPI`),
          fetchAPI(`${apiBaseUrl}/projectsAPI`),
          fetchAPI(`${apiBaseUrl}/employeesAPI`),
          fetchAPI(`${apiBaseUrl}/outflowsAPI`),
        ]);
  
        setMaterials(materialResponse);
        setPurchases(purchaseResponse);
        setLocations(locationResponse);
        setProjects(projectResponse);
        setEmployees(employeesResponse);
        setOutflows(outflowsResponse);
      } catch (error) {
        console.log('Error fetching data:', error);
      }
    };
  
    fetchData(); // Call the fetchData function inside useEffect
  
    // Rest of your code
  }, [apiBaseUrl,fetchAPI]);

  const filteredData = useMemo(() => {
    return outflows.filter(row => {
      // Find the location name for the current row
      const location = locations.find(loc => loc.id === row.location);
      const locationName = location ? location.locationname.toLowerCase() : '';

      // Find the vendor name for the current row
      const employee = employees.find(e => e.empid === row.employee);
      const employeeName = employee ? employee.name.toLowerCase() : '';

      const material = materials.find(m => m.matid === row.materialid);
      const materialName = material ? material.name.toLowerCase() : '';

      // Create a string that includes all the row values, location name, and vendor name
      const rowString = Object.values(row).map(val => String(val).toLowerCase()).join(' ') + ' ' + locationName + ' ' + employeeName + ' ' + materialName;

      // Check if the row string includes both global filters
      return rowString.includes(globalFilterOne.toLowerCase()) && rowString.includes(globalFilterTwo.toLowerCase());
    });
  }, [outflows, globalFilterOne, globalFilterTwo, locations, employees, materials]);

  console.log('outflowspurch', purchases);

  const handleAdd = useCallback((newOutflow) => {
    fetchAPI(`${apiBaseUrl}/outflowsAPI`, {
      method: 'POST',
      body: JSON.stringify(newOutflow),
    })
      .then(() => fetchAPI(`${apiBaseUrl}/outflowsAPI`))
      .then((data) => {
        setOutflows(data);
        console.log('Outflow added successfully', data);
      })
      .catch((error) => {
        console.error('Error adding outflow:', error.message);
      });
  }, [setOutflows, apiBaseUrl, fetchAPI]);
  
  

  const handleDelete = useCallback((deletedOutflow) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this outflow?');
  
    if (isConfirmed) {
      fetchAPI(`${apiBaseUrl}/outflowsAPI/${deletedOutflow.outflowid}`, {
        method: 'DELETE',
      })
        .then(() => {
          const updatedOutflowList = outflows.filter((p) => p.outflowid !== deletedOutflow.outflowid);
          setOutflows(updatedOutflowList);
        })
        .catch((error) => {
          console.log('Error deleting outflow:', error);
        });
    }
  }, [outflows, setOutflows, apiBaseUrl,fetchAPI]);

  const handleEdit = useCallback((outflow) => {
    if (editingOutflow && editingOutflow.outflowid === outflow.outflowid) {
      alert('Outflow is already being edited.');
      return;
    }
  
    // Add a console.log statement here to see the original row data
    console.log('Original Row Data:', outflow);
  
    setEditingOutflow(outflow);
  }, [editingOutflow, setEditingOutflow]);
  

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
      })
      .catch((error) => {
        console.error('Error updating the outflow:', error.message);
      });
  }, [setOutflows, setEditingOutflow, apiBaseUrl, fetchAPI]);
  

  const handleCancel = () => {
    setEditingOutflow(null);
  };

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

  
  
  const columns = React.useMemo(
    () => [
      
      { Header: 'ID', accessor: 'outflowid' },
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
        Header: 'Cost',
        accessor: 'cost',
        Cell: ({ value }) => {
          return value ? `${value} €` : '';
        },
      },
      
      {
        Header: 'Employee',
        accessor: (value) => {
          const employee = employees.find((emp) => emp.empid === value.employee);
          return employee ? `${employee.name} ${employee.surname}` : 'Employee not found';
        },
      },
      // Update the column definition for the "Project" column
      {
        Header: 'Project',
        accessor: (value) => {
          const project = projects.find((prj) => prj.prid === value.project);
          return project ? project.name : 'Project not found';
        },
        filter: 'text', // Enable global filter for the "Project" column
        Cell: ({ row }) => {
          const project = projects.find((prj) => prj.prid === row.original.project);
      
          if (!project) {
            return 'Project not found';
          }
      
          const projectOutflows = outflows.filter((outflow) => outflow.project === project.prid);
      
          return (
            <span
              title={projectOutflows.length > 0 ? projectOutflows.map((outflow) => `Outflow ID: ${outflow.outflowid} Material ID:${outflow.materialid} Quantity: ${outflow.quantity}`).join('\n') : 'No outflows for this project'}
              style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
              onClick={() => openProjectOutflowTable(project.prid)}
            >
              {project.name}
            </span>
          );
        },
      }, 
      { Header: 'Comments', accessor: 'comments' },       
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
    [handleEdit, handleDelete, materials, locations, employees, projects, outflows, purchases]
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
                               handleCancel={handleCancel}/>
                </td>
              </tr>
            )}
          </React.Fragment>
        );
      })}

        </tbody>
      </table>

      <div className = 'pagination'>
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

export default OutflowFunc;

import React, {useState, useCallback, useEffect } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import EditOutflow from './EditOutflow';
import './PurchaseFunc.css';
import AddOutflow from './AddOutflow';

const OutflowFunc = () => {

  const [materials, setMaterials] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [locations, setLocations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [outflows, setOutflows] = useState([]);
  const [editingOutflow, setEditingOutflow] = useState(null);

  const openProjectOutflowTable = (projectId) => {
    // Append projectId as a query parameter to the URL
    window.open(`/ProjectOutflows?projectId=${projectId}`, '_blank');
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [materialResponse, purchaseResponse, locationResponse, projectResponse, employeesResponse, outflowsResponse] = await Promise.all([
        fetch('https://api.robbie.gr/materiallist').then((response) => response.json()),
        fetch('https://api.robbie.gr/PurchasesAPI').then((response) => response.json()),
        fetch('https://api.robbie.gr/LocationsAPI').then((response) => response.json()),
        fetch('https://api.robbie.gr/projectsAPI').then((response) => response.json()),
        fetch('https://api.robbie.gr/employeesAPI').then((response) => response.json()),
        fetch('https://api.robbie.gr/outflowsAPI').then((response) => response.json()),
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

  console.log('outflowspurch', purchases);

  const handleAdd = useCallback((newOutflow) => {
    // Make a POST request to add the new purchase
    fetch('https://api.robbie.gr/outflowsAPI', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newOutflow),
    })
      .then((response) => {
        if (response.ok) {
          // Fetch the updated outflows from the API
          return fetch('https://api.robbie.gr/outflowsAPI'); // Adjust the API endpoint if needed
        } else {
          throw new Error('Error adding outflow');
        }
      })
      .then((response) => response.json())
      .then((data) => {
        setOutflows(data); // Update the outflows state with the fetched data
        console.log('updated', data);
      })
      .catch((error) => {
        console.log('Error adding outflow:', error);
      });
  }, [setOutflows]);
  
  

  const handleDelete = useCallback((deletedOutflow) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this outflow?');
  
    if (isConfirmed) {
      fetch(`https://api.robbie.gr/outflowsAPI/${deletedOutflow.outflowid}`, {
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
  }, [outflows, setOutflows]);

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
    fetch(`https://api.robbie.gr/outflowsAPI/${updatedOutflow.outflowid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedOutflow),
    })
      .then((response) => {
        if (response.ok) {
          // Fetch the updated outflows from the API
          return fetch('https://api.robbie.gr/outflowsAPI'); // Adjust the API endpoint if needed
        } else {
          throw new Error('Error adding outflow');
        }
      })
      .then(() => {
        setEditingOutflow(null);
        const updatedOutflows = outflows.map((outflow) =>
        outflow.outflowid === updatedOutflow.outflowid ? updatedOutflow : outflow
        );
        setOutflows(updatedOutflows);
      })
      .catch((error) => {
        console.error('Error updating the outflow:', error);
      });
  }, [setEditingOutflow, outflows, setOutflows]);

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
    [handleEdit, handleDelete, materials, locations, employees, projects, outflows]
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
      data: outflows,
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
    <div>
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

export default OutflowFunc;

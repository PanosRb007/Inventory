import React, { useEffect, useState, useCallback } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';

const ProjectFunc = () => {

    // State to store the projectId from the query parameter
  const [projectId, setProjectId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [outflows, setOutflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // New state to track loading status
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    // Parse the query parameter from the URL
    const params = new URLSearchParams(window.location.search);
    const projectIdParam = params.get('projectId');

    if (projectIdParam) {
      // Set the projectId in the component's state
      setProjectId(projectIdParam);
    }
  }, []);

  
  const fetchData = useCallback(async () => {
    try {
      const [outflowsResponse, projectsResponse, employeesResponse] = await Promise.all([
        fetch('http://localhost:8081/outflowsAPI').then((response) => response.json()),
        fetch('http://localhost:8081/projectsAPI').then((response) => response.json()),
        fetch('http://localhost:8081/employeesAPI').then((response) => response.json()),
      ]);
      const filtered = outflowsResponse;
      console.log('filtered', filtered);
      setEmployees(employeesResponse);
      setProjects(projectsResponse);
      setOutflows(filtered.filter((res) => res.project === parseInt(projectId)));
      setIsLoading(false);
    } catch (error) {
      console.log('Error fetching data:', error);
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  console.log('outflows', outflows);
  console.log('projectid', projectId);
  console.log('projects', projects);

  
  
  const columns = React.useMemo(
    () => [
      { Header: 'ID', accessor: 'outflowid' },
      { Header: 'Date', accessor: 'date' },

      { Header: 'Material Id', accessor: 'materialid' },
      { Header: 'Quantity', accessor: 'quantity' },
      {
        Header: 'Cost/Unit',
        accessor: (row) => {
          const cost = parseFloat(row.cost); // Get the cost value
          const quantity = parseFloat(row.quantity); // Get the quantity value
      
          // Check if both cost and quantity are valid numbers
          if (typeof cost === 'number' && typeof quantity === 'number' && quantity !== 0) {
            // Calculate the cost per unit and format it
            const costPerUnit = (cost / quantity).toFixed(2); // You can adjust the number of decimal places as needed
            return `${costPerUnit} €`; // Format the result as desired
          } else {
            return 'N/A'; // Handle cases where cost or quantity is not a valid number or quantity is zero
          }
        },
      },

      { Header: 'Cost', accessor: 'cost' },

      {
        Header: 'Employee',
        accessor: (value) => {
          const employee = employees.find((emp) => emp.empid === value.employee);
          return employee ? `${employee.name} ${employee.surname}` : 'Employee not found';
        },
      },
   
    ],
    [employees]
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
      employees,
      initialState: {
        pageIndex: 0,
        pageSize: 10,
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
    <h1>Cost for Project: {projects.find((prj) => prj.prid === parseInt(projectId))?.name}</h1>


      <div className="search">
        <input
          type="text"
          palue={globalFilter || ''}
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
    defaultValue={pageIndex + 1} // Corrected the typo here
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
      <div className="total-cost">
        <strong>Total Cost:</strong> {outflows.reduce((acc, row) => acc + parseFloat(row.cost), 0)}
      </div>
    </div>
  );
};

export default ProjectFunc;

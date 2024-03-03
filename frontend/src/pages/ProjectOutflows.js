import React, { useEffect, useState, useCallback } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import './PurchaseFunc.css';

const ProjectFunc = ({ apiBaseUrl }) => {

  // State to store the projectId from the query parameter
  const [projectId, setProjectId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [outflows, setOutflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // New state to track loading status
  const [employees, setEmployees] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [filteredoutflows, setFilteredOutflows] = useState([]);



  useEffect(() => {
    // Parse the query parameter from the URL
    const params = new URLSearchParams(window.location.search);
    const projectIdParam = params.get('projectId');

    if (projectIdParam) {
      // Set the projectId in the component's state
      setProjectId(projectIdParam);
    }
  }, []);

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


  const fetchData = useCallback(async () => {
    try {
      const [outflowsResponse, projectsResponse, employeesResponse, materialsResponse, purchaseResponse] = await Promise.all([
        fetchAPI(`${apiBaseUrl}/outflowsAPI`),
        fetchAPI(`${apiBaseUrl}/projectsAPI`),
        fetchAPI(`${apiBaseUrl}/employeesAPI`),
        fetchAPI(`${apiBaseUrl}/materiallist`),
        fetchAPI(`${apiBaseUrl}/PurchasesAPI`),
      ]);
  
      // Filter outflows based on projectId
      const filteredOutflows = outflowsResponse.filter((res) => res.project === parseInt(projectId));
  
      // Update state with filteredOutflows
      setFilteredOutflows(filteredOutflows);
  
      // Set other state values
      setEmployees(employeesResponse);
      setProjects(projectsResponse);
      setMaterials(materialsResponse);
      setPurchases(purchaseResponse);
      setOutflows(outflowsResponse);
      setIsLoading(false);
    } catch (error) {
      console.log('Error fetching data:', error);
      setIsLoading(false);
    }
  }, [projectId, apiBaseUrl, fetchAPI]);
  

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  console.log('outflows', outflows);
  console.log('projectid', projectId);
  console.log('projects', projects);

  const calculateCost = (row, purchases, outflows) => {
    let totalCost = 0;

    if (!row.width) {
      const filteredPurchases = purchases.filter(pur =>
        pur.location === row.location &&
        pur.materialid === row.materialid
      );

      // Filter outflows up to but not including the current row's outflowid
      const filteredOutflows = outflows.filter(out =>
        out.location === row.location &&
        out.materialid === row.materialid &&
        out.outflowid < row.outflowid // Assuming outflowid is a sequential identifier
      );

      const totalPreviousOutflows = filteredOutflows.reduce((sum, out) => sum + parseFloat(out.quantity), 0);

      let sumOfQuantities = 0;
      let remainingOutflowQuantity = row.quantity;

      for (const purchase of filteredPurchases) {
        const purchaseQuantity = parseFloat(purchase.quantity);
        const purchasePrice = parseFloat(purchase.price);
        sumOfQuantities += purchaseQuantity;
        const remQuant = sumOfQuantities - totalPreviousOutflows;

        if (sumOfQuantities >= totalPreviousOutflows) {
          if (remainingOutflowQuantity <= remQuant) {
            totalCost += remainingOutflowQuantity * purchasePrice;
            break;
          } else {
            totalCost += remQuant * purchasePrice;
            remainingOutflowQuantity -= remQuant;
          }
        }
      }
    } else if (row.lotnumber) {
      const purchase = purchases.find(pur => pur.materialid === row.materialid && pur.lotnumber === row.lotnumber);
      const pricePerUnit = purchase ? purchase.price : 0;
      totalCost = row.quantity * pricePerUnit * (row.width || 1);
    }

    return totalCost.toFixed(2); // Format to 2 decimal places
  }


  function formatDateTime(dateTimeString) {
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
}


  const columns = React.useMemo(
    () => [
      { Header: 'ID', accessor: 'outflowid' },
      { Header: 'Date', accessor: 'date' ,Cell: ({ value }) => formatDateTime(value), 
      },

      { Header: 'Material Id', accessor: 'materialid' },
      {
        Header: 'Material Name',
        accessor: (row) => {
          const material = materials.find((material) => material.matid === row.materialid);
          return material ? material.name : 'Material not found';
        },
      },
      { Header: 'Width', accessor: 'width' },
      { Header: 'Lot #', accessor: 'lotnumber' },

      {
        Header: 'Quantity',
        accessor: 'quantity',
        Cell: ({ value }) => parseFloat(value).toFixed(2),
      },
            {
        Header: 'Cost/Unit',
        accessor: (row) => {
          const cost = parseFloat(calculateCost(row, purchases, outflows));
          const quantity = parseFloat(row.quantity);
      
          if (quantity !== 0) {
            const costPerUnit = (cost / quantity).toFixed(2);
            return `${costPerUnit} €`;
          } else {
            return 'N/A';
          }
        },
      },
      

      {
        Header: 'Cost',
        accessor: (row) => calculateCost(row, purchases, outflows),
        Cell: ({ value }) => `${value} €`,
      }
,

      {
        Header: 'Employee',
        accessor: (value) => {
          const employee = employees.find((emp) => emp.empid === value.employee);
          return employee ? `${employee.name}` : 'Employee not found';
        },
      },

    ],
    [employees, materials, outflows, purchases]
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
      data: filteredoutflows,
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
    <div className='container'>
      <h1 className='header'>Cost for Project: {projects.find((prj) => prj.prid === parseInt(projectId))?.name}</h1>


      <div className="search">
        <input
          type="text"
          palue={globalFilter || ''}
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
          {[10, 25, 50, 100].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>

      </div>
      {filteredoutflows.length > 0 && (
  <div className="total-cost">
    <strong>Total Cost:</strong> {(() => { // Wrap the JavaScript code in an arrow function
      let totalCost = 0; // Initialize totalCost variable
      totalCost = filteredoutflows.reduce((acc, outflow) => {
        // Calculate the cost for each outflow and accumulate
        return acc + parseFloat(calculateCost(outflow, purchases, outflows));
      }, 0);
      return totalCost; // Return the calculated totalCost
    })()} {/* Immediately invoke the arrow function to compute the total cost */}
    € {/* Currency symbol */}
  </div>
)}




    </div>
  );
};

export default ProjectFunc;

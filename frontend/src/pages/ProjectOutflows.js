import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import './PurchaseFunc.css';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';


const ProjectOutflows = ({ apiBaseUrl, userRole }) => {
  const [projectId, setProjectId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [outflows, setOutflows] = useState([]);
  const [laborHours, setLaborHours] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectIdParam = params.get('projectId');
    if (projectIdParam) setProjectId(parseInt(projectIdParam));
  }, []);

  const fetchAPI = useCallback(async (url) => {
    const authToken = sessionStorage.getItem('authToken');
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error(`Error fetching ${url}`);
    return response.json();
  }, []);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [outflowsResponse, laborHoursResponse, projectsResponse, employeesResponse, materialsResponse] = await Promise.all([
        fetchAPI(`${apiBaseUrl}/outflowsAPI`),
        fetchAPI(`${apiBaseUrl}/laborHoursAPI`),
        fetchAPI(`${apiBaseUrl}/projectsAPI`),
        fetchAPI(`${apiBaseUrl}/employeesAPI`),
        fetchAPI(`${apiBaseUrl}/materiallist`),
      ]);
      setOutflows(outflowsResponse.filter((o) => o.project === projectId));
      setLaborHours(laborHoursResponse.filter((lh) => lh.projectid === projectId));
      setProjects(projectsResponse);
      setEmployees(employeesResponse);
      setMaterials(materialsResponse);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, apiBaseUrl, fetchAPI]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentProject = useMemo(() => {
    return projects.find((p) => p.prid === projectId);
  }, [projects, projectId]);
  const statusValue = currentProject?.status?.data ? currentProject.status.data[0] : 0;


  const handleUpdate = useCallback(async () => {
    if (!currentProject || !currentProject.prid) return;

    try {
      const newStatus = statusValue === 1 ? 0 : 1; // Toggle status
      const updatedData = { ...currentProject, status: newStatus };

      console.log('Sending PUT request:', updatedData);

      const authToken = sessionStorage.getItem('authToken');

      const response = await fetch(`${apiBaseUrl}/projectsAPI/${currentProject.prid}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error('Failed to update project');

      fetchData(); // Refresh data after updating
    } catch (error) {
      console.error('Error updating the project:', error);
    }
  }, [currentProject, apiBaseUrl, fetchData, statusValue]);





  const formatCurrency = (value) => `${parseFloat(value).toFixed(2)} €`;
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('el-GR');

  const totalMaterialCost = useMemo(() => {
    return outflows.reduce((sum, outflow) => {
      const cost = parseFloat(outflow.cost || 0);
      return sum + cost;
    }, 0);
  }, [outflows]);

  const totalLaborCost = useMemo(() => {
    return laborHours.reduce((sum, laborHour) => {
      const cost = parseFloat(laborHour.cost_of_labor || 0);
      return sum + cost;
    }, 0);
  }, [laborHours]);

  const totalCost = useMemo(() => {
    return totalMaterialCost + totalLaborCost;
  }, [totalMaterialCost, totalLaborCost]);


  const outflowColumns = useMemo(() => [
    { Header: 'ID', accessor: 'outflowid' },
    { Header: 'Date', accessor: 'date', Cell: ({ value }) => formatDate(value) },
    { Header: 'Material ID', accessor: 'materialid' },
    {
      Header: 'Material Name',
      accessor: (row) => {
        const material = materials.find((m) => m.matid === row.materialid);
        return material ? material.name : 'Material not found';
      },
    },
    { Header: 'Quantity', accessor: 'quantity', Cell: ({ value }) => parseFloat(value).toFixed(2) },
    {
      Header: 'Cost',
      accessor: 'cost',
      Cell: ({ row }) => {
        const cost = parseFloat(row.original.cost || 0);
        return formatCurrency(cost);
      },
    },
    {
      Header: 'Employee',
      accessor: 'employee',
      Cell: ({ row }) => {
        const employee = employees.find((e) => e.empid === row.original.employee);
        return employee ? employee.name : 'Employee not found';
      },
    },
  ], [materials, employees]);

  const laborHoursColumns = useMemo(() => {
    const columns = [
      { Header: 'ID', accessor: 'labid' },
      { Header: 'Date', accessor: 'date', Cell: ({ value }) => formatDate(value) },
      {
        Header: 'Employee',
        accessor: 'employeeid',
        Cell: ({ value }) => {
          const employee = employees.find((e) => e.empid === value);
          return employee ? employee.name : 'Employee not found';
        },
      },
      { Header: 'Start Time', accessor: 'start' },
      { Header: 'End Time', accessor: 'end' },
      { Header: 'Hours Worked', accessor: 'hoursWorked', Cell: ({ value }) => `${parseFloat(value).toFixed(2)} h` },
      { Header: 'Comments', accessor: 'comments' },
    ];

    if (userRole !== 'Senior') {
      columns.push({
        Header: 'Cost of Labor',
        accessor: 'cost_of_labor',
        Cell: ({ value }) => formatCurrency(value),
      });
    }

    return columns;
  }, [employees, userRole]);

  const outflowTableInstance = useTable(
    { columns: outflowColumns, data: outflows, initialState: { pageIndex: 0 } },
    useSortBy,
    usePagination
  );

  const laborHoursTableInstance = useTable(
    { columns: laborHoursColumns, data: laborHours, initialState: { pageIndex: 0 } },
    useSortBy,
    usePagination
  );

  const renderTable = (tableInstance, title) => {
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
      pageCount,
    } = tableInstance;

    return (
      <div>
        <h2>{title}</h2>
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
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell) => (
                    <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="pagination">
          <button onClick={() => previousPage()} disabled={!canPreviousPage}>
            Previous
          </button>
          <span>
            Page {pageIndex + 1} of {pageCount || 1}
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
              style={{ width: '50px', marginLeft: '5px' }}
            />
          </span>
          <button onClick={() => nextPage()} disabled={!canNextPage}>
            Next
          </button>
          <select
            value={pageSize}
            onChange={(e) => tableInstance.setPageSize(Number(e.target.value))}
            style={{ marginLeft: '10px' }}
          >
            {[10, 25, 50].map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };




  if (isLoading) return <div>Loading...</div>;

  const sale = currentProject?.sale || 0;

  console.log(currentProject);

  const pieData = sale > 0 && currentProject ? [
    { name: 'Material Cost', value: (totalMaterialCost / sale) * 100 },
    { name: 'Labor Cost', value: (totalLaborCost / sale) * 100 },
    { name: 'Profit', value: ((sale - totalMaterialCost - totalLaborCost) / sale) * 100 },
  ] : [];
  const COLORS = ['#0088FE', '#FFBB28', '#00C49F'];
  return (
    <div className="container">
      <div className="project-summary">
        <div className="financial-info">
          <h1>Project: {currentProject?.name || 'Unknown'}</h1>
          <label>
            Completed:
            <input
              type="checkbox"
              checked={statusValue === 1}
              onChange={handleUpdate}
            />


          </label>
          {currentProject?.description && (
            <p><strong>Description:</strong> {currentProject.description}</p>
          )}

          {userRole !== 'Senior' && (
            <> {/* ✅ Correctly wrapping multiple elements */}
              <p><strong>Sale:</strong> {formatCurrency(currentProject.sale || 0)}</p>
              <p><strong>Total Cost:</strong> {formatCurrency(totalCost)}</p>
              <p><strong>Profit:</strong> {formatCurrency((currentProject.sale || 0) - totalCost)}</p>
            </>
          )}

          <p><strong>Zoho CRM:</strong> <a href={currentProject.deallink} target="_blank" rel="noopener noreferrer">{currentProject.deallink}</a></p>
          <p><strong>Zoho Drive:</strong> <a href={currentProject.driveurl} target="_blank" rel="noopener noreferrer">{currentProject.driveurl}</a></p>

        </div>
        {userRole !== 'Senior' && (
          <div className="pie-chart-container">
            {/* Pie Chart */}
            <PieChart width={400} height={400}>
              <Pie
                data={pieData}
                cx="60%"
                cy="70%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ value }) => `${value.toFixed(1)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
        )}
      </div>

      {/* Outflows & Labor Hours Tables */}
      {renderTable(outflowTableInstance, 'Outflows')}
      {userRole !== 'Senior' && (
        <div className="total-cost"><strong>Total Material Cost:</strong> {formatCurrency(totalMaterialCost)}</div>
      )}
      {renderTable(laborHoursTableInstance, 'Labor Hours')}
      {userRole !== 'Senior' && (
        <div className="total-cost"><strong>Total Labor Cost:</strong> {formatCurrency(totalLaborCost)}</div>
      )}
      {userRole !== 'Senior' && (
        <div className="total-cost final"><strong>Total Cost:</strong> {formatCurrency(totalCost)}</div>
      )}
    </div>
  );
};

export default ProjectOutflows;

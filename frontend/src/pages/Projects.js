import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import AddProject from './AddProject.js'; // Adjust the import path as needed
import EditProject from './EditProject.js'; // Adjust the import path as needed
import './PurchaseFunc.css';

const ProjectFunc = ({ apiBaseUrl }) => {
  const [editingProject, setEditingProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [outflows, setOutflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
      const projectResponse = await fetchAPI(`${apiBaseUrl}/projectsAPI`);
      const outflowsResponse = await fetchAPI(`${apiBaseUrl}/outflowsAPI`);
      // Calculate real material cost for each project
      const projectsWithCost = projectResponse.map(project => {
        const projectOutflows = outflowsResponse.filter(outflow => outflow.project === project.prid);
        const totalCost = projectOutflows.reduce((acc, outflow) => acc + parseFloat(outflow.cost), 0);
        return { ...project, realmatcostNumeric: totalCost };
      });

      setProjects(projectsWithCost); // Make sure this line is present
      setOutflows(outflowsResponse);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, fetchAPI]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddProject = useCallback(async (newProject) => {
    try {
      await fetchAPI(`${apiBaseUrl}/projectsAPI`, {
        method: 'POST',
        body: JSON.stringify(newProject),
      });
      fetchData();
    } catch (error) {
      console.error('Error adding project:', error);
    }
  }, [fetchData, apiBaseUrl, fetchAPI]);

  const handleDelete = useCallback(async (deletedProject) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await fetchAPI(`${apiBaseUrl}/projectsAPI/${deletedProject.prid}`, {
          method: 'DELETE',
        });
        fetchData();
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  }, [fetchData, apiBaseUrl, fetchAPI]);

  const handleEdit = useCallback((project) => {
    setEditingProject(project);
  }, []);

  const handleUpdate = useCallback(async (updatedProject, updatedStatus) => {
    try {
      await fetchAPI(`${apiBaseUrl}/projectsAPI/${updatedProject.prid}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...updatedProject,
          status: updatedStatus,
        }),
      });
      fetchData();
    } catch (error) {
      console.error('Error updating the project:', error);
    } finally {
      setEditingProject(null);
    }
  }, [fetchData, apiBaseUrl, fetchAPI]);

  const handleCancel = () => {
    setEditingProject(null);
  };

  const openProjectOutflowTable = useCallback((projectId) => {
    window.open(`/ProjectOutflows?projectId=${projectId}`, '_blank');
  }, []);

  const columns = useMemo(
    () => [
      { Header: 'ID', accessor: 'prid' },
      {
        Header: 'Name',
        accessor: 'name',
        Cell: ({ row }) => {
          const projectOutflows = outflows.filter((outflow) => outflow.project === row.original.prid);
          return (
            <span
              title={projectOutflows.length > 0 ? projectOutflows.map((outflow) => `Outflow ID: ${outflow.outflowid} Material ID:${outflow.materialid} Quantity: ${outflow.quantity}`).join('\n') : 'No outflows for this project'}
              style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
              onClick={() => openProjectOutflowTable(row.original.prid)}
            >
              {row.original.name}
            </span>
          );
        }
      },
      { Header: 'Description', accessor: 'description' },
      { Header: 'Projected Material Cost', accessor: 'prmatcost' },
      { Header: 'Projected Labor Cost', accessor: 'prlabcost' },
      { Header: 'Sale', accessor: 'sale' },
      {
        Header: 'Real Material Cost',
        accessor: 'realmatcostNumeric', // Use the numeric value for sorting
        Cell: ({ row }) => {
          // Check if realmatcostNumeric is defined
          if (typeof row.original.realmatcostNumeric === 'number') {
            const formattedCost = `${row.original.realmatcostNumeric.toFixed(2)} €`; // Format for display
            return formattedCost;
          }
          return 'N/A'; // Return 'N/A' or some placeholder if undefined
        },
        sortType: 'basic' // Default sorting should work fine now
      }


      ,


      { Header: 'Real Labor Cost', accessor: 'reallabcost' },
      { Header: 'Total Cost', accessor: 'totalcost' },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ row }) => {
          const statusValue = row.original.status.data[0];
          return (
            <label>
              Completed:
              <input
                type="checkbox"
                checked={statusValue === 1}
                onChange={() => handleUpdate(row.original, statusValue === 1 ? 0 : 1)}
              />
            </label>
          );
        },
      },
      {
        Header: 'Actions',
        accessor: 'actions',
        Cell: ({ row }) => (
          <div>
            <button onClick={() => handleEdit(row.original)}>Edit</button>
            <button onClick={() => handleDelete(row.original)}>Delete</button>
          </div>
        ),
      },
    ],
    [handleEdit, handleDelete, outflows, handleUpdate, openProjectOutflowTable]
  );

  const projectsStatus0 = useMemo(() => projects.filter(p => p.status.data[0] === 0), [projects]);
  const projectsStatus1 = useMemo(() => projects.filter(p => p.status.data[0] === 1), [projects]);

  const tableInstance0 = useTable(
    {
      columns,
      data: projectsStatus0,
      initialState: { pageIndex: 0 }
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const tableInstance1 = useTable(
    {
      columns,
      data: projectsStatus1,
      initialState: { pageIndex: 0 }
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const renderTable = (tableInstance, status) => {
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
    } = tableInstance;

    return (
      <div className='container'>

        <div className="search">
          <input
            type="text"
            value={globalFilter || ''}
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
                  {editingProject && editingProject.prid === row.original.prid && (
                    <tr>
                      <td colSpan={columns.length}>
                        <EditProject project={editingProject} handleUpdate={handleUpdate} handleCancel={handleCancel} />
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
              {pageIndex + 1} of {Math.ceil(projects.length / pageSize)}
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className='container'>
      <AddProject handleAddProject={handleAddProject} />
      <h2 className='heading'>Projects In Progress</h2>
      {renderTable(tableInstance0, 0)}
      <h2 className='heading'>Projects Completed</h2>
      {renderTable(tableInstance1, 1)}
    </div>
  );
};

export default ProjectFunc;

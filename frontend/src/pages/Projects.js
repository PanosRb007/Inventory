import React, { useEffect, useState, useCallback } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import AddProject from './AddProject.js'; // Make sure to adjust the import path
import EditProject from './EditProject.js'; // Make sure to adjust the import path
import './PurchaseFunc.css';

const ProjectFunc = ({apiBaseUrl}) => {
  const [editingProject, setEditingProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // New state to track loading status

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
    setProjects(projectResponse);
    setIsLoading(false);
  } catch (error) {
    console.log('Error fetching data:', error);
    setIsLoading(false);
  }
}, [apiBaseUrl, fetchAPI]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddProject = useCallback((newProject) => {
    fetchAPI(`${apiBaseUrl}/projectsAPI`, {
      method: 'POST',
      body: JSON.stringify(newProject),
    })
    .then((addedProject) => {
      setProjects([...projects, addedProject]);
      fetchData();
    })
    .catch((error) => {
      console.log('Error adding project:', error);
    });
  }, [projects, fetchData, apiBaseUrl, fetchAPI]);
  


  const handleDelete = useCallback((deletedProject) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this project?');
  
    if (isConfirmed) {
      fetchAPI(`${apiBaseUrl}/projectsAPI/${deletedProject.prid}`, {
        method: 'DELETE',
      })
      .then(() => {
        const updatedProjectList = projects.filter((p) => p.prid !== deletedProject.prid);
        setProjects(updatedProjectList);
      })
      .catch((error) => {
        console.log('Error deleting project:', error);
      });
    }
  }, [projects, apiBaseUrl, fetchAPI]);
  

  const handleEdit = useCallback((project) => {
    if (editingProject && editingProject.prid === project.prid) {
      alert('project is already being edited.');
      return;
    }

    setEditingProject(project);
  }, [editingProject]);

  const handleUpdate = useCallback((updatedProject) => {
    fetchAPI(`${apiBaseUrl}/projectsAPI/${updatedProject.prid}`, {
      method: 'PUT',
      body: JSON.stringify(updatedProject),
    })
    .then(() => {
      fetchData();
      setEditingProject(null);
    })
    .catch((error) => {
      console.error('Error updating the project:', error);
    });
  }, [fetchData, apiBaseUrl, fetchAPI]);
  
  const columns = React.useMemo(
    () => [
      { Header: 'ID', accessor: 'prid' },
      { Header: 'Name', accessor: 'name' },
      { Header: 'Description', accessor: 'description' },
      { Header: 'Projected Material Cost', accessor: 'prmatcost' },
      { Header: 'Projected Labor Cost', accessor: 'prlabcost' },
      { Header: 'Sale', accessor: 'v' },
      { Header: 'Real Material Cost', accessor: 'realmatcost' },
      { Header: 'Real Labor Cost', accessor: 'reallabcost' },
      { Header: 'Total Cost', accessor: 'totalcost' },
      { Header: 'Actions', accessor: 'actions',
        Cell: ({ row }) => (
          <div>
            <button onClick={() => handleEdit(row.original)}>Edit</button>
            <button onClick={() => handleDelete(row.original)}>Delete</button>
          </div>
        ),
      },
    ],
    [handleEdit, handleDelete]
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
      data: projects,
      initialState: {
        pageIndex: 0,
        pageSize: 10,
        sortBy: [
          {
            id: 'prid', // ID column accessor
            desc: true, // Sorting in descending order
          },
        ],
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
      <AddProject handleAddProject={handleAddProject} />

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
                      <EditProject project={editingProject} handleUpdate={handleUpdate} />
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
          Prevhjious
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

export default ProjectFunc;

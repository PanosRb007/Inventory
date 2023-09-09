import React, { useEffect, useState, useCallback } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import AddProject from './AddProject'; // Make sure to adjust the import path
import EditProject from './EditProject'; // Make sure to adjust the import path

const ProjectFunc = () => {
  const [editingProject, setEditingProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // New state to track loading status

  const fetchData = useCallback(async () => {
    try {
      const [projectResponse] = await Promise.all([
        fetch('http://localhost:8081/projectsAPI').then((response) => response.json()),
      ]);
      setProjects(projectResponse);
      setIsLoading(false);
    } catch (error) {
      console.log('Error fetching data:', error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddProject = useCallback((newProject) => {
    // Send an HTTP request to add the new project
    fetch('http://localhost:8081/projectsAPI', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newProject),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Error adding project');
        }
      })
      .then((data) => {
        setProjects([...projects, newProject]);
        fetchData();
      })
      .catch((error) => {
        console.log('Error adding project:', error);
      });
  }, [projects, setProjects, fetchData]);


  const handleDelete = useCallback((deletedproject) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this purchase?');
  
    if (isConfirmed) {
      fetch(`http://localhost:8081/projects/${deletedproject.prid}`, {
        method: 'DELETE',
      })
        .then(() => {
          const updatedprojectList = projects.filter((p) => p.prid !== deletedproject.prid);
          setProjects(updatedprojectList);
        })
        .catch((error) => {
          console.log('Error deleting project:', error);
        });
    }
  }, [projects]);

  const handleEdit = useCallback((project) => {
    if (editingProject && editingProject.prid === project.prid) {
      alert('project is already being edited.');
      return;
    }

    setEditingProject(project);
  }, [editingProject]);

  const handleUpdate = useCallback((updatedproject) => {
    fetch(`http://localhost:8081/projects/${updatedproject.prid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedproject),
    })
      .then((response) => response.json())
      .then(() => {
        fetchData();
        setEditingProject(null);
      })
      .catch((error) => {
        console.error('Error updating the project:', error);
      });
  }, [fetchData]);
  
  
  
  const columns = React.useMemo(
    () => [
      { Header: 'ID', accessor: 'prid' },
      { Header: 'Name', accessor: 'name' },
      { Header: 'Description', accessor: 'description' },
      { Header: 'Projected Material Cost', accessor: 'prmatcost' },
      { Header: 'Projected Labor Cost', accessor: 'prlabcost' },
      { Header: 'Sale', accessor: 'sale' },
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
    prepiousPage,
    canNextPage,
    canPrepiousPage,
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
    <div>
      <AddProject handleAddProject={handleAddProject} />

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
        <button onClick={() => prepiousPage()} disabled={!canPrepiousPage}>
          Prepious
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
            defaultvalue={pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              gotoPage(page);
            }}
            style={{ width: '50px' }}
          />
        </span>
        <select
          palue={pageSize}
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

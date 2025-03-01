import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useTable, useSortBy, usePagination, useExpanded } from 'react-table';
import AddProject from './AddProject.js'; // Adjust the import path as needed
import EditProject from './EditProject.js'; // Adjust the import path as needed
import './PurchaseFunc.css';

const ProjectFunc = ({ apiBaseUrl, userRole }) => {
  const [editingProject, setEditingProject] = useState(null);
  //const [purchases, setPurchases] = useState([]);
  const [projects, setProjects] = useState([]);
  const [outflows, setOutflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState(''); // Global filter state

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
      // const purchasesResponse = await fetchAPI(`${apiBaseUrl}/PurchasesAPI`);

      setProjects(projectResponse);
      setOutflows(outflowsResponse);
      //setPurchases(purchasesResponse);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, fetchAPI]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /*const calculateCost = (row, purchases, outflows) => {
    let totalCost = 0;

    if (!row.width) {
      const filteredPurchases = purchases.filter(purchase =>
        purchase.location === row.location &&
        purchase.materialid === row.materialid
      );

      const filteredOutflows = outflows.filter(outflow =>
        outflow.location === row.location &&
        outflow.materialid === row.materialid &&
        outflow.outflowid < row.outflowid
      );

      const totalPreviousOutflows = filteredOutflows.reduce((sum, outflow) => {
        return sum + parseFloat(outflow.quantity);
      }, 0);

      let sumOfQuantities = 0;
      let remainingOutflowQuantity = row.quantity;

      for (const purchase of filteredPurchases) {
        const purchaseQuantity = parseFloat(purchase.quantity);
        const purchasePrice = parseFloat(purchase.price);
        sumOfQuantities += purchaseQuantity;

        if (sumOfQuantities >= totalPreviousOutflows) {
          const remQuant = sumOfQuantities - totalPreviousOutflows;

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
      if (purchase) {
        const pricePerUnit = parseFloat(purchase.price);
        totalCost = row.quantity * pricePerUnit * (row.width || 1);
      }
    }

    return parseFloat(totalCost.toFixed(2)); // Ensure the result is a number with 2 decimal places
  };*/

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

  const allColumns = useMemo(
    () => [
      {
        Header: 'Expand',
        id: 'expander',
        Cell: ({ row }) => (
          <span {...row.getToggleRowExpandedProps()} style={{ cursor: 'pointer' }}>
            {row.isExpanded ? '🔽' : '➕'}
          </span>
        ),
      },
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
      { Header: 'm2', accessor: 'm2' },
      {
        Header: 'Projected Material Cost',
        accessor: (row) => parseFloat(row.prmatcost) || 0,
        Cell: ({ value }) => `${value.toFixed(2)} €`,
        sortType: 'basic',
      },
      {
        Header: 'Projected Labor Cost',
        accessor: (row) => parseFloat(row.prlabcost) || 0,
        Cell: ({ value }) => `${value.toFixed(2)} €`,
        sortType: 'basic',
      },
      {
        Header: 'Sale',
        accessor: (row) => parseFloat(row.sale) || 0,
        Cell: ({ value }) => `${value.toFixed(2)} €`,
        sortType: 'basic',
      },
      {
        Header: 'Real Material Cost',
        accessor: (row) => parseFloat(row.realmatcost) || 0,
        Cell: ({ value }) => `${value.toFixed(2)} €`,
        sortType: 'basic',
      },
      {
        Header: 'Real Labor Cost',
        accessor: (row) => parseFloat(row.reallabcost) || 0,
        Cell: ({ value }) => `${value.toFixed(2)} €`,
        sortType: 'basic',
      },
      {
        Header: 'Total Cost',
        accessor: (row) => parseFloat(row.totalcost) || 0,
        Cell: ({ value }) => `${value.toFixed(2)} €`,
        sortType: 'basic',
      },
      {
        Header: 'Cost/m2',
        accessor: (row) => {
          const totalCost = parseFloat(row.totalcost) || 0;
          const m2 = parseFloat(row.m2) || 0;
          return m2 ? totalCost / m2 : 0;
        },
        Cell: ({ value }) => `${value.toFixed(2)} €/m2`,
        sortType: 'basic',
      },
      {
        Header: 'Profit',
        accessor: (row) => {
          const sale = parseFloat(row.sale) || 0;
          const totalCost = parseFloat(row.totalcost) || 0;
          return sale - totalCost; // Επιστρέφει αριθμητική τιμή
        },
        Cell: ({ value }) => `${value.toFixed(2)} €`, // Εμφανίζει με το σύμβολο €
        sortType: 'basic', // Προαιρετικό: Εξασφαλίζει αλφαριθμητικό sorting
      },
      {
        Header: 'Profit %',
        accessor: (row) => {
          const sale = parseFloat(row.sale) || 0;
          const totalCost = parseFloat(row.totalcost) || 0;
          const profit = sale - totalCost;
          return totalCost ? (profit / totalCost) * 100 : 0; // Επιστρέφει αριθμητική τιμή
        },
        Cell: ({ value }) => `${value.toFixed(2)} %`, // Εμφανίζει με το σύμβολο %
        sortType: 'basic',
      },
      {
        Header: 'Deal Url',
        accessor: 'deallink',
        Cell: ({ value }) => <a href={value} target="_blank" rel="noopener noreferrer">{value}</a>
      },
      {
        Header: 'ZOHO Drive Url',
        accessor: 'driveurl',
        Cell: ({ value }) => <a href={value} target="_blank" rel="noopener noreferrer">{value}</a>
      },
      {
        Header: 'Quoted Items',
        id: 'quotedItems',
        Cell: ({ row }) => row.isExpanded && (
          <table className="sub-table">
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {row.original.quotedItems.map((item, index) => (
                <tr key={index}>
                  <td>{item.product_id}</td>
                  <td>{item.product_name}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unit_price ? `${parseFloat(item.unit_price).toFixed(2)} €` : '-'}</td>
                  <td>{item.total ? `${parseFloat(item.total).toFixed(2)} €` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ),
      },
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

  const columns = useMemo(() => {
    if (userRole === 'Senior') {
      return allColumns.filter(column => ![
        'Projected Material Cost',
        'Projected Labor Cost',
        'Sale',
        'Real Material Cost',
        'Real Labor Cost',
        'Total Cost',
        'Cost/m2',
        'Profit',
        'Profit %',
        'Quoted Items',
      ].includes(column.Header));
    }
    return allColumns;
  }, [allColumns, userRole]);

  const projectsStatus0 = useMemo(() => projects.filter(p => p.status.data[0] === 0), [projects]);
  const projectsStatus1 = useMemo(() => projects.filter(p => p.status.data[0] === 1), [projects]);

  const filteredProjectsStatus0 = useMemo(() => {
    return projectsStatus0.filter((project) =>
      project.name.toLowerCase().includes(globalFilter.toLowerCase())
    );
  }, [projectsStatus0, globalFilter]);

  const filteredProjectsStatus1 = useMemo(() => {
    return projectsStatus1.filter((project) =>
      project.name.toLowerCase().includes(globalFilter.toLowerCase())
    );
  }, [projectsStatus1, globalFilter]);

  const tableInstance0 = useTable(
    {
      columns,
      data: filteredProjectsStatus0,
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
    useSortBy,
    useExpanded,
    usePagination
  );

  const tableInstance1 = useTable(
    {
      columns,
      data: filteredProjectsStatus1,
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
    useSortBy,
    useExpanded,
    usePagination
  );

  const renderTable = (tableInstance, status) => {
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
    } = tableInstance;

    return (
      <div className='container'>
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
                        <EditProject project={editingProject} handleUpdate={handleUpdate} handleCancel={handleCancel} userRole={userRole} />
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
      <div className="search">
        <input
          type="text"
          placeholder="Search..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>
      <h2 className='heading'>Projects In Progress</h2>
      {renderTable(tableInstance0, 0)}
      <h2 className='heading'>Projects Completed</h2>
      {renderTable(tableInstance1, 1)}
    </div>
  );
};

export default ProjectFunc;

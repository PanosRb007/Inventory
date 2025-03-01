import React, { useState, useEffect, useCallback } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import EditEmployees from './EditEmployees.js';
import './PurchaseFunc.css';
import AddEmployees from './AddEmployees.js';

const EmployeeTable = ({ apiBaseUrl, userRole }) => {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingEmployee, setEditingEmployee] = useState(null);

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
      const response = await fetchAPI(`${apiBaseUrl}/employeesAPI`);
      // Convert Buffer to boolean
      const formattedResponse = response.map(employee => ({
        ...employee,
        active: !!(employee.active && (employee.active[0] || employee.active)), // Convert BIT(1) or int to boolean
      }));
      
      setEmployees(formattedResponse);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAPI, apiBaseUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = useCallback(async (newEmployee) => {
    try {
      await fetchAPI(`${apiBaseUrl}/employeesAPI`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEmployee),
      });
      fetchData();
    } catch (error) {
      console.error('Error adding employee:', error.message);
      setError(error.message);
    }
  }, [fetchData, apiBaseUrl, fetchAPI]);

  const handleDelete = useCallback(async (deletedEmployee) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this employee?');
    if (isConfirmed) {
      try {
        await fetchAPI(`${apiBaseUrl}/employeesAPI/${deletedEmployee.empid}`, {
          method: 'DELETE',
        });
        fetchData();
      } catch (error) {
        console.log('Error deleting employee:', error);
        setError(error.message);
      }
    }
  }, [fetchAPI, apiBaseUrl, fetchData]);

  const handleEdit = useCallback((employee) => {
    setEditingEmployee(employee);
  }, []);

  const handleUpdate = useCallback(async (updatedEmployee) => {
    try {
      await fetchAPI(`${apiBaseUrl}/employeesAPI/${updatedEmployee.empid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEmployee),
      });
      fetchData();
      setEditingEmployee(null);
    } catch (error) {
      console.error('Error updating the employee:', error);
      setError(error.message);
    }
  }, [fetchData, apiBaseUrl, fetchAPI]);

  const handleCancel = () => {
    setEditingEmployee(null);
  };

  const columns = React.useMemo(() => [
    { Header: 'Emp ID', accessor: 'empid' },
    { Header: 'Name', accessor: 'name' },
    { Header: 'Surname', accessor: 'surname' },
    { Header: 'Department', accessor: 'department' },
    { Header: 'Tel', accessor: 'tel' },
    { Header: 'Mail', accessor: 'mail' },
    { Header: 'Wage', accessor: 'wage' },
    {
      Header: 'Active',
      accessor: 'active',
      Cell: ({ value }) => (value ? 'Yes' : 'No')
    },
    {
      Header: 'Actions', accessor: 'actions',
      Cell: ({ row }) => (
        <div>
          <button className='button' onClick={() => handleEdit(row.original)}>Edit</button>
          <button className='button' onClick={() => handleDelete(row.original)}>Delete</button>
        </div>
      ),
    },
  ], [handleEdit, handleDelete]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data: employees,
      initialState: { pageIndex: 0, pageSize: 10 }, // Set initial page size
    },
    useSortBy,
    usePagination
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className='container'>
      <h2>Employees</h2>
      <AddEmployees apiBaseUrl={apiBaseUrl} handleAddEmployee={handleAdd} />
      <table {...getTableProps()} className="table">
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render('Header')}
                  <span>
                    {column.isSorted
                      ? column.isSortedDesc
                        ? ' 🔽'
                        : ' 🔼'
                      : ''}
                  </span>
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
                {editingEmployee && editingEmployee.empid === row.original.empid && (
                  <tr>
                    <td colSpan={columns.length}>
                      <EditEmployees employee={editingEmployee} handleUpdate={handleUpdate} handleCancel={handleCancel} userRole={userRole}/>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      <div className="pagination">
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {'<<'}
        </button>
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {'<'}
        </button>
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {'>'}
        </button>
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {'>>'}
        </button>
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{' '}
        </span>
        <span>
          | Go to page:{' '}
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              gotoPage(page);
            }}
            style={{ width: '50px' }}
          />
        </span>
        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default EmployeeTable;

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTable } from 'react-table';
import Select from 'react-select';
import AddLaborHours from './AddLaborHours';


const LaborHours = ({ apiBaseUrl }) => {
  const [laborhours, setLaborHours] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filterEmployee, setFilterEmployee] = useState(null);
  const [filterDate, setFilterDate] = useState('');

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
      throw new Error(errorResponse.message || `Error fetching data from ${url}`);
    }
    return response.json();
  }, []);

  const fetchLaborHours = useCallback(async () => {
    try {
      let url = `${apiBaseUrl}/laborhoursAPI`;
      const params = new URLSearchParams();
      if (filterEmployee) params.append('employeeid', filterEmployee);
      if (filterDate) params.append('date', filterDate);
      if (params.toString()) url += `?${params.toString()}`;

      const laborData = await fetchAPI(url);
      setLaborHours(laborData);
    } catch (error) {
      console.error('Failed to fetch labor hours:', error);
    }
  }, [apiBaseUrl, fetchAPI, filterEmployee, filterDate]);

  useEffect(() => {
    fetchLaborHours();
  }, [fetchLaborHours]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const empData = await fetchAPI(`${apiBaseUrl}/employeesAPI`);
      const projData = await fetchAPI(`${apiBaseUrl}/projectsAPI`);
      setEmployees(empData || []);
      setProjects(projData || []);
    };

    fetchInitialData();
  }, [apiBaseUrl, fetchAPI]);

  const columns = useMemo(() => [
    { Header: 'Labor Hour ID', accessor: 'labid' },
    { Header: 'Date', accessor: 'date' },
    { Header: 'Employee', accessor: value => employees.find(emp => emp.empid === value.employeeid)?.name || 'Employee not found' },
    { Header: 'Project', accessor: value => projects.find(proj => proj.prid === value.projectid)?.name || 'Project not found' },
    { Header: 'Start', accessor: 'start' },
    { Header: 'End', accessor: 'end' },
    { Header: 'Hours Worked', accessor: 'hoursWorked' },
  ], [employees, projects]);

  const tableInstance = useTable({ columns, data: laborhours });
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = tableInstance;

  return (
    <div className="labor-hours-container">
      <h1>Labor Hours</h1>
      <div className="filters">
        <Select
          options={employees.map(emp => ({ value: emp.empid, label: emp.name }))}
          onChange={(option) => setFilterEmployee(option ? option.value : null)}
          placeholder="Filter by Employee"
        />
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          placeholder="YYYY-MM-DD"
        />
        <button onClick={fetchLaborHours}>Apply Filters</button>
      </div>
      <AddLaborHours apiBaseUrl={apiBaseUrl} fetchAPI={fetchAPI} employees={employees} projects={projects}/>
      <table {...getTableProps()} className="table">
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => (
                  <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LaborHours;

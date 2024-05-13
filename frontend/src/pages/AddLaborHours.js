import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTable } from 'react-table';
import Select from 'react-select';
import './CreateCombinedMaterial.css';

const LaborHoursRecord = ({
    apiBaseUrl,
}) => {
    const [laborhours, setLaborHours] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [projects, setProjects] = useState([]);
    const [error, setError] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const today = new Date().toISOString().split('T')[0];
    const [dayRecords, setDayRecords] = useState({
        name: '',
        projectid: '',
        start: '',
        end: '',
        date: today // Set the initial date to today
    });

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
            const laborData = await fetchAPI(`${apiBaseUrl}/laborhoursAPI`);
            console.log("Fetched Labor Hours Data:", laborData);
    
            const filteredData = laborData.filter(hour => {
                // Create a date object from the hour.date string
                const dateObj = new Date(hour.date);
                // Adjust for the timezone offset to get correct local date
                const localDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000));
                // Convert to YYYY-MM-DD format
                const hourDate = localDate.toISOString().split('T')[0];
    
                console.log("Converted hourDate (Local):", hourDate, "Selected Date (Form):", dayRecords.date);
                return hour.employeeid === selectedEmployee && hourDate === dayRecords.date;
            });
    
            console.log("Filtered Data:", filteredData);
            setLaborHours(filteredData);
        } catch (error) {
            console.error('Failed to fetch labor hours:', error);
        }
    }, [apiBaseUrl, fetchAPI, selectedEmployee, dayRecords.date]);
    


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
    ], [employees, projects]);

    const tableInstance = useTable({ columns, data: laborhours });
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = tableInstance;

   

    const selectEmployee = empid => {
        const selected = employees.find(e => e.empid === empid);
        if (selected) {
            setSelectedEmployee(empid);
            setDayRecords(prevRecords => ({
                ...prevRecords,
                name: selected.name,
                employeeid: empid
            }));
        }
    };

    const handleChange = (field, value) => {
        setDayRecords(prevRecords => ({
            ...prevRecords,
            [field]: value
        }));
    };

    const saveDayRecord = async () => {
        try {
            const response = await fetchAPI(`${apiBaseUrl}/laborhoursAPI`, {
                method: 'POST',
                body: JSON.stringify(dayRecords),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('Save successful:', response);
            // Refetch the labor hours to update the table with the new data
            fetchLaborHours();
            resetDayRecords();
            
        } catch (error) {
            console.error('Failed to save labor hours:', error);
            setError('Failed to save labor hours');
        }
    };

    const resetDayRecords = () => {
        setDayRecords(prevRecords => ({
            ...prevRecords,
            projectid: '',
            start: '',
            end: ''
        }));
    };
    
    

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    return (
        <>
            <div className="material-input-form-container">
                <div className="employee-list">
                    {employees.map(employee => (
                        <button
                            key={employee.empid}
                            className={`employee-button ${selectedEmployee === employee.empid ? 'active' : ''}`}
                            onClick={() => selectEmployee(employee.empid)}
                        >
                            {employee.name}
                        </button>
                    ))}
                </div>
                {selectedEmployee && (
                    <div className="material-input-form">
                        <h3>Day Record for {dayRecords.name}</h3>
                        <div>
                            <label>Date:</label>
                            <input
                                type="date"
                                value={dayRecords.date} // Ensure you add a 'date' field to your initial dayRecords state
                                onChange={e => handleChange('date', e.target.value)}
                            />
                        </div>
                        <button className="close-popup" onClick={() => setSelectedEmployee(null)}>×</button>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Project:</label>
                                <Select
                                    name="projectid"
                                    value={projects.find(project => project.prid === dayRecords.projectid) ? { value: dayRecords.projectid, label: projects.find(project => project.prid === dayRecords.projectid).name } : null}
                                    options={projects.map(project => ({
                                        value: project.prid,
                                        label: project.name,
                                    }))}
                                    onChange={selectedOption => handleChange('projectid', selectedOption.value)}
                                    placeholder="Select a Project"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor={`start-${selectedEmployee}`}>Start Time (24h format)</label>
                                <input
                                    id={`start-${selectedEmployee}`}
                                    type="time"
                                    name="start"
                                    value={dayRecords.start}
                                    onChange={e => handleChange('start', e.target.value)}
                                    placeholder="HH:MM" // Hinting at the expected format
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor={`end-${selectedEmployee}`}>End Time (24h format)</label>
                                <input
                                    id={`end-${selectedEmployee}`}
                                    type="time"
                                    name="end"
                                    value={dayRecords.end}
                                    onChange={e => handleChange('end', e.target.value)}
                                    placeholder="HH:MM" // Hinting at the expected format
                                    className="form-control"
                                />
                            </div>
                        </div>
                        <button onClick={saveDayRecord} className="btn btn-success save-btn">Save Day Record</button>
                    </div>
                )}
            </div>

            <div className="labor-hours-container">
                <h1>Labor Hours</h1>
                
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
        </>
    );
};

export default LaborHoursRecord;

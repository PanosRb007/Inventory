import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTable } from 'react-table';
import Select from 'react-select';
import EditLaborHours from './EditLaborHours.js';
import './CreateCombinedMaterial.css';

const LaborHoursRecord = ({ apiBaseUrl }) => {
    const [laborhours, setLaborHours] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [projects, setProjects] = useState([]);
    const [error, setError] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const convertUTCToLocal = (dateString) => {
        const options = { timeZone: 'Europe/Athens', year: 'numeric', month: '2-digit', day: '2-digit' };
        return new Intl.DateTimeFormat('en-GB', options).format(new Date(dateString));
    };

    const getLocalDate = () => {
        const localDate = new Date().toLocaleString('en-GB', { timeZone: 'Europe/Athens' });
        const [day, month, year] = localDate.split(/[/, ]/);
        return `${year}-${month}-${day}`;
    };

    const formatDateForInput = (dateString) => {
        const localDate = new Date(dateString).toLocaleString('en-GB', { timeZone: 'Europe/Athens' });
        const [day, month, year] = localDate.split(/[/, ]/);
        return `${year}-${month}-${day}`;
    };

    const today = getLocalDate();
    const [dayRecords, setDayRecords] = useState({
        name: '',
        projectid: '',
        start: '',
        end: '',
        date: today
    });
    const [editeddayRecords, setEditedDayRecords] = useState(null);

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
                const localDate = formatDateForInput(hour.date);
                console.log("Converted hourDate (Local):", localDate, "Selected Date (Form):", dayRecords.date);
                return hour.employeeid === selectedEmployee && localDate === dayRecords.date;
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
            try {
                const empData = await fetchAPI(`${apiBaseUrl}/employeesAPI`);
                const projData = await fetchAPI(`${apiBaseUrl}/projectsAPI`);
                setEmployees(empData || []);
                setProjects(projData || []);
            } catch (error) {
                console.error('Failed to fetch initial data:', error);
            }
        };

        fetchInitialData();
    }, [apiBaseUrl, fetchAPI]);

    const handleEdit = useCallback((labhours) => {
        if (editeddayRecords && editeddayRecords.labid === labhours.labid) {
            alert('Labor Hour is already being edited.');
            return;
        }

        console.log('Original Row Data:', labhours);
        setEditedDayRecords({
            ...labhours,
            date: formatDateForInput(labhours.date) // Convert to local date format for editing
        });
    }, [editeddayRecords]);

    const handleUpdate = useCallback(async (updatedlabhour) => {
        try {
            await fetchAPI(`${apiBaseUrl}/laborhoursAPI/${updatedlabhour.labid}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...updatedlabhour,
                    date: new Date(updatedlabhour.date).toISOString() // Convert back to UTC for saving
                }),
            });
            await fetchLaborHours();
            setEditedDayRecords(null);
        } catch (error) {
            console.error('Error updating the Labor Hour:', error.message);
        }
    }, [apiBaseUrl, fetchAPI, fetchLaborHours]);

    const handleDelete = useCallback(async (labid) => {
        try {
            await fetchAPI(`${apiBaseUrl}/laborhoursAPI/${labid}`, { method: 'DELETE' });
            setLaborHours(currentHours => currentHours.filter(hour => hour.labid !== labid));
        } catch (error) {
            console.error('Failed to delete labor hour:', error);
            setError(`Failed to delete labor hour with ID ${labid}`);
        }
    }, [apiBaseUrl, fetchAPI]);

    const columns = useMemo(() => [
        { Header: 'Labor Hour ID', accessor: 'labid' },
        { Header: 'Date', accessor: 'date', Cell: ({ value }) => convertUTCToLocal(value) },
        { Header: 'Employee', accessor: 'employeeid', Cell: ({ value }) => employees.find(emp => emp.empid === value)?.name || 'Employee not found' },
        { Header: 'Project', accessor: 'projectid', Cell: ({ value }) => projects.find(proj => proj.prid === value)?.name || 'Project not found' },
        { Header: 'Start', accessor: 'start' },
        { Header: 'End', accessor: 'end' },
        { Header: 'Hours Worked', accessor: 'hoursWorked' },
        {
            Header: 'Actions',
            id: 'actions',
            Cell: ({ row }) => (
                <div>
                    <button onClick={() => handleEdit(row.original)} className="btn btn-primary">Edit</button>
                    <button onClick={() => handleDelete(row.original.labid)} className="btn btn-danger" style={{ marginLeft: '10px' }}>Delete</button>
                </div>
            )
        }
    ], [employees, projects, handleEdit, handleDelete]);

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
            await fetchAPI(`${apiBaseUrl}/laborhoursAPI`, {
                method: 'POST',
                body: JSON.stringify({
                    ...dayRecords,
                    date: new Date(dayRecords.date).toISOString() // Convert back to UTC for saving
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            await fetchLaborHours();
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

    const handleCancel = () => {
        setEditedDayRecords(null);
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
                                value={dayRecords.date}
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
                                    placeholder="HH:MM"
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
                                    placeholder="HH:MM"
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
                                <React.Fragment key={row.id}>
                                    <tr {...row.getRowProps()}>
                                        {row.cells.map(cell => (
                                            <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                                        ))}
                                    </tr>
                                    {editeddayRecords && editeddayRecords.labid === row.original.labid && (
                                        <tr>
                                            <td colSpan={columns.length}>
                                                <EditLaborHours
                                                    labhour={editeddayRecords}
                                                    handleUpdate={handleUpdate}
                                                    employees={employees}
                                                    projects={projects}
                                                    handleCancel={handleCancel}
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default LaborHoursRecord;

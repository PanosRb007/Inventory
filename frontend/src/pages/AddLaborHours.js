import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTable, useSortBy } from 'react-table';
import Select from 'react-select';
import EditLaborHours from './EditLaborHours';
import './CreateCombinedMaterial.css';

const LaborHoursRecord = ({ apiBaseUrl }) => {
    const [laborHours, setLaborHours] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [projects, setProjects] = useState([]);
    const [error, setError] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [dayRecords, setDayRecords] = useState({
        name: '',
        projectid: '',
        start: '',
        end: '',
        date: getLocalDate(),
        comments: '',
    });
    const [editedDayRecords, setEditedDayRecords] = useState(null);
    const [availableQuotedItems, setAvailableQuotedItems] = useState([]); // State for quoted items
    const [alllaborHours, setallLaborHours] = useState([]);

    const fetchAPI = useCallback(async (url, options = {}) => {
        const authToken = sessionStorage.getItem('authToken');
        const response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${authToken}`,
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
            const filteredallData = laborData.filter(hour => {
                const localDate = formatDateForInput(hour.date);
                return localDate === dayRecords.date;
            });
            const filteredData = laborData.filter(hour => {
                const localDate = formatDateForInput(hour.date);
                return hour.employeeid === selectedEmployee && localDate === dayRecords.date;
            });
            setLaborHours(filteredData);
            setallLaborHours(filteredallData);
        } catch (error) {
            console.error('Failed to fetch labor hours:', error);
        }
    }, [apiBaseUrl, fetchAPI, selectedEmployee, dayRecords.date]);

    useEffect(() => {
        if (selectedEmployee) {
            fetchLaborHours();
        }
    }, [fetchLaborHours, selectedEmployee]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [empData, projData] = await Promise.all([
                    fetchAPI(`${apiBaseUrl}/employeesAPI`),
                    fetchAPI(`${apiBaseUrl}/projectsAPI`),
                ]);
                setEmployees(empData.map(emp => ({
                    ...emp,
                    active: Boolean(emp.active) // Ensure active is boolean
                })) || []);
                setProjects(projData || []);

            } catch (error) {
                console.error('Failed to fetch initial data:', error);
            }
        };

        fetchInitialData();
    }, [apiBaseUrl, fetchAPI]);

    useEffect(() => {
        if (dayRecords.projectid) {
            const selectedProject = projects.find(project => project.prid === dayRecords.projectid);
            if (selectedProject?.quotedItems) {
                setAvailableQuotedItems(selectedProject.quotedItems);
            } else {
                setAvailableQuotedItems([]);
            }
        } else {
            setAvailableQuotedItems([]);
        }
    }, [dayRecords.projectid, projects]);


    const handleEdit = useCallback(
        labhours => {
            if (editedDayRecords && editedDayRecords.labid === labhours.labid) {
                alert('Labor Hour is already being edited.');
                return;
            }
            setEditedDayRecords({
                ...labhours,
                date: formatDateForInput(labhours.date), // Convert to local date format for editing
            });
        },
        [editedDayRecords]
    );

    const handleUpdate = useCallback(
        async updatedlabhour => {
            try {
                await fetchAPI(`${apiBaseUrl}/laborhoursAPI/${updatedlabhour.labid}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        ...updatedlabhour,
                        date: new Date(updatedlabhour.date).toISOString(), // Convert back to UTC for saving
                    }),
                });
                await fetchLaborHours();
                setEditedDayRecords(null);
            } catch (error) {
                console.error('Error updating the Labor Hour:', error.message);
            }
        },
        [apiBaseUrl, fetchAPI, fetchLaborHours]
    );

    const handleDelete = useCallback(
        async labid => {
            try {
                await fetchAPI(`${apiBaseUrl}/laborhoursAPI/${labid}`, { method: 'DELETE' });
                setLaborHours(currentHours => currentHours.filter(hour => hour.labid !== labid));
            } catch (error) {
                console.error('Failed to delete labor hour:', error);
                setError(`Failed to delete labor hour with ID ${labid}`);
            }
        },
        [apiBaseUrl, fetchAPI]
    );

    const openProjectOutflowTable = useCallback((projectId) => {
        window.open(`/ProjectOutflows?projectId=${projectId}`, '_blank');
    }, []);

    const columns = useMemo(
        () => [
            { Header: 'Labor Hour ID', accessor: 'labid' },
            { Header: 'Date', accessor: 'date', Cell: ({ value }) => convertUTCToLocal(value) },
            { Header: 'Employee', accessor: 'employeeid', Cell: ({ value }) => employees.find(emp => emp.empid === value)?.name || 'Employee not found' },
            {
                Header: 'Project',
                accessor: 'projectid',
                Cell: ({ value }) => {
                    const project = projects.find(proj => proj.prid === value);

                    if (!project) return 'Project not found';

                    return (
                        <span
                            style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                            onClick={() => openProjectOutflowTable(project.prid)}
                        >
                            {project.name}
                        </span>
                    );
                },
            },

            {
                Header: 'Sub Project',
                accessor: (row) => {
                    const project = projects.find(prj => prj.prid === row.projectid);
                    const quotedItem = project?.quotedItems?.find(item => item.id === row.quotedItemid);
                    return quotedItem ? { name: quotedItem.product_name, description: quotedItem.product_description } : { name: '', description: '' };
                },
                Cell: ({ value }) => (
                    <span style={{ color: 'green' }} title={value.description}>
                        {value.name}
                    </span>
                ),
            },
            { Header: 'Start', accessor: 'start' },
            { Header: 'End', accessor: 'end' },
            { Header: 'Comments', accessor: 'comments' },
            { Header: 'Hours Worked', accessor: 'hoursWorked' },
            {
                Header: 'Actions',
                id: 'actions',
                Cell: ({ row }) => (
                    <div>
                        <button onClick={() => handleEdit(row.original)} className="btn btn-primary">
                            Edit
                        </button>
                        <button onClick={() => handleDelete(row.original.labid)} className="btn btn-danger" style={{ marginLeft: '10px' }}>
                            Delete
                        </button>
                    </div>
                ),
            },
        ],
        [employees, projects, handleEdit, handleDelete, openProjectOutflowTable]
    );

    const tableInstance = useTable({ columns, data: laborHours });
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance;

    const groupedAndSortedData = useMemo(() => {
        // Group labor hours by employee ID
        const grouped = alllaborHours.reduce((acc, item) => {
            if (!acc[item.employeeid]) {
                acc[item.employeeid] = [];
            }
            acc[item.employeeid].push(item);
            return acc;
        }, {});
    
        // Sort each group by start time
        Object.keys(grouped).forEach(employeeId => {
            grouped[employeeId].sort((a, b) => a.start.localeCompare(b.start));
        });
    
        // Flatten the sorted groups into an array
        return Object.values(grouped).flat();
    }, [alllaborHours]);
    
    // Pass the sorted and grouped data to the table
    const tableInstance1 = useTable(
        { columns, data: groupedAndSortedData },
        useSortBy
    );
    
    
    const {
        getTableProps: getTableProps1,
        getTableBodyProps: getTableBodyProps1,
        headerGroups: headerGroups1,
        rows: rows1,
        prepareRow: prepareRow1,
    } = tableInstance1;
    

    const selectEmployee = empid => {
        const selected = employees.find(e => e.empid === empid);
        if (selected) {
            setSelectedEmployee(empid);
            setDayRecords(prevRecords => ({
                ...prevRecords,
                name: selected.name,
                employeeid: empid,
            }));
        }
    };

    const handleChange = (field, value) => {
        setDayRecords(prevRecords => ({
            ...prevRecords,
            [field]: value,
        }));
    };

    const saveDayRecord = async () => {
        try {
            await fetchAPI(`${apiBaseUrl}/laborhoursAPI`, {
                method: 'POST',
                body: JSON.stringify({
                    ...dayRecords,
                    date: new Date(dayRecords.date).toISOString(), // Convert back to UTC for saving
                }),
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
            end: '',
            comments: '',
        }));
    };

    const handleCancel = () => {
        setEditedDayRecords(null);
    };

    const groupedEmployees = useMemo(() => {
        return employees.reduce((groups, employee) => {
            const department = employee.department;
            if (!groups[department]) {
                groups[department] = [];
            }
            if (employee.active) {
                groups[department].push(employee);
            }
            return groups;
        }, {});
    }, [employees]);

    const filteredProjects = projects.filter(project => project.status?.data?.[0] === 0);

console.log("Filtered Projects:", filteredProjects);


    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    return (
        <>
            <div className="material-input-form-container">
                <div className="employee-list">
                    {Object.entries(groupedEmployees).map(([department, deptEmployees]) => (
                        <div key={department} className="department-group">
                            <h3>{department}</h3>
                            {deptEmployees.map(employee => (
                                <button
                                    key={employee.empid}
                                    className={`employee-button ${selectedEmployee === employee.empid ? 'active' : ''}`}
                                    onClick={() => selectEmployee(employee.empid)}
                                >
                                    {employee.name}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
                {selectedEmployee && (
                    <div className="material-input-form">
                        <h3>Day Record for {dayRecords.name}</h3>
                        <div>
                            <label>Date:</label>
                            <input type="date" value={dayRecords.date} onChange={e => handleChange('date', e.target.value)} />
                        </div>
                        <button className="close-popup" onClick={() => setSelectedEmployee(null)}>
                            ×
                        </button>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Project:</label>
                                <Select
    name="projectid"
    value={
        (() => {
            const selectedProject = projects.find(project => project.prid === dayRecords.projectid);
            return selectedProject ? { value: selectedProject.prid, label: selectedProject.name } : null;
        })()
    }
    options={filteredProjects
        
        .map(project => ({
            value: project.prid,
            label: project.name,
        }))
    }
    onChange={selectedOption => handleChange('projectid', selectedOption.value)}
    placeholder="Select a Project"
    required
/>

                            </div>
                            <div className='form-group'>
                                <label>Quoted Items:</label>
                                <Select
                                    name="quotedItemid"
                                    value={availableQuotedItems.find(item => item.id === dayRecords.quotedItemid)
                                        ? { value: dayRecords.quotedItemid, label: availableQuotedItems.find(item => item.id === dayRecords.quotedItemid).product_name }
                                        : null}
                                    options={availableQuotedItems.map((item) => ({
                                        value: item.id,  // Αποθηκεύει το `item.id`
                                        label: item.product_name,
                                        title: item.product_description // Εμφανίζει το `product_name`
                                    }))}
                                    getOptionLabel={(item) => (
                                        <span title={item.title}>{item.label}</span> // Το tooltip εμφανίζεται όταν ο χρήστης περνάει το ποντίκι
                                    )}
                                    onChange={(selectedOption) => {
                                        console.log('Selected Quoted Item:', selectedOption);
                                        setDayRecords(prevOutflow => ({
                                            ...prevOutflow,
                                            quotedItemid: selectedOption.value,  // Αποθηκεύει το `item.id`
                                        }));
                                    }}
                                    placeholder="Select a Quoted Item"
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
                            <div className='form-group'>
                                <label>
                                    Comments:
                                    <textarea
                                        name="comments"
                                        value={dayRecords.comments}
                                        onChange={e => handleChange('comments', e.target.value)}
                                    />
                                </label>
                            </div>
                        </div>
                        <button onClick={saveDayRecord} className="btn btn-success save-btn">
                            Save Day Record
                        </button>
                    </div>
                )}
            </div>

            <div className="material-input-form-container">
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
                                    {editedDayRecords && editedDayRecords.labid === row.original.labid && (
                                        <tr>
                                            <td colSpan={columns.length}>
                                                <EditLaborHours
                                                    labhour={editedDayRecords}
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


            <div className="material-input-form-container">
    <h2>Labor Hours for {dayRecords.date}</h2>

    <table {...getTableProps1()} className="table">
    <thead>
        {headerGroups1.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                    <th 
                        {...column.getHeaderProps(column.getSortByToggleProps())} 
                        style={{ cursor: 'pointer' }}
                    >
                        {column.render('Header')}
                        {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                    </th>
                ))}
            </tr>
        ))}
    </thead>
    <tbody {...getTableBodyProps1()}>
        {rows1.map(row => {
            prepareRow1(row);
            return (
                <React.Fragment key={row.id}>
                    <tr {...row.getRowProps()}>
                        {row.cells.map(cell => (
                            <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                        ))}
                    </tr>
                    {editedDayRecords && editedDayRecords.labid === row.original.labid && (
                        <tr>
                            <td colSpan={columns.length}>
                                <EditLaborHours
                                    labhour={editedDayRecords}
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

export default LaborHoursRecord;

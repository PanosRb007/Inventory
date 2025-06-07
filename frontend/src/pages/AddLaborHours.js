import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTable, useSortBy, useGlobalFilter } from 'react-table';
import Select from 'react-select';
import EditLaborHours from './EditLaborHours';
import './CreateCombinedMaterial.css';

// Custom Global Filter function for react-table
function globalTextFilter(rows, ids, filterValue) {
    if (!filterValue) return rows;
    const lower = filterValue.toLowerCase();
    return rows.filter(row => {
        return ids.some(id => {
            const value = row.values[id];
            return value && String(value).toLowerCase().includes(lower);
        });
    });
}

const LaborHoursRecord = ({ apiBaseUrl }) => {
    const [totallaborHours, settotalLaborHours] = useState([]);
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
    const [availableQuotedItems, setAvailableQuotedItems] = useState([]);
    const [alllaborHours, setallLaborHours] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [negativeSearch, setNegativeSearch] = useState('');

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

    const fetchTotalLaborHours = useCallback(async () => {
        try {
            const laborData = await fetchAPI(`${apiBaseUrl}/laborhoursAPI`);
            settotalLaborHours(laborData);
        } catch (error) {
            console.error('Failed to fetch labor hours:', error);
        }
    }, [apiBaseUrl, fetchAPI]);

    const fetchLaborHours = useCallback(async () => {
        try {
            const laborData = await fetchAPI(`${apiBaseUrl}/laborhoursAPI`);
            settotalLaborHours(laborData);
            const filteredallData = laborData.filter(hour => {
                const localDate = formatDateForInput(hour.date);
                return localDate === dayRecords.date;
            });
            setallLaborHours(filteredallData);
        } catch (error) {
            console.error('Failed to fetch labor hours:', error);
        }
    }, [apiBaseUrl, fetchAPI, dayRecords.date]);

    useEffect(() => {
        fetchTotalLaborHours();
        if (selectedEmployee) {
            fetchLaborHours();
        }
    }, [fetchLaborHours, fetchTotalLaborHours, selectedEmployee]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [empData, projData] = await Promise.all([
                    fetchAPI(`${apiBaseUrl}/employeesAPI`),
                    fetchAPI(`${apiBaseUrl}/projectsAPI`),
                ]);
                setEmployees(empData.map(emp => ({
                    ...emp,
                    active: Boolean(emp.active)
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
                date: formatDateForInput(labhours.date),
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
                        date: new Date(updatedlabhour.date).toISOString(),
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
            if (!window.confirm('Είσαι σίγουρος ότι θέλεις να διαγράψεις αυτή την εγγραφή;')) {
                return;
            }
            try {
                await fetchAPI(`${apiBaseUrl}/laborhoursAPI/${labid}`, { method: 'DELETE' });
                settotalLaborHours(currentHours => currentHours.filter(hour => hour.labid !== labid));
                setallLaborHours(currentHours => currentHours.filter(hour => hour.labid !== labid));
                setEditedDayRecords(null);
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

    // Columns for react-table (string accessors for better search)
    const columns = useMemo(
        () => [
            { Header: 'Labor Hour ID', accessor: 'labid' },
            { Header: 'Date', accessor: row => convertUTCToLocal(row.date), id: 'date' },
            { Header: 'Employee', accessor: row => employees.find(emp => emp.empid === row.employeeid)?.name || '', id: 'employee' },
            {
                Header: 'Project',
                accessor: row => projects.find(proj => proj.prid === row.projectid)?.name || '',
                id: 'project',
                Cell: ({ row }) => {
                    const project = projects.find(proj => proj.prid === row.original.projectid);
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
                accessor: row => {
                    const project = projects.find(prj => prj.prid === row.projectid);
                    const quotedItem = project?.quotedItems?.find(item => item.id === row.quotedItemid);
                    return quotedItem ? quotedItem.product_name : '';
                },
                id: 'subproject',
                Cell: ({ row }) => {
                    const project = projects.find(prj => prj.prid === row.original.projectid);
                    const quotedItem = project?.quotedItems?.find(item => item.id === row.original.quotedItemid);
                    return (
                        <span style={{ color: 'green' }} title={quotedItem?.product_description || ''}>
                            {quotedItem?.product_name || ''}
                        </span>
                    );
                },
            },
            { Header: 'Start', accessor: 'start' },
            { Header: 'End', accessor: 'end' },
            { Header: 'Comments', accessor: 'comments' },
            {
                Header: 'Hours Worked',
                accessor: 'hoursWorked',
                Cell: ({ value }) => (
                    <span style={{
                        color: Number(value) < 0 ? 'red' : undefined,
                        fontWeight: Number(value) < 0 ? 'bold' : undefined
                    }}>
                        {value}
                        {Number(value) < 0 && <span title="Αρνητικές ώρες!"> ⚠️</span>}
                    </span>
                )
            },
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

    // Group and sort data for the day's table
    const groupedAndSortedData = useMemo(() => {
        const grouped = alllaborHours.reduce((acc, item) => {
            if (!acc[item.employeeid]) {
                acc[item.employeeid] = [];
            }
            acc[item.employeeid].push(item);
            return acc;
        }, {});
        Object.keys(grouped).forEach(employeeId => {
            grouped[employeeId].sort((a, b) => a.start.localeCompare(b.start));
        });
        return Object.values(grouped).flat();
    }, [alllaborHours]);

    // Table instance for "Labor Hours for {date}" with global filter
    const tableInstance1 = useTable(
        {
            columns,
            data: groupedAndSortedData,
            globalFilter: globalTextFilter,
        },
        useGlobalFilter,
        useSortBy
    );

    const {
        getTableProps: getTableProps1,
        getTableBodyProps: getTableBodyProps1,
        headerGroups: headerGroups1,
        rows: rows1,
        prepareRow: prepareRow1,
        setGlobalFilter: setGlobalFilter1,
    } = tableInstance1;

    useEffect(() => {
        setGlobalFilter1(searchTerm);
    }, [searchTerm, setGlobalFilter1]);

    // Negative hours calculation
    const negativeHours = useMemo(() => {
        return totallaborHours.filter(lh => Number(lh.hoursWorked) < 0);
    }, [totallaborHours]);

    // Table instance for negative hours with global filter
    const negativeColumns = useMemo(() => [
        { Header: 'ID', accessor: 'labid' },
        { Header: 'Ημερομηνία', accessor: row => convertUTCToLocal(row.date), id: 'date' },
        { Header: 'Υπάλληλος', accessor: row => employees.find(emp => emp.empid === row.employeeid)?.name || '', id: 'employee' },
        { Header: 'Project', accessor: row => projects.find(proj => proj.prid === row.projectid)?.name || '', id: 'project' },
        { Header: 'Start', accessor: 'start' },
        { Header: 'End', accessor: 'end' },
        {
            Header: 'Hours Worked',
            accessor: 'hoursWorked',
            Cell: ({ value }) => (
                <span style={{ color: 'red', fontWeight: 'bold' }}>
                    {value}
                    <span title="Αρνητικές ώρες!"> ⚠️</span>
                </span>
            )
        },
        { Header: 'Comments', accessor: 'comments' },
        {
            Header: 'Actions',
            id: 'actions',
            Cell: ({ row }) => (
                <div>
                    <button onClick={() => handleEdit(row.original)} className="btn btn-primary" style={{ marginRight: '5px' }}>
                        Edit
                    </button>
                    <button onClick={() => handleDelete(row.original.labid)} className="btn btn-danger">
                        Delete
                    </button>
                </div>
            ),
        },
    ], [employees, projects, handleEdit, handleDelete]);

    const negativeTableInstance = useTable(
        {
            columns: negativeColumns,
            data: negativeHours,
            globalFilter: globalTextFilter,
        },
        useGlobalFilter,
        useSortBy
    );

    const {
        getTableProps: getNegativeTableProps,
        getTableBodyProps: getNegativeTableBodyProps,
        headerGroups: negativeHeaderGroups,
        rows: negativeRows,
        prepareRow: prepareNegativeRow,
        setGlobalFilter: setNegativeGlobalFilter,
    } = negativeTableInstance;

    useEffect(() => {
        setNegativeGlobalFilter(negativeSearch);
    }, [negativeSearch, setNegativeGlobalFilter]);

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
                    date: new Date(dayRecords.date).toISOString(),
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
            date: getLocalDate(),
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
                        <h3 className="day-record-title">🕒 Day Record for {dayRecords.name}</h3>
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
                                        }))}
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
                                        value: item.id,
                                        label: item.product_name,
                                        title: item.product_description
                                    }))}
                                    getOptionLabel={(item) => (
                                        <span title={item.title}>{item.label}</span>
                                    )}
                                    onChange={(selectedOption) => {
                                        setDayRecords(prevOutflow => ({
                                            ...prevOutflow,
                                            quotedItemid: selectedOption.value,
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
                <h2>Labor Hours for {dayRecords.date}</h2>
                <input
                    type="text"
                    placeholder="Αναζήτηση σε όλα τα πεδία..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ marginBottom: 12, width: 300 }}
                />
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
                                <React.Fragment key={row.original.labid}>
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
                        {rows1.length === 0 && (
                            <tr>
                                <td colSpan={columns.length} style={{ textAlign: 'center', color: 'gray' }}>
                                    Δεν βρέθηκαν εγγραφές.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="material-input-form-container">
                <h2 style={{ color: 'red' }}>Labor Hours με αρνητικές ώρες</h2>
                <input
                    type="text"
                    placeholder="Αναζήτηση σε όλα τα πεδία..."
                    value={negativeSearch}
                    onChange={e => setNegativeSearch(e.target.value)}
                    style={{ marginBottom: 12, width: 300 }}
                />
                <table {...getNegativeTableProps()} className="table">
                    <thead>
                        {negativeHeaderGroups.map(headerGroup => (
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
                    <tbody {...getNegativeTableBodyProps()}>
                        {negativeRows.map(row => {
                            prepareNegativeRow(row);
                            return (
                                <React.Fragment key={row.original.labid}>
                                    <tr {...row.getRowProps()}>
                                        {row.cells.map(cell => (
                                            <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                                        ))}
                                    </tr>
                                    {editedDayRecords && editedDayRecords.labid === row.original.labid && (
                                        <tr>
                                            <td colSpan={negativeColumns.length}>
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
                        {negativeRows.length === 0 && (
                            <tr>
                                <td colSpan={negativeColumns.length} style={{ textAlign: 'center', color: 'green' }}>Δεν υπάρχουν αρνητικές ώρες</td>
                            </tr>
                        )}
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

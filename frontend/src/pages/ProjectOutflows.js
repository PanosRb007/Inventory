import React, { useEffect, useState, useCallback } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import './PurchaseFunc.css';

const ProjectFunc = ({ apiBaseUrl }) => {
    const [projectId, setProjectId] = useState(null);
    const [projects, setProjects] = useState([]);
    const [outflows, setOutflows] = useState([]);
    const [laborHours, setLaborHours] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [filteredoutflows, setFilteredOutflows] = useState([]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const projectIdParam = params.get('projectId');

        if (projectIdParam) {
            setProjectId(projectIdParam);
        }
    }, []);

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
            const [outflowsResponse, projectsResponse, employeesResponse, materialsResponse, purchaseResponse, laborHoursResponse] = await Promise.all([
                fetchAPI(`${apiBaseUrl}/outflowsAPI`),
                fetchAPI(`${apiBaseUrl}/projectsAPI`),
                fetchAPI(`${apiBaseUrl}/employeesAPI`),
                fetchAPI(`${apiBaseUrl}/materiallist`),
                fetchAPI(`${apiBaseUrl}/PurchasesAPI`),
                fetchAPI(`${apiBaseUrl}/laborHoursAPI`),
            ]);

            const filteredOutflows = outflowsResponse.filter((res) => res.project === parseInt(projectId));
            const filteredLaborHours = laborHoursResponse.filter((res) => res.projectid === parseInt(projectId));
            setFilteredOutflows(filteredOutflows);
            setLaborHours(filteredLaborHours);
            setEmployees(employeesResponse);
            setProjects(projectsResponse);
            setMaterials(materialsResponse);
            setPurchases(purchaseResponse);
            setOutflows(outflowsResponse);
            setIsLoading(false);
        } catch (error) {
            console.log('Error fetching data:', error);
            setIsLoading(false);
        }
    }, [projectId, apiBaseUrl, fetchAPI]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdate = useCallback(async (updatedProject, updatedStatus) => {
        try {
            const response = await fetch(`${apiBaseUrl}/projectsAPI/${updatedProject.prid}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
                },
                body: JSON.stringify({
                    ...updatedProject,
                    status: updatedStatus,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', errorText);
                throw new Error(errorText || `Error updating project: ${response.status}`);
            }

            fetchData();
        } catch (error) {
            console.error('Error updating the project:', error);
        }
    }, [fetchData, apiBaseUrl]);

    const handleCheckboxChange = (project, statusValue) => {
        handleUpdate(project, statusValue === 1 ? 0 : 1);
    };

    const currentProject = projects.find(prj => prj.prid === parseInt(projectId));

    const calculateCost = (row, purchases, outflows) => {
        let totalCost = 0;
        if (!row.width) {
            const filteredPurchases = purchases.filter(pur =>
                pur.location === row.location &&
                pur.materialid === row.materialid
            );

            const filteredOutflows = outflows.filter(out =>
                out.location === row.location &&
                out.materialid === row.materialid &&
                out.outflowid < row.outflowid
            );

            const totalPreviousOutflows = filteredOutflows.reduce((sum, out) => sum + parseFloat(out.quantity), 0);
            let sumOfQuantities = 0;
            let remainingOutflowQuantity = row.quantity;

            for (const purchase of filteredPurchases) {
                const purchaseQuantity = parseFloat(purchase.quantity);
                const purchasePrice = parseFloat(purchase.price);
                sumOfQuantities += purchaseQuantity;
                const remQuant = sumOfQuantities - totalPreviousOutflows;

                if (sumOfQuantities >= totalPreviousOutflows) {
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
            const pricePerUnit = purchase ? purchase.price : 0;
            totalCost = row.quantity * pricePerUnit * (row.width || 1);
        }

        return totalCost.toFixed(2);
    };

    function formatDateTime(dateTimeString) {
        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Europe/Athens',
        };

        const dateTime = new Date(dateTimeString);
        return dateTime.toLocaleString('el-GR', options);
    }

    const outflowColumns = React.useMemo(
        () => [
            { Header: 'ID', accessor: 'outflowid' },
            { Header: 'Date', accessor: 'date', Cell: ({ value }) => formatDateTime(value) },
            { Header: 'Material Id', accessor: 'materialid' },
            {
                Header: 'Material Name',
                accessor: (row) => {
                    const material = materials.find((material) => material.matid === row.materialid);
                    return material ? material.name : 'Material not found';
                },
            },
            { Header: 'Width', accessor: 'width' },
            { Header: 'Lot #', accessor: 'lotnumber' },
            {
                Header: 'Quantity',
                accessor: 'quantity',
                Cell: ({ value }) => parseFloat(value).toFixed(2),
            },
            {
                Header: 'Cost/Unit',
                accessor: (row) => {
                    const cost = parseFloat(calculateCost(row, purchases, outflows));
                    const quantity = parseFloat(row.quantity);
                    return quantity !== 0 ? `${(cost / quantity).toFixed(2)} €` : 'N/A';
                },
            },
            {
                Header: 'Cost',
                accessor: (row) => calculateCost(row, purchases, outflows),
                Cell: ({ value }) => `${value} €`,
            },
            {
                Header: 'Employee',
                accessor: (value) => {
                    const employee = employees.find((emp) => emp.empid === value.employee);
                    return employee ? `${employee.name}` : 'Employee not found';
                },
            },
        ],
        [employees, materials, outflows, purchases]
    );

    const laborColumns = React.useMemo(
        () => [
            { Header: 'ID', accessor: 'labid' },
            { Header: 'Date', accessor: 'date', Cell: ({ value }) => formatDateTime(value) },
            { Header: 'Employee', accessor: 'employeeid', Cell: ({ value }) => {
                const employee = employees.find(emp => emp.empid === value);
                return employee ? employee.name : 'Employee not found';
            }},
            { Header: 'Start', accessor: 'start' },
            { Header: 'End', accessor: 'end' },
            { Header: 'Hours Worked', accessor: 'hoursWorked' },
            { Header: 'Cost of Labor', accessor: 'cost_of_labor', Cell: ({ value }) => `${value} €` },
        ],
        [employees]
    );

    const {
        getTableProps: getOutflowTableProps,
        getTableBodyProps: getOutflowTableBodyProps,
        headerGroups: outflowHeaderGroups,
        page: outflowPage,
        prepareRow: prepareOutflowRow,
        state: { pageIndex: outflowPageIndex, pageSize: outflowPageSize, globalFilter: outflowGlobalFilter },
        gotoPage: gotoOutflowPage,
        nextPage: nextOutflowPage,
        previousPage: previousOutflowPage,
        canNextPage: canNextOutflowPage,
        canPreviousPage: canPreviousOutflowPage,
        setPageSize: setOutflowPageSize,
        setGlobalFilter: setOutflowGlobalFilter,
    } = useTable(
        {
            columns: outflowColumns,
            data: filteredoutflows,
            initialState: { pageIndex: 0, pageSize: 10 },
        },
        useGlobalFilter,
        useSortBy,
        usePagination
    );

    const {
        getTableProps: getLaborTableProps,
        getTableBodyProps: getLaborTableBodyProps,
        headerGroups: laborHeaderGroups,
        page: laborPage,
        prepareRow: prepareLaborRow,
        state: { pageIndex: laborPageIndex, pageSize: laborPageSize, globalFilter: laborGlobalFilter },
        gotoPage: gotoLaborPage,
        nextPage: nextLaborPage,
        previousPage: previousLaborPage,
        canNextPage: canNextLaborPage,
        canPreviousPage: canPreviousLaborPage,
        setPageSize: setLaborPageSize,
        setGlobalFilter: setLaborGlobalFilter,
    } = useTable(
        {
            columns: laborColumns,
            data: laborHours,
            initialState: { pageIndex: 0, pageSize: 10 },
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
            <h1 className='header'>
                Cost for Project: {currentProject?.name}
            </h1>
            {currentProject && (
                <label>
                    Completed:
                    <input
                        type="checkbox"
                        checked={currentProject.status.data[0] === 1}
                        onChange={() => handleCheckboxChange(currentProject, currentProject.status.data[0])}
                    />
                </label>
            )}
            <div className="search">
                <input
                    type="text"
                    value={outflowGlobalFilter || ''}
                    onChange={(e) => setOutflowGlobalFilter(e.target.value)}
                    placeholder="Search..."
                />
            </div>
            <table {...getOutflowTableProps()} className="table">
                <thead>
                    {outflowHeaderGroups.map((headerGroup) => (
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
                <tbody {...getOutflowTableBodyProps()}>
                    {outflowPage.map((row) => {
                        prepareOutflowRow(row);
                        return (
                            <React.Fragment key={row.getRowProps().key}>
                                <tr {...row.getRowProps()}>
                                    {row.cells.map((cell) => (
                                        <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                                    ))}
                                </tr>
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
            <div className='pagination'>
                <button onClick={() => previousOutflowPage()} disabled={!canPreviousOutflowPage}>
                    Previous
                </button>
                <button onClick={() => nextOutflowPage()} disabled={!canNextOutflowPage}>
                    Next
                </button>
                <span>
                    Page{' '}
                    <strong>
                        {outflowPageIndex + 1} of {Math.ceil(outflows.length / outflowPageSize)}
                    </strong>{' '}
                </span>
                <span>
                    | Go to page:{' '}
                    <input
                        type="number"
                        defaultValue={outflowPageIndex + 1}
                        onChange={(e) => {
                            const page = e.target.value ? Number(e.target.value) - 1 : 0;
                            gotoOutflowPage(page);
                        }}
                        style={{ width: '50px' }}
                    />
                </span>
                <select
                    value={outflowPageSize}
                    onChange={(e) => setOutflowPageSize(Number(e.target.value))}
                >
                    {[10, 25, 50, 100].map((pageSize) => (
                        <option key={pageSize} value={pageSize}>
                            Show {pageSize}
                        </option>
                    ))}
                </select>
            </div>
            {filteredoutflows.length > 0 && (
                <div className="total-cost">
                    <strong>Total Cost:</strong> {(() => {
                        let totalCost = 0;
                        totalCost = filteredoutflows.reduce((acc, outflow) => {
                            return acc + parseFloat(calculateCost(outflow, purchases, outflows));
                        }, 0);
                        return totalCost;
                    })()} €
                </div>
            )}

            <h2>Labor Hours for Project</h2>
            <div className="search">
                <input
                    type="text"
                    value={laborGlobalFilter || ''}
                    onChange={(e) => setLaborGlobalFilter(e.target.value)}
                    placeholder="Search..."
                />
            </div>
            <table {...getLaborTableProps()} className="table">
                <thead>
                    {laborHeaderGroups.map((headerGroup) => (
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
                <tbody {...getLaborTableBodyProps()}>
                    {laborPage.map((row) => {
                        prepareLaborRow(row);
                        return (
                            <React.Fragment key={row.getRowProps().key}>
                                <tr {...row.getRowProps()}>
                                    {row.cells.map((cell) => (
                                        <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                                    ))}
                                </tr>
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
            <div className='pagination'>
                <button onClick={() => previousLaborPage()} disabled={!canPreviousLaborPage}>
                    Previous
                </button>
                <button onClick={() => nextLaborPage()} disabled={!canNextLaborPage}>
                    Next
                </button>
                <span>
                    Page{' '}
                    <strong>
                        {laborPageIndex + 1} of {Math.ceil(laborHours.length / laborPageSize)}
                    </strong>{' '}
                </span>
                <span>
                    | Go to page:{' '}
                    <input
                        type="number"
                        defaultValue={laborPageIndex + 1}
                        onChange={(e) => {
                            const page = e.target.value ? Number(e.target.value) - 1 : 0;
                            gotoLaborPage(page);
                        }}
                        style={{ width: '50px' }}
                    />
                </span>
                <select
                    value={laborPageSize}
                    onChange={(e) => setLaborPageSize(Number(e.target.value))}
                >
                    {[10, 25, 50, 100].map((pageSize) => (
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

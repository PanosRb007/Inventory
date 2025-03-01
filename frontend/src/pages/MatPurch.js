import React, { useMemo } from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import './PurchaseFunc.css';

const OutMatQuery = ({ rowdata, materials, locations, outflows, purchases, formatDateTime }) => {


    const filteredOutflows = React.useMemo(() => {
        return purchases.filter(purchase =>
            purchase.materialid === rowdata.materialid
        );
    }, [purchases, rowdata]);

    console.log(filteredOutflows)

    const totalCost = useMemo(() => {
        return filteredOutflows.reduce((total, row) => {
          // Calculate cost for each row (quantity * price * width) and add it to the total
          return total + (parseFloat(row.quantity) * parseFloat(row.price) * (parseFloat(row.width) || 1));
        }, 0);
      }, [filteredOutflows]);
      
      

    const columns = React.useMemo(
        () => [
            { Header: 'ID', accessor: 'id' },
            {
                Header: 'Location',
                accessor: (value) => {
                    const locationnm = locations.find((loc) => loc.id === value.location);
                    return locationnm ? locationnm.locationname : 'location not found';
                },
            },
            { Header: 'Material ID', accessor: 'materialid' },
            {
                Header: 'Material Name',
                accessor: (row) => {
                    const material = materials.find((material) => material.matid === row.materialid);
                    return material ? material.name : 'Material not found';
                },
            },
            { Header: 'Width', accessor: 'width' },
            { Header: 'Lot No', accessor: 'lotnumber' },
            {
                Header: 'Quantity',
                accessor: 'quantity',
                Cell: ({ value }) => parseFloat(value).toFixed(2), // Format to 2 decimal places
            },

            {
                Header: 'Remaining Quantity',
                accessor: (row) => {
                    const materialId = row.materialid;
                    const lotNumber = row.lotnumber;
                    const location = row.location;

                    // Filter purchases and outflows for the current row's material ID, lot number, and location
                    const filteredPurchases = purchases.filter(purchase =>
                        purchase.materialid === materialId &&
                        purchase.lotnumber === lotNumber &&
                        purchase.location === location
                    );

                    const filteredOutflows = outflows.filter(outflow =>
                        outflow.materialid === materialId &&
                        outflow.lotnumber === lotNumber &&
                        outflow.location === location
                    );

                    // Calculate total quantity (sum of purchases - sum of outflows)
                    const totalPurchases = filteredPurchases.reduce((sum, purchase) => sum + parseFloat(purchase.quantity), 0);
                    const totalOutflows = filteredOutflows.reduce((sum, outflow) => sum + parseFloat(outflow.quantity), 0);
                    const remainingQuantity = (totalPurchases - totalOutflows).toFixed(2);

                    return (
                        <span style={{ color: 'red' }}>{remainingQuantity}</span>
                    );
                }
            },
            {
                Header: 'Price',
                accessor: 'price' 
            },
            {
                Header: 'Total Cost',
                accessor: (row) => {
                  const totalCost = row.width ? row.width * row.quantity * row.price : row.quantity * row.price;
                  return `${(totalCost.toFixed(2))} €`;
                },
              },
            { Header: 'Comments', accessor: 'comments' },
            {
                Header: 'Date', accessor: 'date', Cell: ({ value }) => formatDateTime(value),
            },
        ],
        [locations, materials, outflows, purchases, formatDateTime]
    );


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

    } = useTable(
        {
            columns,
            data: filteredOutflows,
            initialState: {
                pageIndex: 0,
                pageSize: 10,
                sortBy: [
                    {
                        id: 'id', // ID column accessor
                        desc: true, // Sorting in descending order
                    },
                ],
            },
        },
        useGlobalFilter,
        useSortBy,
        usePagination
    );

    return (
        <div className='container'>
            <table {...getTableProps()} className='table'>
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
                    {page.map(row => {
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
                        {pageIndex + 1} of {Math.ceil(outflows.length / pageSize)}
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

            <div>
                Total Cost: {totalCost.toFixed(2)} €
            </div>
        </div>
    );
};

export default OutMatQuery;

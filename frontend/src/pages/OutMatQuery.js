import React from 'react';
import { useTable, useSortBy, useGlobalFilter, usePagination } from 'react-table';
import './PurchaseFunc.css';

const OutMatQuery = ({ rowdata, materials, locations, employees, projects, outflows, purchases,openProjectOutflowTable,formatDateTime }) => {
    
  
    const filteredOutflows = React.useMemo(() => {
        return outflows.filter(outflow =>
          outflow.location === rowdata.location && outflow.materialid === rowdata.materialid && outflow.lotnumber === rowdata.lotnumber
        );
      }, [outflows, rowdata]);
    
  const columns = React.useMemo(
    () => [
      { Header: 'ID', accessor: 'outflowid' },
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
  Header: 'Cost',
  accessor: (row) => {
    let totalCost = 0;

    if (!row.width) {
      const filteredPurchases = purchases.filter(pur =>
        pur.location === row.location &&
        pur.materialid === row.materialid
      );

      // Filter outflows up to but not including the current row's outflowid
      const filteredOutflows = outflows.filter(out =>
        out.location === row.location &&
        out.materialid === row.materialid &&
        out.outflowid < row.outflowid // Assuming outflowid is a sequential identifier
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

    return totalCost.toFixed(2); // Format to 2 decimal places
  },
  Cell: ({ value }) => `${value} €`,
}
,
      
      {
        Header: 'Employee',
        accessor: (value) => {
          const employee = employees.find((emp) => emp.empid === value.employee);
          return employee ? `${employee.name}` : 'Employee not found';
        },
      },
      // Update the column definition for the "Project" column
      {
        Header: 'Project',
        accessor: (value) => {
          const project = projects.find((prj) => prj.prid === value.project);
          return project ? project.name : 'Project not found';
        },
        filter: 'text',
        Cell: ({ row }) => {
          const project = projects.find((prj) => prj.prid === row.original.project);
      
          if (!project) {
            return 'Project not found';
          }
      
          const projectOutflows = outflows.filter((outflow) => outflow.project === project.prid);
      
          // Create an array of strings that include Material ID, Material Name, and Quantity
          const outflowDetails = projectOutflows.map((outflow) => {
            const material = materials.find((material) => material.matid === outflow.materialid);
            const materialName = material ? material.name : 'Material not found';
            return `Material: ${materialName}, Quantity: ${outflow.quantity}`;
          });
      
          return (
            <span
              title={projectOutflows.length > 0 ? outflowDetails.join('\n') : 'No outflows for this project'}
              style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
              onClick={() => openProjectOutflowTable(project.prid)}
            >
              {project.name}
            </span>
          );
        },
      },
      
      { Header: 'Comments', accessor: 'comments' },       
      { Header: 'Date', accessor: 'date' ,Cell: ({ value }) => formatDateTime(value), 
      },
    ],
    [locations, materials, employees, projects, outflows, purchases,formatDateTime,openProjectOutflowTable]
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
        data: filteredOutflows ,
        initialState: {
            pageIndex: 0,
            pageSize: 10,
            sortBy: [
              {
                id: 'outflowid', // ID column accessor
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
    </div>
  );
};

export default OutMatQuery;

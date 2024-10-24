'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTable, useSortBy, usePagination, useFilters } from 'react-table';
import {
    ArrowUp,
    ArrowDown,
    SortAsc,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const Table = ({ jsonData }) => {
    const [windowHeight, setWindowHeight] = useState(0);

    useEffect(() => {
        const updateHeight = () => {
            setWindowHeight(window.innerHeight);
        };
        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    const getUniqueValues = (data, key) => {
        if (!data || !data.length) return [];
        return Array.from(new Set(data.map(item => item[key])));
    };
    

    const columns = useMemo(() => {
        if (!jsonData.length) return [];
        return Object.keys(jsonData[0]).map((key) => ({
            Header: key,
            accessor: key,
            Filter: ColumnFilter, 
            filter: 'text',
            uniqueValues: getUniqueValues(jsonData, key),
        }));
    }, [jsonData]);
    
    
    

    const rows = useMemo(() => {
        return jsonData.map((row) => {
            const formattedRow = { ...row };
            Object.keys(formattedRow).forEach((key) => {
                let cellValue = formattedRow[key];
                if (typeof cellValue === 'number' && cellValue > 10000 && cellValue < 60000) {
                    const excelDate = new Date((cellValue - 25569) * 86400 * 1000); 
                    cellValue = excelDate.toLocaleDateString();
                }
                formattedRow[key] = cellValue;
            });
            return formattedRow;
        });
    }, [jsonData]);

    const [fontsize, setFontsize] = useState("text-md");

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page,
        prepareRow,
        canPreviousPage,
        canNextPage,
        pageOptions,
        gotoPage,
        nextPage,
        previousPage,
        setPageSize,
        state: { pageIndex, pageSize },
    } = useTable(
        {
            columns,
            data: rows,
            initialState: { pageIndex: 0, pageSize: 10 },
        },
        useFilters, 
        useSortBy,
        usePagination
    );
    

    return (
        <div className="w-full h-full">
            <div className="max-w-full overflow-x-auto overflow-y-auto" style={{ height: windowHeight - 60 }}>
                {rows.length > 0 ? (
                    <div className='w-full h-full overflow-y-auto overflow-x-auto'>

                        <div className="mx-2 flex lg:items-center justify-between flex-col gap-2 lg:flex-row lg:gap-0 items-start my-3">
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => gotoPage(0)}
                                    disabled={!canPreviousPage}
                                    className={`px-3 py-1 rounded-md ${canPreviousPage ? 'bg-cyan-400 text-black' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                >
                                    <ChevronsLeft />
                                </button>
                                <button
                                    onClick={() => previousPage()}
                                    disabled={!canPreviousPage}
                                    className={`px-3 py-1 rounded-md ${canPreviousPage ? 'bg-cyan-400 text-black' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                >
                                    <ChevronLeft />
                                </button>
                                <button
                                    onClick={() => nextPage()}
                                    disabled={!canNextPage}
                                    className={`px-3 py-1 rounded-md ${canNextPage ? 'bg-cyan-400 text-black' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                >
                                    <ChevronRight />
                                </button>
                                <button
                                    onClick={() => gotoPage(pageOptions.length - 1)}
                                    disabled={!canNextPage}
                                    className={`px-3 py-1 rounded-md ${canNextPage ? 'bg-cyan-400 text-black' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                >
                                    <ChevronsRight />
                                </button>
                            </div>

                            <div className="flex items-center space-x-2">
                                <span>
                                    Page{' '}
                                    <strong>
                                        {pageIndex + 1} of {pageOptions.length}
                                    </strong>
                                </span>
                                <span>| Go to page:</span>
                                <Input
                                    type="number"
                                    defaultValue={pageIndex + 1}
                                    onChange={(e) => {
                                        const page = e.target.value ? Number(e.target.value) - 1 : 0;
                                        gotoPage(page);
                                    }}
                                    className="w-16 p-1 text-black font-extrabold text-md text-center border border-white bg-cyan-400 rounded-md focus:outline-none"
                                />
                            </div>

                            <span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => setPageSize(Number(e.target.value))}
                                    className="mr-2 p-2 border border-white bg-cyan-400 rounded-md focus:outline-none text-black font-semibold"
                                >
                                    {[10, 20, 30, 40, 50].map((size) => (
                                        <option key={size} value={size}>
                                            Show {size}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={fontsize}
                                    onChange={(e) => setFontsize(e.target.value)}
                                    className="p-2 border border-white bg-cyan-400 rounded-md focus:outline-none text-black font-semibold"
                                >
                                    <option value="text-sm">Small</option>
                                    <option value="text-md">Medium</option>
                                    <option value="text-lg">Large</option>
                                </select>
                            </span>
                        </div>

                        <table {...getTableProps()} className="w-full table-auto border-collapse border border-black">
                            <thead className="bg-cyan-400 text-black">
                                {headerGroups.map((headerGroup) => (
                                    <tr {...headerGroup.getHeaderGroupProps()} className="border-b-2 border-gray-200" key={headerGroup.id}>
                                        {headerGroup.headers.map((column) => (
                                            <th
                                                {...column.getHeaderProps(column.getSortByToggleProps())}
                                                className="py-3 px-4 lg:px-3 cursor-pointer text-center"
                                                key={column.id}
                                            >
                                                <div className="flex flex-col justify-center items-center">
                                                    <span className="flex flex-row justify-center items-center">
                                                        {column.render('Header')}
                                                        <span className="ml-2 inline-block">
                                                            {column.isSorted ? (
                                                                column.isSortedDesc ? (
                                                                    <ArrowDown />
                                                                ) : (
                                                                    <ArrowUp />
                                                                )
                                                            ) : (
                                                                <SortAsc />
                                                            )}
                                                        </span>
                                                    </span>
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        {column.canFilter ? (
                                                            <ColumnFilter column={column} />
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody {...getTableBodyProps()} className={`text-center ${fontsize}`}>
                                {page.map((row) => {
                                    prepareRow(row);
                                    return (
                                        <tr {...row.getRowProps()} className="border-b border-gray-200" key={row.id}>
                                            {row.cells.map((cell) => (
                                                <td {...cell.getCellProps()} className="p-3" key={cell.column.id}>
                                                    {cell.render('Cell')}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                    </div>
                ) : (
                    <p className="text-center font-extrabold text-lg text-black">No Data Available</p>
                )}
            </div>
        </div>
    );
};

const ColumnFilter = ({ column }) => {
    const { filterValue, setFilter, uniqueValues = [] } = column;

    return (
        <div className="flex justify-center items-center">
            <select
                value={filterValue || ''}
                onChange={(e) => setFilter(e.target.value || undefined)}
                className="text-black p-1 rounded-md mx-auto w-1/2"
            >
                <option value="">All</option>
                {uniqueValues.map((value, idx) => (
                    <option key={idx} value={value}>
                        {value}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default Table;
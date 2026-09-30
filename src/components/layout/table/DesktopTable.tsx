import type { TableColumn, TableProps } from "./types";
import { clickableProps, renderCell } from "./utils";

// First and last columns sit flush with the table edges.
const cellPadding = "px-3 first:pl-0 last:pr-0";

const alignClass = <T,>(column: TableColumn<T>) =>
  column.align === "right" ? "text-right" : "text-left";

const DesktopTable = <T,>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  emptyMessage = "No data",
}: TableProps<T>) => {
  return (
    <table
      className="text-sm text-gray-900"
      style={{ width: "100%", tableLayout: "fixed" }}
    >
      <colgroup>
        {columns.map((column) => (
          <col key={column.key} style={{ width: column.width }} />
        ))}
      </colgroup>

      <thead>
        <tr className="border-b border-gray-400">
          {columns.map((column) => (
            <th
              key={column.key}
              scope="col"
              className={`${cellPadding} ${alignClass(column)} pb-3 font-normal text-gray-500`}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="py-10 text-center text-gray-500"
            >
              {emptyMessage}
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr
              key={getRowKey(row)}
              {...clickableProps(row, onRowClick)}
              className={`border-b border-gray-200 ${
                onRowClick
                  ? "cursor-pointer transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none"
                  : ""
              }`}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`${cellPadding} ${alignClass(column)} truncate py-4 ${column.cellClassName ?? ""}`}
                >
                  {renderCell(column, row)}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default DesktopTable;

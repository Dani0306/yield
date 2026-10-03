import type { TableProps } from "./types";
import { clickableProps, renderCell } from "./utils";

// One card per row, with each column as a label/value pair.
// Column widths don't apply here: every value gets the full card width.
const MobileTable = <T,>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  emptyMessage = "No data",
  renderMobileRow,
  getRowClassName,
}: TableProps<T>) => {
  if (rows.length === 0) {
    return (
      <div className="border-t border-gray-400 py-10 text-center text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="border-t border-gray-400 text-sm text-gray-900">
      {rows.map((row) => (
        <li
          key={getRowKey(row)}
          {...clickableProps(row, onRowClick)}
          className={`border-b border-gray-200 py-4 ${getRowClassName?.(row) ?? ""} ${
            onRowClick
              ? "cursor-pointer transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none"
              : ""
          }`}
        >
          {renderMobileRow ? (
            renderMobileRow(row)
          ) : (
            <dl className="flex flex-col gap-1.5">
              {columns.map((column) => (
                <div
                  key={column.key}
                  className="flex items-baseline justify-between gap-4"
                >
                  <dt className="shrink-0 text-gray-500">{column.header}</dt>
                  <dd
                    className={`min-w-0 truncate text-right ${column.cellClassName ?? ""}`}
                  >
                    {renderCell(column, row)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </li>
      ))}
    </ul>
  );
};

export default MobileTable;

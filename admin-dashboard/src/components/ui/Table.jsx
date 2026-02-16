import { useState } from "react";
import clsx from "clsx";
import Button from "./Button";

const ITEMS_PER_PAGE = 8;

const Table = ({
  columns = [],
  data = [],
  className,
}) => {
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  let sortedData = [...data];

  if (sortKey) {
    sortedData.sort((a, b) => {
      if (a[sortKey] < b[sortKey])
        return sortOrder === "asc" ? -1 : 1;
      if (a[sortKey] > b[sortKey])
        return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }

  const totalPages = Math.ceil(
    sortedData.length / ITEMS_PER_PAGE
  );

  const paginated = sortedData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className={clsx("overflow-x-auto", className)}>
      <table className="w-full text-sm text-gray-800 dark:text-gray-200">
        <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="p-4 cursor-pointer"
                onClick={() =>
                  col.sortable && handleSort(col.key)
                }
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {paginated.map((row, i) => (
            <tr
              key={i}
              className="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition"
            >
              {columns.map((col) => (
                <td key={col.key} className="p-4">
                  {col.render
                    ? col.render(row)
                    : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex justify-end gap-2 p-4">
          {Array.from({ length: totalPages }).map(
            (_, i) => (
              <Button
                key={i}
                variant={
                  page === i + 1
                    ? "primary"
                    : "secondary"
                }
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Table;

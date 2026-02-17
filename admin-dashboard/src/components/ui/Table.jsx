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
      <table className="table-surface w-full text-sm text-[var(--text-primary)]">
        <thead className="table-head">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="cursor-pointer px-5 py-4 text-center align-middle"
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
              key={row.id || row._id || `row-${i}`}
              className="table-row h-14 transition"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-5 py-4 text-center align-middle">
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

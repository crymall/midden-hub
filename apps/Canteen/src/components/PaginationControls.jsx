import { Button, Select } from "@headlessui/react";

const PaginationControls = ({
  page,
  limit,
  onPageChange,
  onLimitChange,
  loading,
  isNextDisabled,
}) => {
  return (
    <div className="border-grey mt-6 flex flex-col items-center justify-between gap-4 border-t-2 pt-4 sm:flex-row">
      <div className="flex items-center gap-2">
        <label className="text-lightestGrey text-sm font-bold">
          Rows per page:
        </label>
        <Select
          value={limit}
          onChange={onLimitChange}
          className="bg-dark border-grey text-lightestGrey focus:border-lightestGrey border p-1 focus:outline-none"
        >
          <option value={20}>20</option>
          <option value={50}>50</option>
        </Select>
      </div>

      <div className="flex items-center gap-4">
        <Button
          disabled={page === 1 || loading}
          onClick={() => onPageChange(page - 1)}
          className="hover:text-lightestGrey text-xl font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          ← Prev
        </Button>
        <span className="text-lightestGrey font-mono">Page {page}</span>
        <Button
          disabled={isNextDisabled || loading}
          onClick={() => onPageChange(page + 1)}
          className="hover:text-lightestGrey text-xl font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next →
        </Button>
      </div>
    </div>
  );
};

export default PaginationControls;
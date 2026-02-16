import clsx from "clsx";

const Input = ({
  label,
  className,
  error,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}

      <input
        className={clsx(
          "w-full px-4 py-2 rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500",
          error ? "border-red-500" : "border-gray-300 dark:border-gray-700",
          className
        )}
        {...props}
      />

      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};

export default Input;

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-10 w-10",
};

const Loader = ({ size = "md", className = "" }) => {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-gray-700 dark:border-t-gray-100 ${sizeMap[size] || sizeMap.md} ${className}`}
    />
  );
};

export default Loader;

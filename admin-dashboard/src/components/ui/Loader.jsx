const Loader = ({ size = 6, className }) => {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 w-${size} h-${size} ${className}`}
    />
  );
};

export default Loader;

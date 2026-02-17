const Skeleton = ({ className = "" }) => {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200/80 dark:bg-gray-800 ${className}`}
    />
  );
};

export default Skeleton;

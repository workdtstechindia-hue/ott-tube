import { useCallback, useEffect, useState } from "react";

const useFetch = (
  apiFunction,
  options = { autoFetch: true, deps: [] }
) => {
  const { autoFetch = true, deps = [] } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiFunction(...args);

        if (!response.success) {
          throw new Error(response.message);
        }

        setData(response.data);
        return response.data;
      } catch (err) {
        const message =
          err.response?.data?.message ||
          err.message ||
          "Something went wrong";

        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    setData,
  };
};

export default useFetch;

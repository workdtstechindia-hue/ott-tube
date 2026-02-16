import { useEffect, useState } from "react";

const useAnimatedCounter = (value, duration = 800) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = value / (duration / 16);

    const step = () => {
      start += increment;
      if (start < value) {
        setCount(Math.floor(start));
        requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };

    requestAnimationFrame(step);
  }, [value, duration]);

  return count;
};

export default useAnimatedCounter;

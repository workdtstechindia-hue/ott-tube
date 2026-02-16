import clsx from "clsx";

const Card = ({
  children,
  className,
  padding = true,
  shadow = "md",
}) => {
  const shadowMap = {
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
  };

  return (
    <div
      className={clsx(
        "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl transition-colors",
        padding && "p-6",
        shadowMap[shadow],
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;

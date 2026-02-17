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
        "card-surface rounded-xl text-[var(--text-primary)] transition-colors",
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

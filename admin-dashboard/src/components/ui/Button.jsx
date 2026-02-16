import clsx from "clsx";

const variants = {
  primary: "bg-gray-900 text-white hover:bg-gray-800",
  secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

const Button = ({
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  className,
  children,
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      className={clsx(
        "rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

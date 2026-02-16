import { useEffect } from "react";
import clsx from "clsx";

const Modal = ({
  isOpen,
  onClose,
  children,
  className,
}) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () =>
      document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={clsx(
          "relative bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl shadow-xl p-6 w-full max-w-lg transform transition-all duration-300 scale-100",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;

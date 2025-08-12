import { forwardRef } from "react";

const Input = forwardRef(
  ({ className = "", type = "text", label, error, icon, ...props }, ref) => {
    const baseClasses =
      "flex h-12 w-full rounded-xl border-2 bg-white/80 backdrop-blur-sm px-4 py-3 text-sm lg:text-base ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 hover:shadow-md focus:shadow-lg";

    const errorClasses = error
      ? "border-red-500 focus-visible:ring-red-500"
      : "border-white/30 focus-visible:ring-primary-500";

    const iconClasses = icon ? "pl-12" : "";

    const classes = `${baseClasses} ${errorClasses} ${iconClasses} ${className}`;

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm lg:text-base font-semibold text-gray-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
              {icon}
            </div>
          )}
          <input type={type} className={classes} ref={ref} {...props} />
        </div>
        {error && (
          <p className="text-sm text-red-600 flex items-center space-x-1 animate-slideInUp">
            <span>⚠️</span>
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;

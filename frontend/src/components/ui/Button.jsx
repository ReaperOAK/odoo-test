import { forwardRef } from "react";

const Button = forwardRef(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      disabled = false,
      loading = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transform hover:scale-105 active:scale-95 relative overflow-hidden group";

    const variants = {
      primary:
        "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/25 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
      secondary:
        "bg-gray-100 hover:bg-gray-200 text-gray-900 shadow-lg hover:shadow-xl border border-gray-200",
      outline:
        "border-2 border-blue-500 bg-white text-blue-600 hover:bg-blue-600 hover:text-white shadow-md hover:shadow-lg hover:shadow-blue-500/25",
      ghost:
        "text-gray-700 hover:bg-gray-100 hover:text-gray-900 shadow-sm hover:shadow-md",
      danger:
        "bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl hover:shadow-red-500/25",
      glass:
        "bg-white/30 backdrop-blur-md text-gray-900 shadow-lg hover:shadow-xl border border-white/20 hover:bg-white/40",
      success:
        "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl hover:shadow-green-500/25",
      warning:
        "bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg hover:shadow-xl hover:shadow-yellow-500/25",
    };

    const sizes = {
      sm: "h-9 px-4 text-sm min-w-[80px]",
      md: "h-11 px-6 text-sm min-w-[100px]",
      lg: "h-13 px-8 text-base min-w-[120px]",
      xl: "h-16 px-10 text-lg min-w-[140px]",
    };

    const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-3 h-4 w-4 relative z-10"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        <span className="relative z-10">{children}</span>

        {/* Animated shine effect */}
        <div className="absolute inset-0 -top-2 -left-2 w-4 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 group-hover:animate-shine"></div>
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;

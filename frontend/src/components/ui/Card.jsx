const Card = ({
  children,
  className = "",
  variant = "default",
  hover = true,
}) => {
  const variants = {
    default: "bg-white/80 border border-gray-200 shadow-lg backdrop-blur-xl",
    gradient:
      "bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl border border-blue-300/30",
    secondary:
      "bg-gradient-to-br from-green-500 to-teal-600 shadow-xl border border-green-300/30",
    outline: "border-2 border-blue-500 bg-white/80 backdrop-blur-sm shadow-lg",
    glass: "bg-white/60 border border-gray-200 shadow-lg backdrop-blur-2xl",
  };

  const hoverEffect = hover
    ? "hover:scale-105 hover:shadow-2xl transition-all duration-300"
    : "";

  return (
    <div
      className={`rounded-2xl ${variants[variant]} ${hoverEffect} ${className}`}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = "" }) => {
  return (
    <div className={`flex flex-col space-y-2 p-6 lg:p-8 ${className}`}>
      {children}
    </div>
  );
};

const CardTitle = ({ children, className = "", gradient = false }) => {
  const gradientClass = gradient
    ? "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
    : "";
  return (
    <h3
      className={`text-lg lg:text-xl font-bold leading-none tracking-tight ${gradientClass} ${className}`}
    >
      {children}
    </h3>
  );
};

const CardContent = ({ children, className = "" }) => {
  return <div className={`p-6 lg:p-8 pt-0 ${className}`}>{children}</div>;
};

const CardFooter = ({ children, className = "" }) => {
  return (
    <div className={`flex items-center p-6 lg:p-8 pt-0 ${className}`}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;

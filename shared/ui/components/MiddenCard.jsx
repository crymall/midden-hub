const MiddenCard = ({ children, className = "" }) => {
  return (
    <div className={`min-h-screen w-full p-6 md:min-h-0 md:w-4/5 ${className}`}>
      <div className="text-lightestGrey font-mono">{children}</div>
    </div>
  );
};

export default MiddenCard;

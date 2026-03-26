import AppCard from "./AppCard";

const AppGrid = ({ items = [] }) => {
  return (
    <div className="flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-6">
      {items.map((item, index) => (
        <AppCard key={index} {...item} />
      ))}
    </div>
  );
};

export default AppGrid;

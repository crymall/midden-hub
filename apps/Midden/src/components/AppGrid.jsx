import AppCard from "./AppCard";

const AppGrid = ({ items = [] }) => {
  return (
    <div className="flex flex-col gap-6 font-mono">
      {items.map((item, index) => (
        <AppCard key={index} {...item} />
      ))}
    </div>
  );
};

export default AppGrid;

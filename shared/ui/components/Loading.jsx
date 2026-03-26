import MiddenCard from "../components/MiddenCard";

const Loading = ({ message = "Loading..." }) => {
  return (
    <MiddenCard>
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-8">
        <div className="border-accent bg-primary/20 h-16 w-16 animate-spin border-4 border-dashed"></div>
        <p className="text-lightestGrey animate-pulse font-mono text-xl font-bold tracking-widest uppercase">
          {message}
        </p>
      </div>
    </MiddenCard>
  );
};

export default Loading;
import MiddenCard from "@shared/ui/components/MiddenCard";
import AppGrid from "../components/AppGrid";
import { experimentLinkList } from "@shared/core/utils/constants";

const Experiments = () => {
  return (
    <MiddenCard>
      <AppGrid items={experimentLinkList} />
    </MiddenCard>
  );
};

export default Experiments;

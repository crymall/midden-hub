import { experimentLinkList } from "@shared/core/utils/constants";

import MiddenCard from "@shared/ui/components/MiddenCard";
import AppGrid from "../components/AppGrid";

const Experiments = () => {
  return (
    <MiddenCard>
      <AppGrid items={experimentLinkList} />
    </MiddenCard>
  );
};

export default Experiments;

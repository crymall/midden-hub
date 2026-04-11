import { explorerLinkList } from "@shared/core/utils/constants";

import MiddenCard from "@shared/ui/components/MiddenCard";
import AppGrid from "../components/AppGrid";

const Explorer = () => {
  return (
    <MiddenCard>
      <AppGrid items={explorerLinkList} />
    </MiddenCard>
  );
};

export default Explorer;

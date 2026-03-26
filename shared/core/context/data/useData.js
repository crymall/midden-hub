import { useContext } from "react";
import DataContext from "./DataContext";

const useData = () => {
  return useContext(DataContext);
}

export default useData;
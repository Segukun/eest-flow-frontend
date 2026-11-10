import { createContext, useContext } from "react";

export const TaskSelectionContext = createContext(null);
export default function useTaskSelection() {
  return useContext(TaskSelectionContext);
}

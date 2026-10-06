import { useSyncExternalStore } from "react";
import { getTheme, setTheme, subscribeToTheme } from "../theme";

export function useTheme() {
  const theme = useSyncExternalStore(subscribeToTheme, getTheme, () => "claro");
  return [theme, setTheme];
}

import { createContext } from "react";

export const EditorContext = createContext({
  activeFieldId: null,
  setActiveFieldId: () => {},
});

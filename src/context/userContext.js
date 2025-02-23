import { createContext, useState, useContext } from "react";

// crear la estancia o conexto para guardar los datos
const UserContext = createContext();

// para usar el contexto fácilmente
export const useUser = () => useContext(UserContext);

// exportar els contexto
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

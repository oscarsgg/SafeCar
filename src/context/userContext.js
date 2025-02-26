import { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Error cargando el usuario desde AsyncStorage:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const updateUser = async (newUser) => {
    try {
      await AsyncStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
    } catch (error) {
      console.error("Error guardando el usuario en AsyncStorage:", error);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser: updateUser, loading }}>
      {!loading && children} {/* Evita renderizar la app hasta que cargue el usuario */}
    </UserContext.Provider>
  );
};

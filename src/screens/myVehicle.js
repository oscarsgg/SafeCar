import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { Button, Box } from "native-base";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserCars } from "../utils/functions";

const MyVehiclesScreen = () => {
  const navigation = useNavigation();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null);

  const getUserData = async () => {
    try {
      const data = await AsyncStorage.getItem("@user_data");
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error retrieving user data:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getUserData();
        if (user?.email) {
          setUserEmail(user.email);
          const carsData = await getUserCars(user.email);
          setCars(carsData || []); // Si `getUserCars` retorna `undefined`, usar `[]`
        }
      } catch (error) {
        console.error("Error obteniendo datos del usuario:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderItem = ({ item }) => {
    const fechaRegistro = item.fechaRegistro?.seconds
    ? new Date(item.fechaRegistro.seconds * 1000).toLocaleDateString()
    : "Fecha no disponible";
    // Si fechaRegistro es un objeto con seconds y nanoseconds (Firebase Timestamp)
  
    return (
      <Box
        p={4}
        my={2}
        borderWidth={1}
        borderRadius="lg"
        borderColor="gray.300"
        bg="white"
        shadow={2}
        width="90%"
        alignSelf="center"
      >
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.marca} {item.modelo}</Text>
        <Text>Año: {item.año}</Text>
        <Text>Placas: {item.placas}</Text>
        <Text>Transmisión: {item.transmision}</Text>
        <Text>Trim: {item.trim}</Text>
        <Text>VIN: {item.vin}</Text>
        <Text>Fecha de Registro: {fechaRegistro}</Text>
      </Box>
    );
  };
  

  return (
    <View style={{ flex: 1, backgroundColor: "#f4f4f4" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", textAlign: "center", marginVertical: 10 }}>
        Mis Vehículos
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" style={{ flex: 1, justifyContent: "center" }} />
      ) : cars.length === 0 ? (
        <Text style={{ textAlign: "center", fontSize: 16, marginTop: 20 }}>No tienes vehículos registrados.</Text>
      ) : (
        <FlatList
          data={cars}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
        />
      )}

      <Button mt={4} mb={6} onPress={() => navigation.goBack()} alignSelf="center">
        Volver
      </Button>
    </View>
  );
};

export default MyVehiclesScreen;

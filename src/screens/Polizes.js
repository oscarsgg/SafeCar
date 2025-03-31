import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, Alert } from "react-native";
import { Button, Box } from "native-base";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../../db/firebase";
import { collection, getDocs, doc, deleteDoc, getDoc } from "firebase/firestore";
import { getUserDocId, getUserCars } from "../utils/functions";

const PolizasScreen = () => {
  const navigation = useNavigation();
  const [polizas, setPolizas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCars, setUserCars] = useState([]);  // Aquí guardamos los carros

  useEffect(() => {
    const fetchPolizas = async () => {
      try {
        const user = await AsyncStorage.getItem("@user_data");
        if (!user) return;
        const { email } = JSON.parse(user);
        const userId = await getUserDocId(email);
        if (!userId) return;

        // Obtener los carros del usuario
        const cars = await getUserCars(email);
        setUserCars(cars);

        const polizaRef = collection(db, `log/${userId}/polizaUser`);
        const querySnapshot = await getDocs(polizaRef);

        let fetchedPolizas = [];
        for (const docSnap of querySnapshot.docs) {
          const polizaData = docSnap.data();
          const polizaId = polizaData.polizaId;

          const polizaRef = doc(db, "polizas", polizaId);
          const polizaSnap = await getDoc(polizaRef);

          fetchedPolizas.push({
            id: docSnap.id,
            carroId: polizaData.carroId,  // Este es el ID del carro (lo modificaremos más abajo)
            fechaCompra: polizaData.fechaCompra?.toDate().toLocaleDateString(),
            fechaVencimiento: polizaData.fechaVencimiento?.toDate().toLocaleDateString(),
            precioFinal: polizaData.precioFinal,
            polizaNombre: polizaSnap.exists() ? polizaSnap.data().nombre : "Desconocido",
          });
        }

        setPolizas(fetchedPolizas);
      } catch (error) {
        console.error("Error obteniendo pólizas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPolizas();
  }, []);

  const eliminarPoliza = async (polizaId) => {
    try {
      const user = await AsyncStorage.getItem("@user_data");
      if (!user) return;
      const { email } = JSON.parse(user);
      const userId = await getUserDocId(email);
      if (!userId) return;

      await deleteDoc(doc(db, `log/${userId}/polizaUser/${polizaId}`));
      setPolizas(polizas.filter(p => p.id !== polizaId));
      Alert.alert("Éxito", "Póliza eliminada correctamente");
    } catch (error) {
      console.error("Error eliminando póliza:", error);
    }
  };

  const getCarDescription = (carroId) => {
    const car = userCars.find(c => c.id === carroId);
    if (car) {
      return `${car.marca} ${car.modelo} ${car.trim} (${car.año})`;
    }
    return "Carro Desconocido";
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f4f4f4" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", textAlign: "center", marginVertical: 10 }}>
        Historial de Pólizas
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" style={{ flex: 1, justifyContent: "center" }} />
      ) : polizas.length === 0 ? (
        <Text style={{ textAlign: "center", fontSize: 16, marginTop: 20 }}>
          Aún no tienes ninguna póliza afiliada.
        </Text>
      ) : (
        <FlatList
          data={polizas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Box p={4} my={2} borderWidth={1} borderRadius="lg" borderColor="gray.300" bg="white" shadow={2} width="90%" alignSelf="center">
              <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.polizaNombre}</Text>
              <Text>Carro: {getCarDescription(item.carroId)}</Text>
              <Text>Fecha Compra: {item.fechaCompra}</Text>
              <Text>Fecha Vencimiento: {item.fechaVencimiento}</Text>
              <Text>Precio Final: ${item.precioFinal}</Text>
              <Button mt={2} colorScheme="red" onPress={() => eliminarPoliza(item.id)}>
                Eliminar
              </Button>
            </Box>
          )}
        />
      )}

      <Button mt={4} mb={6} onPress={() => navigation.goBack()} alignSelf="center">
        Volver
      </Button>
    </View>
  );
};

export default PolizasScreen;

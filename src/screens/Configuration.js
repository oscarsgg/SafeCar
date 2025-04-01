import React, { useState } from "react";
import { View, Text, ScrollView, TextInput, Alert } from "react-native";
import { Button, VStack, Box, Divider, Switch } from "native-base";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveReport } from "../utils/functions"; // Importar la función

const ConfigurationScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportText, setReportText] = useState("");

  const handleSendReport = async () => {
    if (!reportText) {
      Alert.alert("Error", "Debes rellenar el campo para enviar un reporte");
      console.log("Error al enviar un reporte porque no hay datos a enviar");
      return;
    }

    try {
      const user = await AsyncStorage.getItem("@user_data");
      if (!user) {
        Alert.alert("Error", "No se encontró la información del usuario.");
        return;
      }

      const { email } = JSON.parse(user);
      await saveReport(email, reportText);

      Alert.alert("Éxito", "Reporte enviado exitosamente");
      console.log("Reporte enviado:", reportText);
      setReportText("");
      setShowReportForm(false);
    } catch (error) {
      console.error("Error al enviar el reporte:", error);
      Alert.alert("Error", "No se pudo enviar el reporte. Inténtalo de nuevo.");
    }
  };

  const toggleNotifications = async () => {
    setNotifications(!notifications);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("@user_data");
    navigation.reset({
      index: 0,
      routes: [{ name: "LoginScreen" }],
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f4f4f4" }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>Configuración</Text>

        <VStack space={4}>
          <Box p={4} bg="white" borderRadius="md" shadow={2}>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>Cuenta</Text>
            <Button mt={2} onPress={() => navigation.navigate("EditProfile")}>Editar Perfil</Button>
            <Button mt={2} onPress={logout} colorScheme="danger">Eliminar Cuenta</Button>
          </Box>

          <Box p={4} bg="white" borderRadius="md" shadow={2}>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>Notificaciones</Text>
            <Divider my={2} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text>Recordatorios de Pólizas</Text>
              <Switch isChecked={notifications} onToggle={toggleNotifications} />
            </View>
          </Box>

          <Box p={4} bg="white" borderRadius="md" shadow={2}>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>General</Text>
            <Button mt={4} onPress={() => setShowReportForm(!showReportForm)}>
              Reportar un Problema
            </Button>

            {showReportForm && (
              <View style={{ width: "100%", marginTop: 10, paddingHorizontal: 10 }}>
                <TextInput
                  placeholder="Describe el problema"
                  value={reportText}
                  onChangeText={setReportText}
                  multiline
                  style={{ height: 100, borderColor: "gray", borderWidth: 1, padding: 10, borderRadius: 5, backgroundColor: "white" }}
                />
                <Button mt={2} onPress={handleSendReport}>Enviar Reporte</Button>
              </View>
            )}
            <Button mt={2} onPress={() => Linking.openURL("https://ejemplodePagina.com")}>Términos y Condiciones</Button>
          </Box>
        </VStack>

        <Button mt={6} onPress={() => navigation.goBack()} alignSelf="center">Volver</Button>
      </ScrollView>
    </View>
  );
};

export default ConfigurationScreen;

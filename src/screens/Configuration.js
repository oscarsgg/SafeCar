import {React, useState } from "react";
import { View, Text, ScrollView, TextInput, Alert } from "react-native";
import { Button, VStack, Box, Divider, Switch } from "native-base";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ConfigurationScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState(true);

  const [showReportForm, setShowReportForm] = useState(false);
  const [reportText, setReportText] = useState("");

  const handleSendReport = () => {

    if(!reportText){
      Alert.alert("Error", "Debes rellenar el campo para enviar un reporte");
      console.log("Error al enviar un reporte porque no hay datos a enviar");
    }else{
      Alert.alert("Exito", "Reporte enviado exitosamente");
      console.log("Reporte enviado:", reportText);
      setReportText("");
    }

    setShowReportForm(false);
  };

  const toggleNotifications = async () => {
    setNotifications(!notifications);
    // Aquí podrías guardar la preferencia en AsyncStorage o en Firestore
  };

  const logout = async () => {
    await AsyncStorage.removeItem("@user_data");
    navigation.reset({
      index: 0,
      routes: [{ name: "LoginScreen" }], // Redirigir a login
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f4f4f4" }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>Configuración</Text>

        <VStack space={4}>
          {/* Editar Perfil */}
          <Box p={4} bg="white" borderRadius="md" shadow={2}>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>Cuenta</Text>
            <Button mt={2} onPress={() => navigation.navigate("EditProfile")}>Editar Perfil</Button>
            <Button mt={2} onPress={logout} colorScheme="danger">Eliminar Cuenta</Button>
          </Box>

          {/* Ajustes de Notificaciones */}
          <Box p={4} bg="white" borderRadius="md" shadow={2}>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>Notificaciones</Text>
            <Divider my={2} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text>Recordatorios de Pólizas</Text>
              <Switch isChecked={notifications} onToggle={toggleNotifications} />
            </View>
          </Box>

          {/* Opciones sobre la App */}
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

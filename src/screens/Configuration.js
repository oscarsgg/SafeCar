import React from "react";
import { View, Text } from "react-native";
import { Button } from "native-base";
import { useNavigation } from "@react-navigation/native";

const PolizasScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>Historial de Pólizas</Text>
      <Button mt={4} onPress={() => navigation.goBack()}>
        Volver
      </Button>
    </View>
  );
};

export default PolizasScreen;

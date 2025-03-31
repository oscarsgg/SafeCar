import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, TextInput, Alert, TouchableOpacity } from "react-native";
import { Button } from "native-base";
import { useNavigation } from "@react-navigation/native";
import { getUserData, updateUserData } from "../utils/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const EditProfile = () => {
  const navigation = useNavigation();
  const [firstName, setFirstname] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [secureText, setSecureText] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const user = await getUserData();
      if (user) {
        setFirstname(user.firstName || "");
        setLastName(user.lastName || "");
        setPassword(user.password || "");
        setEmail(user.email || "");
      }
    };
    fetchData();
  }, []);

  const saveUserData = async (userData) => {
    try {
      await AsyncStorage.setItem('@user_data', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };
  
  const guardarInfo = async () => {
    if (!email) {
      Alert.alert("Error", "No se pudo obtener el email del usuario.");
      return;
    }
  
    if (!firstName || !lastName || !password){
      Alert.alert("Error", "Llena todos los campos");
      return;
    }

    const newData = { firstName, lastName, password, email };
  
    await updateUserData(email, newData);
    await saveUserData(newData);
  
    Alert.alert("Éxito", "Perfil actualizado correctamente.");
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Perfil</Text>
      <TextInput
        style={styles.input}
        value={firstName}
        onChangeText={setFirstname}
        placeholder="Nombre"
      />
      <TextInput
        style={styles.input}
        value={lastName}
        onChangeText={setLastName}
        placeholder="Apellido"
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          value={password}
          onChangeText={setPassword}
          placeholder="Contraseña"
          secureTextEntry={secureText}
        />
        <TouchableOpacity onPress={() => setSecureText(!secureText)}>
          <Ionicons name={secureText ? "eye-off" : "eye"} size={24} color="gray" />
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        <Button colorScheme="danger" onPress={() => navigation.goBack()}>
          Cancelar
        </Button>
        <Button size="lg" colorScheme="primary" onPress={guardarInfo} _text={{ fontSize: "md" }}>
          Guardar Información
        </Button>
      </View>
    </View>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    width: "80%",
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "80%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    height: 40,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
  }
});

'use client';

import React, { useState } from "react";
import { ImageBackground, View } from 'react-native';
import { Box, Text, Button, VStack, Input, Image, HStack, Pressable, Icon } from 'native-base';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Mail } from 'lucide-react-native';
import { useUser } from "../context/userContext"; //context para guardar globalmente el usuario bro

const LoginScreen = ({ onLogin, navigation }) => {
  const { setUser } = useUser(); // la fyunciin que guarda el usuario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      console.log("Attempting login with email:", email);
      const usersRef = collection(db, "log");
      const q = query(usersRef, where("email", "==", email.toLowerCase().trim()));
      const querySnapshot = await getDocs(q);
      
      console.log("Query snapshot size:", querySnapshot.size);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        if (userData.password === password) {
          setUser(userData); // Guardamos el usuario globalmente
          onLogin(userData);
        } else {
          console.log("Incorrect password");
          alert("Contraseña incorrecta");
        }
      } else {
        console.log("No user found with this email");
        alert("Usuario no encontrado");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      alert("Error al iniciar sesión: " + error.message);
    }
  };

  return (
    <LinearGradient
      colors={['#2563eb', '#3b82f6', '#60a5fa']}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Box flex={1} justifyContent="center" alignItems="center" px={6} py={10}>
          <Box 
            bg="white" 
            rounded="3xl" 
            width="100%" 
            p={6}
            shadow={5}
          >
            <VStack space={6} alignItems="center">
              <Image 
                source={require('../../img/logogod.png')} 
                alt="Car Insurance"
                size="xl"
                resizeMode="contain"
              />
              
              <VStack space={2} width="100%">
                <Text fontSize="3xl" fontWeight="bold" color="blue.600" textAlign="center">
                  DiddyDrive
                </Text>
                <Text color="gray.500" textAlign="center">
                  Tu seguridad es nuestra prioridad
                </Text>
              </VStack>

              <VStack space={4} width="100%">
                <Input
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  size="lg"
                  borderRadius="full"
                  backgroundColor="gray.50"
                  InputLeftElement={
                    <Mail size={20} color="gray" style={{ marginLeft: 10 }} />
                  }
                />
                <Input
                  placeholder="Contraseña"
                  value={password}
                  onChangeText={setPassword}
                  type="password"
                  size="lg"
                  borderRadius="full"
                  backgroundColor="gray.50"
                  InputLeftElement={
                    <Lock size={20} color="gray" style={{ marginLeft: 10 }} />
                  }
                />

                <Button 
                  onPress={handleLogin}
                  size="lg"
                  rounded="full"
                  bg="blue.600"
                  _pressed={{ bg: "blue.700" }}
                  shadow={3}
                >
                  Iniciar Sesión
                </Button>
              </VStack>

              <Text color="gray.500">
                ¿No tienes una cuenta?{" "}
                <Text color="blue.600" fontWeight="bold" onPress={() => navigation.navigate('Register')}>
                  Regístrate aquí
                </Text>
              </Text>
            </VStack>
          </Box>
        </Box>
      </ScrollView>
    </LinearGradient>
  );
};

export default LoginScreen;
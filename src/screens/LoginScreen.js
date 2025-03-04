'use client';

import React, { useState } from 'react';
import { Box, Text, Button, VStack, Input, Image, ScrollView } from 'native-base';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Mail } from 'lucide-react-native';

const LoginScreen = ({ navigation, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Función para validar el correo
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Manejo del inicio de sesión
  const handleLogin = async () => {
    try {
      if (!email.trim() || !password.trim()) {
        alert("Todos los campos son obligatorios");
        return;
      }

      if (!isValidEmail(email)) {
        alert("Ingrese un correo válido");
        return;
      }

      if (password.length < 4) {
        alert("La contraseña debe tener al menos 4 caracteres");
        return;
      }

      console.log("Intentando login con:", email);
      const usersRef = collection(db, "log");
      const q = query(usersRef, where("email", "==", email.toLowerCase().trim()));
      const querySnapshot = await getDocs(q);

      console.log("Resultados de la búsqueda:", querySnapshot.size);

      if (!querySnapshot.empty) {
        // Usuario encontrado, verificamos la contraseña
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        console.log("Usuario encontrado:", userData);

        if (userData.password === password) {
          console.log("Inicio de sesión exitoso");
          onLogin({ id: userDoc.id, ...userData });
        } else {
          console.log("Contraseña incorrecta");
          alert("Contraseña incorrecta");
        }
      } else {
        console.log("Usuario no encontrado");
        alert("Usuario no encontrado. Verifique su correo o registre una nueva cuenta.");
      }
    } catch (error) {
      console.error("Error en el inicio de sesión:", error);
      alert("Error al iniciar sesión: " + error.message);
    }
  };

  return (
    <LinearGradient colors={['#2563eb', '#3b82f6', '#60a5fa']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Box flex={1} justifyContent="center" alignItems="center" px={6} py={10}>
          <Box bg="white" rounded="3xl" width="100%" p={6} shadow={5}>
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
                  InputLeftElement={<Mail size={20} color="gray" style={{ marginLeft: 10 }} />}
                />
                <Input
                  placeholder="Contraseña"
                  value={password}
                  onChangeText={setPassword}
                  type="password"
                  size="lg"
                  borderRadius="full"
                  backgroundColor="gray.50"
                  InputLeftElement={<Lock size={20} color="gray" style={{ marginLeft: 10 }} />}
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

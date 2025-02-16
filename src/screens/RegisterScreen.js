'use client';

import React, { useState } from 'react';
import { Box, Text, Button, VStack, Input, Image, ScrollView } from 'native-base';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Mail, User } from 'lucide-react-native';

const RegisterScreen = ({ navigation, onLogin }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      const docRef = await addDoc(collection(db, "log"), {
        firstName,
        lastName,
        email,
        password // Nota: En una aplicación real, deberías hashear la contraseña antes de almacenarla
      });
      console.log("Document written with ID: ", docRef.id);
      alert("Cuenta creada exitosamente");
      onLogin({ id: docRef.id, firstName, lastName, email });
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Error al crear la cuenta");
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
                  Regístrate en DiddyDrive
                </Text>
                <Text color="gray.500" textAlign="center">
                  Crea tu cuenta y comienza a proteger tu vehículo
                </Text>
              </VStack>

              <VStack space={4} width="100%">
                <Input
                  placeholder="Nombre"
                  value={firstName}
                  onChangeText={setFirstName}
                  size="lg"
                  borderRadius="full"
                  backgroundColor="gray.50"
                  InputLeftElement={
                    <User size={20} color="gray" style={{ marginLeft: 10 }} />
                  }
                />
                <Input
                  placeholder="Apellido"
                  value={lastName}
                  onChangeText={setLastName}
                  size="lg"
                  borderRadius="full"
                  backgroundColor="gray.50"
                  InputLeftElement={
                    <User size={20} color="gray" style={{ marginLeft: 10 }} />
                  }
                />
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
                  onPress={handleRegister}
                  size="lg"
                  rounded="full"
                  bg="blue.600"
                  _pressed={{ bg: "blue.700" }}
                  shadow={3}
                >
                  Registrarse
                </Button>
              </VStack>

              <Text color="gray.500">
                ¿Ya tienes una cuenta?{" "}
                <Text color="blue.600" fontWeight="bold" onPress={() => navigation.navigate('Login')}>
                  Inicia sesión aquí
                </Text>
              </Text>
            </VStack>
          </Box>
        </Box>
      </ScrollView>
    </LinearGradient>
  );
};

export default RegisterScreen;
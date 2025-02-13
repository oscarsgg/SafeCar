'use client';

import React, { useState } from 'react';
import { ImageBackground, View } from 'react-native';
import { Box, Text, Button, VStack, Input, Image, HStack, Pressable, Icon } from 'native-base';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Mail } from 'lucide-react-native';

const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const q = query(collection(db, "log"), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        if (userData.password === password) {
          onLogin(userData);
        } else {
          alert("Contraseña incorrecta");
        }
      } else {
        alert("Usuario no encontrado");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      alert("Error al iniciar sesión");
    }
  };

  return (
    <LinearGradient
      colors={['#2563eb', '#3b82f6', '#60a5fa']}
      style={{ flex: 1, padding: 20 }}
    >
      <Box flex={1} justifyContent="center" alignItems="center">
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
              <Box>
                <Input
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  size="xl"
                  borderRadius="full"
                  backgroundColor="gray.50"
                  InputLeftElement={
                    <Icon as={Mail} size="sm" ml={4} color="gray.400" />
                  }
                />
              </Box>

              <Box>
                <Input
                  placeholder="Contraseña"
                  value={password}
                  onChangeText={setPassword}
                  type="password"
                  size="xl"
                  borderRadius="full"
                  backgroundColor="gray.50"
                  InputLeftElement={
                    <Icon as={Lock} size="sm" ml={4} color="gray.400" />
                  }
                />
              </Box>

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

            {/* <VStack space={4} width="100%" alignItems="center">
              <Text color="gray.500">O continuar con</Text>
              <HStack space={4}>
                <Pressable>
                  <Box p={3} bg="gray.100" rounded="full">
                    <Image 
                      source={{ uri: 'https://www.google.com/favicon.ico' }}
                      alt="Google"
                      size="sm"
                    />
                  </Box>
                </Pressable>
                <Pressable>
                  <Box p={3} bg="gray.100" rounded="full">
                    <Image 
                      source={{ uri: 'https://www.facebook.com/favicon.ico' }}
                      alt="Facebook"
                      size="sm"
                    />
                  </Box>
                </Pressable>
                <Pressable>
                  <Box p={3} bg="gray.100" rounded="full">
                    <Image 
                      source={{ uri: 'https://www.apple.com/favicon.ico' }}
                      alt="Apple"
                      size="sm"
                    />
                  </Box>
                </Pressable>
              </HStack>
            </VStack> */}
          </VStack>
        </Box>
      </Box>
    </LinearGradient>
  );
};

export default LoginScreen;
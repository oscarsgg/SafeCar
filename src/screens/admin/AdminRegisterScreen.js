import React, { useState } from 'react';
import { 
  Box, 
  VStack, 
  Text, 
  Heading, 
  ScrollView, 
  Input, 
  Button, 
  FormControl,
  useToast,
  Icon,
  HStack
} from 'native-base';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../db/firebase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminRegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const toast = useToast();

  const validateForm = () => {
    const newErrors = {};
    
    // Validar nombre
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }
    
    // Validar apellido
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }
    
    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    // Validar contraseña
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 4) {
      newErrors.password = 'La contraseña debe tener al menos 4 caracteres';
    }
    
    // Validar confirmación de contraseña
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (validateForm()) {
      try {
        setLoading(true);
        
        // Verificar si el email ya existe
        const usersRef = collection(db, "log");
        const q = query(usersRef, where("email", "==", formData.email.toLowerCase().trim()));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setErrors({ email: 'Este email ya está registrado' });
          setLoading(false);
          return;
        }
        
        // Crear nuevo administrador
        const newAdmin = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
          isAdmin: true,
          fechaRegistro: new Date(),
        };
        
        await addDoc(collection(db, "log"), newAdmin);
        
        toast.show({
          description: "Administrador registrado exitosamente",
          status: "success"
        });
        
        navigation.goBack();
      } catch (error) {
        console.error("Error al registrar administrador:", error);
        toast.show({
          description: "Error al registrar administrador",
          status: "error"
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <ScrollView>
      <Box p={6} flex={1} safeArea>
        <VStack space={6}>
          <VStack space={2} alignItems="center">
            <Icon as={Ionicons} name="shield" size={16} color="blue.500" />
            <Heading size="xl" color="blue.600" textAlign="center">
              Registrar Administrador
            </Heading>
            <Text color="gray.500" textAlign="center">
              Crea una cuenta con privilegios de administrador
            </Text>
          </VStack>
          
          <VStack space={4}>
            <HStack space={2}>
              <FormControl flex={1} isInvalid={'firstName' in errors}>
                <FormControl.Label>Nombre</FormControl.Label>
                <Input
                  placeholder="Nombre"
                  value={formData.firstName}
                  onChangeText={value => setFormData({...formData, firstName: value})}
                />
                <FormControl.ErrorMessage>
                  {errors.firstName}
                </FormControl.ErrorMessage>
              </FormControl>
              
              <FormControl flex={1} isInvalid={'lastName' in errors}>
                <FormControl.Label>Apellido</FormControl.Label>
                <Input
                  placeholder="Apellido"
                  value={formData.lastName}
                  onChangeText={value => setFormData({...formData, lastName: value})}
                />
                <FormControl.ErrorMessage>
                  {errors.lastName}
                </FormControl.ErrorMessage>
              </FormControl>
            </HStack>
            
            <FormControl isInvalid={'email' in errors}>
              <FormControl.Label>Email</FormControl.Label>
              <Input
                placeholder="correo@ejemplo.com"
                value={formData.email}
                onChangeText={value => setFormData({...formData, email: value})}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <FormControl.ErrorMessage>
                {errors.email}
              </FormControl.ErrorMessage>
            </FormControl>
            
            <FormControl isInvalid={'password' in errors}>
              <FormControl.Label>Contraseña</FormControl.Label>
              <Input
                placeholder="Contraseña"
                value={formData.password}
                onChangeText={value => setFormData({...formData, password: value})}
                type="password"
              />
              <FormControl.ErrorMessage>
                {errors.password}
              </FormControl.ErrorMessage>
            </FormControl>
            
            <FormControl isInvalid={'confirmPassword' in errors}>
              <FormControl.Label>Confirmar Contraseña</FormControl.Label>
              <Input
                placeholder="Confirmar contraseña"
                value={formData.confirmPassword}
                onChangeText={value => setFormData({...formData, confirmPassword: value})}
                type="password"
              />
              <FormControl.ErrorMessage>
                {errors.confirmPassword}
              </FormControl.ErrorMessage>
            </FormControl>
          </VStack>
          
          <Button
            size="lg"
            colorScheme="blue"
            onPress={handleRegister}
            isLoading={loading}
            isLoadingText="Registrando..."
          >
            Registrar Administrador
          </Button>
          
          <Button
            variant="ghost"
            onPress={() => navigation.goBack()}
          >
            Cancelar
          </Button>
        </VStack>
      </Box>
    </ScrollView>
  );
};

export default AdminRegisterScreen;
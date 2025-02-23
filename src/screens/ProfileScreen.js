import React, { useState, useEffect } from 'react';
import { ScrollView } from 'react-native';
import { VStack, Box, Text, Divider, Button, AlertDialog } from 'native-base';
import { List } from 'react-native-paper';
import Header from '../components/Header';
import ProfileCard from '../components/ProfileCard';
import { getUserData, handleLogout } from '../utils/functions';
import { useUser } from '../context/userContext';
import { useNavigation } from '@react-navigation/native';

const ProfileScreen = () => {
  const { setUser } = useUser(); // Acceder a setUser desde el contexto
  const [userData, setUserData] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigation = useNavigation();

  const onClose = () => setIsOpen(false);

  const cancelRef = React.useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const data = await getUserData(); // Usar la función importada
      setUserData(data);
    };

    fetchUserData();
  }, []);

  const handleLogoutConfirmation = () => {
    setIsOpen(true);
  };

  const confirmLogout = () => {
    onClose();
    handleLogout(setUser);
    navigation.navigate('MainApp'); 
  };

  return (
    <ScrollView>
      <VStack>
        <Header />
        <Box p={4}>
          <ProfileCard userData={userData} />
          <Divider my={4} />
          <Text fontSize="xl" fontWeight="bold" mb={4}>
            Opciones de cuenta
          </Text>
          <List.Section>
            <List.Item 
              title="Editar Perfil" 
              left={props => <List.Icon {...props} icon="account-edit" />} 
              onPress={() => {/* Implementar edición de perfil */}}
            />
            <List.Item 
              title="Mis Vehículos" 
              left={props => <List.Icon {...props} icon="car-multiple" />} 
              onPress={() => {/* Implementar vista de vehículos */}}
            />
            <List.Item 
              title="Historial de Pólizas" 
              left={props => <List.Icon {...props} icon="file-document-multiple" />} 
              onPress={() => {/* Implementar historial de pólizas */}}
            />
            <List.Item 
              title="Configuración" 
              left={props => <List.Icon {...props} icon="cog" />} 
              onPress={() => {/* Implementar configuración */}}
            />
          </List.Section>
          <Button mt={4} colorScheme="danger" onPress={handleLogoutConfirmation}>
            Cerrar Sesión
          </Button>
        </Box>
      </VStack>

      <AlertDialog leastDestructiveRef={cancelRef} isOpen={isOpen} onClose={onClose}>
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>Cerrar Sesión</AlertDialog.Header>
          <AlertDialog.Body>
            ¿Estás seguro que quieres cerrar sesión?
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button.Group space={2}>
              <Button variant="unstyled" colorScheme="coolGray" onPress={onClose} ref={cancelRef}>
                Cancelar
              </Button>
              <Button colorScheme="danger" onPress={confirmLogout}>
                Cerrar Sesión
              </Button>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </ScrollView>
  );
};

export default ProfileScreen;

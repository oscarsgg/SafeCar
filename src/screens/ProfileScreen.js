import React from 'react';
import { ScrollView } from 'react-native';
import { VStack, Box, Text, Divider } from 'native-base';
import { List } from 'react-native-paper';
import Header from '../components/Header';
import ProfileCard from '../components/ProfileCard';
import { handleLogout } from '../utils/functions';
import { useUser } from '../context/userContext';

const ProfileScreen = () => {
  const { setUser } = useUser();

  return (
    <ScrollView>
      <VStack>
        <Header />
        <Box p={4}>
          <ProfileCard />
          <Divider my={4} />
          <Text fontSize="xl" fontWeight="bold" mb={4}>
            Opciones de cuenta
          </Text>
          <List.Section>
            <List.Item 
              title="Editar Perfil" 
              left={props => <List.Icon {...props} icon="account-edit" />} 
            />
            <List.Item 
              title="Mis Vehículos" 
              left={props => <List.Icon {...props} icon="car-multiple" />} 
            />
            <List.Item 
              title="Historial de Pólizas" 
              left={props => <List.Icon {...props} icon="file-document-multiple" />} 
            />
            <List.Item 
              title="Configuración" 
              left={props => <List.Icon {...props} icon="cog" />} 
            />
            <List.Item 
              title="Cerrar Sesión"
              left={props => <List.Icon {...props} icon="account-remove" />}
              onPress={() => handleLogout(setUser)}
            />
          </List.Section>
        </Box>
      </VStack>
    </ScrollView>
  );
};

export default ProfileScreen;

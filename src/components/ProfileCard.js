import {React, useState, useEffect} from 'react';
import { Avatar, Card, Title, Paragraph } from 'react-native-paper';
import { VStack, HStack, Text, Icon } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/userContext'; 
import { getCarCount } from "../utils/functions";

const ProfileCard = () => {
  const { user } = useUser(); // Obtiene el usuario globalmente
  const [carCount, setCarCount] = useState(0);

  useEffect(() => {
    const fetchCarCount = async () => {
      if (user?.email) {
        const count = await getCarCount(user.email); // Asumiendo que getCarCount es asincrónico
        setCarCount(count || 0);
      }
    };
    fetchCarCount();
  }, [user?.email]);

  return (
    <Card elevation={3} style={{ 
      margin: 10,
      backgroundColor: '#f7f7f7',
      borderColor: '#007bff',
      borderWidth: 1,
      borderRadius: 10,
    }}>
      <Card.Content>
        <VStack space={4} alignItems="center">
          <Avatar.Image 
            size={135}
            source={require('../../img/main.png')}
          />
          <Title>{user?.firstName} {user?.lastName}</Title>
          <Paragraph>{user?.email || '(Sin correo electrónico)'}</Paragraph>
          <HStack space={4}>
            <VStack alignItems="center">
              <Icon as={Ionicons} name="car-outline" size={6} color="primary.500" />
              <Text>{carCount || 0} Vehículos</Text>
            </VStack>
            <VStack alignItems="center">
              <Icon as={Ionicons} name="shield-checkmark-outline" size={6} color="primary.500" />
              <Text>{user?.activePolicies || 0} Póliza(s) Activa(s)</Text>
            </VStack>
          </HStack>
        </VStack>
      </Card.Content>
    </Card>
  );
};

export default ProfileCard;

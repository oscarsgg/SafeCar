import {React, useState, useEffect, useCallback} from 'react';
import { Avatar, Card, Title, Paragraph } from 'react-native-paper';
import { VStack, HStack, Text, Icon } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { getCarCount, getPolizaCount } from '../utils/functions';
import { useFocusEffect } from "@react-navigation/native";

const ProfileCard = ({ userData }) => {
  const [carCount, setCarCount] = useState(0);
  const [polizaCount, setPolizaCount] = useState(0);
  
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        if (userData?.email) {
          try {
            const carCountData = await getCarCount(userData.email);
            const polizaCountData = await getPolizaCount(userData.email);
            setCarCount(carCountData);
            setPolizaCount(polizaCountData);
          } catch (error) {
            console.error("Error obteniendo los datos:", error);
          }
        }
      };

      fetchData();
    }, [userData])
  );

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
          <Title>{userData?.firstName} {userData?.lastName}</Title>
          <Paragraph>{userData?.email || '(Sin correo electronico)'}</Paragraph>
          <HStack space={4}>
            <VStack alignItems="center">
              <Icon as={Ionicons} name="car-outline" size={6} color="primary.500" />
              <Text>{carCount} Vehículos</Text>
            </VStack>
            <VStack alignItems="center">
              <Icon as={Ionicons} name="shield-checkmark-outline" size={6} color="primary.500" />
              <Text>{polizaCount} Póliza(s) Activa(s)</Text>
            </VStack>
          </HStack>
        </VStack>
      </Card.Content>
    </Card>
  );
};

export default ProfileCard;
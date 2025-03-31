import {React, useState, useEffect, useCallback} from 'react';
import { Avatar, Card, Title, Paragraph } from 'react-native-paper';
import { VStack, HStack, Text, Icon } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { getCarCount, getPolizaCount } from '../utils/functions';
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileCard = () => {
  const [userData, setUserData] = useState(null);
  const [carCount, setCarCount] = useState(0);
  const [polizaCount, setPolizaCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        try {
          const user = await AsyncStorage.getItem("@user_data");
          if (user) {
            const parsedUser = JSON.parse(user);
            setUserData(parsedUser);

            if (parsedUser.email) {
              const carCountData = await getCarCount(parsedUser.email);
              const polizaCountData = await getPolizaCount(parsedUser.email);
              setCarCount(carCountData);
              setPolizaCount(polizaCountData);
            }
          }
        } catch (error) {
          console.error("Error obteniendo los datos:", error);
        }
      };

      fetchUserData();
    }, [])
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
          <Paragraph>{userData?.email || '(Sin correo electrónico)'}</Paragraph>
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

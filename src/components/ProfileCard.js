import {React, useState, useEffect} from 'react';
import { Avatar, Card, Title, Paragraph } from 'react-native-paper';
import { VStack, HStack, Text, Icon } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/userContext'; 

import { getCarCount, formatPhoneNumber } from "../utils/functions";

const ProfileCard = () => {

  const { user } = useUser();
  const [carCount, setCarCount] = useState(0);

  useEffect(() => {

    //console.log("User data:", user);
    const fetchCount = async () => {
      const count = await getCarCount(user.email);
      setCarCount(count);
    };

    if (user?.email) {
      fetchCount();
    }
  }, [user]);

  const numeroFormato = formatPhoneNumber(user.phone);

  return (
    <Card elevation={3} style={{ margin: 10,
      backgroundColor: '#f7f7f7',
      //blue border
      borderColor: '#007bff',
      
      // borderWidth: 1,
      // borderRadius: 10,
    }}>
      <Card.Content>
        <VStack space={4} alignItems="center">
          <Avatar.Image 
            size={135}
            //img folder image
            source={ require('../../img/main.png') }
          />
          <Title>{user.usuario}</Title>
          <Paragraph>{numeroFormato}</Paragraph>
          <HStack space={4}>
            <VStack alignItems="center">
              <Icon as={Ionicons} name="car-outline" size={6} color="primary.500" />
              <Text>{carCount} Vehículos</Text>
            </VStack>
            <VStack alignItems="center">
              <Icon as={Ionicons} name="shield-checkmark-outline" size={6} color="primary.500" />
              <Text>1 Póliza Activa</Text>
            </VStack>
          </HStack>
        </VStack>
      </Card.Content>
    </Card>
  );
};

export default ProfileCard;
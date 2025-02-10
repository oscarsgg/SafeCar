import React from 'react';
import { Avatar, Card, Title, Paragraph } from 'react-native-paper';
import { VStack, HStack, Text, Icon } from 'native-base';
import { Ionicons } from '@expo/vector-icons';

const ProfileCard = () => {
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
          <Title>Oscar Gael</Title>
          <Paragraph>(664) 487-9993</Paragraph>
          <HStack space={4}>
            <VStack alignItems="center">
              <Icon as={Ionicons} name="car-outline" size={6} color="primary.500" />
              <Text>2 Vehículos</Text>
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
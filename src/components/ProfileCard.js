import {React, useState, useEffect} from 'react';
import { Avatar, Card, Title, Paragraph } from 'react-native-paper';
import { VStack, HStack, Text, Icon } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/userContext'; 

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../db/firebase';

const getUserDocId = async (email) => {
  try {
    const logRef = collection(db, 'log');
    const docsId = query(logRef, where('email', '==', email)); 
    //el query para buscar el id del docs en base al correo
    const querySnapshot = await getDocs(docsId);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id; // 0 porqe es el primero y unico(deberia)
    } else {
      console.log('No se encontró el usuario en log/');
      return null;
    }
  } catch (error) {
    console.error('Error obteniendo ID del usuario:', error);
    return null;
  }
};

const getCarCount = async (email) => {
  try {
    const userId = await getUserDocId(email);

    //console.log(`Buscando autos en log/${userId}/carrosUser`);
    const carrosRef = collection(db, `log/${userId}/carrosUser`);
    const querySnapshot = await getDocs(carrosRef);

    return querySnapshot.size;
  } catch (error) {
    console.error('Error obteniendo conteo de carros:', error);
    return 0;
  }
};

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
          <Paragraph>(664) 487-9993</Paragraph>
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
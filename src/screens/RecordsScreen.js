'use client';

import React, { useState, useEffect } from 'react';
import { RefreshControl } from 'react-native';
import { Box, FlatList, Text, VStack, HStack, Spinner, Heading } from 'native-base';
import { collection, getDocs } from 'firebase/firestore';
import { db } from "../../db/firebase";

const RecordsScreen = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecords = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'log')); // Cambia 'registros' por el nombre de tu colección
      const recordsData = [];
      querySnapshot.forEach((doc) => {
        recordsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setRecords(recordsData);
    } catch (error) {
      console.error("Error fetching records: ", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []); //Added [] to specify dependencies

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchRecords();
  }, []);

  const renderItem = ({ item }) => (
    <Box 
      bg="white" 
      shadow={2} 
      rounded="lg" 
      mb={3} 
      mx={3}
      p={4}
    >
      <VStack space={2}>
        <HStack justifyContent="space-between">
          <Text bold fontSize="md">ID: {item.id}</Text>
          {/* Ajusta estos campos según la estructura de tus datos */}
          <Text color="gray.500">{item.email || 'Sin fecha'}</Text>
        </HStack>
        {/* Renderiza aquí los campos de tus registros */}
        {Object.entries(item).map(([key, value]) => {
          if (key !== 'id') {
            return (
              <HStack key={key} justifyContent="space-between">
                <Text color="gray.600">{key}:</Text>
                <Text>{typeof value === 'object' ? JSON.stringify(value) : value}</Text>
              </HStack>
            );
          }
        })}
      </VStack>
    </Box>
  );

  if (loading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="lg" />
        <Text mt={4}>Cargando registros...</Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="gray.100">
      <Heading p={4} size="lg">Registros</Heading>
      <FlatList
        data={records}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Box p={4} alignItems="center">
            <Text>No hay registros disponibles</Text>
          </Box>
        }
      />
    </Box>
  );
};

export default RecordsScreen;
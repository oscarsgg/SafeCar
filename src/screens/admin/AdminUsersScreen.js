import React, { View, useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Heading, 
  Icon, 
  Pressable,
  Input,
  Button,
  useColorModeValue,
  Badge,
  Spinner,
  FlatList,
  ScrollView
} from 'native-base';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../db/firebase';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Header from '../../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminUsersScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBgColor = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    getCurrentUser();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchText) {
      const filtered = users.filter(user => 
        user.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchText, users]);

  const getCurrentUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('@user_data');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error retrieving user data:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, "log");
      const usersSnapshot = await getDocs(usersRef);
      
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserStatusChange = async (userId, isActive) => {
    try {
      // No permitir desactivar al usuario actual
      if (currentUser && currentUser.id === userId) {
        alert("No puedes desactivar tu propia cuenta");
        return;
      }
      
      const userRef = doc(db, "log", userId);
      await updateDoc(userRef, {
        isActive: !isActive
      });
      
      // Actualizar la lista local
      setUsers(users.map(user => 
        user.id === userId ? {...user, isActive: !isActive} : user
      ));
    } catch (error) {
      console.error("Error al actualizar estado del usuario:", error);
    }
  };

  const renderUserItem = ({ item }) => (
    <Pressable onPress={() => navigation.navigate('UserDetails', { userId: item.id })}>
      {({ isPressed }) => (
        <Box
          bg={cardBgColor}
          p={4}
          rounded="xl"
          shadow={2}
          mb={3}
          style={{
            transform: [{ scale: isPressed ? 0.98 : 1 }]
          }}
        >
          <HStack justifyContent="space-between" alignItems="center">
            <HStack space={3} alignItems="center">
              <Icon 
                as={Ionicons} 
                name={item.isAdmin ? "shield" : "person"} 
                size={6} 
                color={item.isAdmin ? "purple.500" : "blue.500"} 
              />
              <VStack>
                <Text fontSize="md" fontWeight="bold" color={textColor}>
                  {item.firstName} {item.lastName}
                </Text>
                <Text fontSize="sm" color={secondaryTextColor}>
                  {item.email}
                </Text>
              </VStack>
            </HStack>
            
            <HStack space={2} alignItems="center">
              {item.isAdmin && (
                <Badge colorScheme="purple" variant="subtle" rounded="full">
                  Admin
                </Badge>
              )}
              <Badge 
                colorScheme={item.isActive !== false ? "green" : "red"} 
                variant="subtle" 
                rounded="full"
              >
                {item.isActive !== false ? "Activo" : "Inactivo"}
              </Badge>
              <Pressable onPress={() => handleUserStatusChange(item.id, item.isActive !== false)}>
                <Icon 
                  as={MaterialIcons} 
                  name={item.isActive !== false ? "block" : "check-circle"} 
                  size={5} 
                  color={item.isActive !== false ? "red.500" : "green.500"} 
                />
              </Pressable>
            </HStack>
          </HStack>
        </Box>
      )}
    </Pressable>
  );

  return (
    <Box flex={1} bg={bgColor} >
      <Header />
  
      <Box flex={1} p={6}>
        <VStack space={4}>
          <HStack justifyContent="space-between" alignItems="center">
            <Heading size="lg" color={textColor}>Gestión de Usuarios</Heading>
          </HStack>
          <Button 
              leftIcon={<Icon as={Ionicons} name="person-add" size="sm" />}
              onPress={() => navigation.navigate('AdminRegister')}
              colorScheme="blue"
              variant="solid"
              size="sm"
            >
              Nuevo Admin
            </Button>
  
          <Input
            placeholder="Buscar usuario..."
            value={searchText}
            onChangeText={setSearchText}
            width="100%"
            borderRadius="full"
            py={2}
            px={3}
            InputLeftElement={
              <Icon as={Ionicons} name="search" size={5} ml={2} color="gray.400" />
            }
            InputRightElement={
              searchText ? (
                <Pressable onPress={() => setSearchText('')} mr={2}>
                  <Icon as={Ionicons} name="close" size={5} color="gray.400" />
                </Pressable>
              ) : null
            }
          />
  
          {loading ? (
            <Box flex={1} justifyContent="center" alignItems="center">
              <Spinner size="lg" color="blue.500" />
            </Box>
          ) : (
            <FlatList
              data={filteredUsers}
              renderItem={renderUserItem}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Box flex={1} justifyContent="center" alignItems="center" py={10}>
                  <Icon as={Ionicons} name="search" size={12} color="gray.300" />
                  <Text color="gray.400" mt={2}>No se encontraron usuarios</Text>
                </Box>
              }
            />
          )}
        </VStack>
      </Box>
    </Box>
  );
    
};

export default AdminUsersScreen;
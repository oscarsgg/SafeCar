import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, TouchableOpacity, Alert, Linking, RefreshControl } from 'react-native';
import { VStack, HStack, Box, Text, Heading, Icon, Divider, useTheme, Spinner, Pressable } from 'native-base';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Header from '../components/Header';
import CarInsuranceCard from '../components/CarInsuranceCard';
import ReportCard from '../components/ReportCard';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from "../../db/firebase";

const HomeScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [hasActiveReport, setHasActiveReport] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAmplioPolicy, setHasAmplioPolicy] = useState(false);
  const [carLocation, setCarLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      fetchActiveReports();
      checkAmplioPolicy();
    }
  }, [userData]);

  const getUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('@user_data');
      if (data) {
        setUserData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error retrieving user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar la recarga al deslizar hacia abajo
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Recargar todos los datos necesarios
      await getUserData();
      if (userData) {
        await Promise.all([
          fetchActiveReports(),
          checkAmplioPolicy()
        ]);
      }
      // Si tienes carLocation, también podrías actualizarlo aquí
      if (hasAmplioPolicy) {
        await fetchCarLocation(false); // false para no mostrar el indicador de carga
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [userData, hasAmplioPolicy]);

  // Verificar si el usuario tiene una póliza de cobertura amplia
  const checkAmplioPolicy = async () => {
    try {
      const userLogRef = `log/${userData.id}`; // Ruta base del usuario

      if (!userData || !userData.id) return;
      
      const transaccionesRef = collection(db, `${userLogRef}/polizaUser`);
      const q = query(
        transaccionesRef,
        where('polizaId', '==', 'amplio')
      );
      
      const querySnapshot = await getDocs(q);
      setHasAmplioPolicy(!querySnapshot.empty);
    } catch (error) {
      console.error('Error checking amplio policy:', error);
      setHasAmplioPolicy(false);
    }
  };

  // Simular la obtención de coordenadas GPS del ESP32
  const fetchCarLocation = async (showLoading = true) => {
    if (showLoading) {
      setLoadingLocation(true);
    }
    
    try {
      // En un entorno real, aquí harías una petición HTTP al ESP32
      // Por ahora, simulamos una respuesta con coordenadas aleatorias en México
      
      // Simulamos un pequeño retraso para la petición
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Coordenadas simuladas (Ciudad de México y alrededores)
      const simulatedLocations = [
        { latitude: 32.456000, longitude: -116.886500, address: "Delicias, Tijuana" },
        { latitude: 32.465800, longitude: -116.866900, address: "Altiplano, Tijuana" },
        { latitude: 32.479400, longitude: -116.905000, address: "El Pípila, Tijuana" },
        { latitude: 32.485712, longitude: -116.847116, address: "El Florido, Tijuana" }
      ];
      
      // Seleccionar una ubicación aleatoria
      const randomLocation = simulatedLocations[Math.floor(Math.random() * simulatedLocations.length)];
      
      setCarLocation(randomLocation);
    } catch (error) {
      console.error('Error fetching car location:', error);
      if (showLoading) {
        Alert.alert(
          'Error',
          'No se pudo obtener la ubicación del vehículo. Intente nuevamente.'
        );
      }
    } finally {
      if (showLoading) {
        setLoadingLocation(false);
      }
    }
  };

  const handleLocationPress = () => {
    if (carLocation) {
      navigation.navigate('CarLocation', { location: carLocation });
    } else {
      fetchCarLocation();
    }
  };

  const fetchActiveReports = async () => {
    try {
      if (!userData || !userData.id) return;
      
      const reportsRef = collection(db, 'log', userData.id, 'reclamosUser');
      const q = query(
        reportsRef,
        where('estadoReclamo', 'in', ['Pendiente', 'En Revisión']),
        orderBy('fechaCreacion', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const reportDoc = querySnapshot.docs[0];
        const reportData = reportDoc.data();
        
        // Obtener información del vehículo si existe
        let vehicleInfo = null;
        if (reportData.vehiculoId) {
          try {
            const vehicleRef = doc(db, 'log', userData.id, 'carrosUser', reportData.vehiculoId);
            const vehicleSnap = await getDoc(vehicleRef);
            if (vehicleSnap.exists()) {
              vehicleInfo = vehicleSnap.data();
            }
          } catch (error) {
            console.error('Error fetching vehicle info:', error);
          }
        }
        
        // Mapear el tipo de incidente a un formato más amigable
        const incidentTypes = {
          collision: { name: 'Colisión', icon: 'car-crash' },
          roadside: { name: 'Asistencia vial', icon: 'tow-truck' },
          glass: { name: 'Rotura de cristales', icon: 'car-door' },
          theft: { name: 'Robo', icon: 'shield-alert' },
          terceros: { name: 'Daños a terceros', icon: 'car-multiple' }
        };
        
        // Crear el objeto de reporte formateado
        const formattedReport = {
          id: reportDoc.id,
          title: incidentTypes[reportData.tipoSiniestro]?.name || reportData.tipoSiniestro,
          description: reportData.descripcion || 'Sin descripción',
          status: reportData.estadoReclamo === 'Pendiente' ? 'pendiente' : 'en progreso',
          type: reportData.tipoSiniestro,
          date: reportData.fechaCreacion?.toDate?.() || new Date(reportData.fechaCreacion),
          vehicle: vehicleInfo ? `${vehicleInfo.marca} ${vehicleInfo.modelo} (${vehicleInfo.placa})` : 'Vehículo no especificado'
        };
        
        setActiveReport(formattedReport);
        setHasActiveReport(true);
      } else {
        setHasActiveReport(false);
        setActiveReport(null);
      }
    } catch (error) {
      console.error('Error fetching active reports:', error);
      setHasActiveReport(false);
    }
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'Asistencia 24/7',
      'Nuestro teléfono de emergencias es +52 55-0000-0000\n\n¿Desea llamar ahora?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Llamar',
          onPress: () => {
            Linking.openURL('tel:+52 55 0000 0000')
              .catch(err => console.error('Error al abrir la app de teléfono:', err));
          }
        }
      ],
      { cancelable: true }
    );
  };

  const quickActions = [
    {
      title: 'Reportar Incidente',
      icon: 'alert-circle-outline',
      onPress: () => navigation.navigate('CreateReport'),
      color: '#2196F3'
    },
    {
      title: 'Mis Reportes',
      icon: 'clipboard-list-outline',
      onPress: () => navigation.navigate('TrackReports'),
      color: '#2196F3'
    },
    {
      title: 'Asistencia 24/7',
      icon: 'phone',
      onPress: handleEmergencyCall,
      color: '#2196F3'
    }
  ];

  if (loading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="lg" color="blue.500" />
        <Text mt={4}>Cargando...</Text>
      </Box>
    );
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary[500]]}
          tintColor={theme.colors.primary[500]}
          title="Actualizando..."
          titleColor={theme.colors.gray[600]}
        />
      }
    >
      <VStack space={4} pb={4}>
        <Header />
        
        {/* GPS Location Banner (only for amplio policy holders) */}
        {hasAmplioPolicy && (
          <Pressable onPress={handleLocationPress} mx={4} mt={2}>
            <Box 
              bg="blue.600" 
              p={3} 
              borderRadius="xl" 
              shadow={3}
              overflow="hidden"
              position="relative"
            >
              {/* Background pattern */}
              <Box 
                position="absolute" 
                right={-10} 
                top={-10} 
                opacity={0.1} 
                w={24} 
                h={24} 
                borderRadius="full" 
                bg="white" 
              />
              <Box 
                position="absolute" 
                left={-5} 
                bottom={-5} 
                opacity={0.1} 
                w={16} 
                h={16} 
                borderRadius="full" 
                bg="white" 
              />
              
              <HStack alignItems="center" space={3}>
                <Box 
                  bg="white" 
                  p={2} 
                  borderRadius="lg"
                >
                  <Icon 
                    as={FontAwesome5} 
                    name="location-arrow" 
                    size="md" 
                    color="blue.600" 
                  />
                </Box>
                
                <VStack flex={1}>
                  <Text color="white" fontWeight="bold" fontSize="md">
                    Localización GPS de tu Vehículo
                  </Text>
                  <Text color="blue.100" fontSize="xs">
                    Toca para escanear la ubicación
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </Pressable>
        )}
        
        {/* Message for users without amplio policy */}
        {!hasAmplioPolicy && (
          <Box mx={4} mt={2} p={3} bg="gray.100" borderRadius="xl">
            <HStack alignItems="center" space={3}>
              <Icon 
                as={MaterialCommunityIcons} 
                name="shield-lock-outline" 
                size="md" 
                color="gray.500" 
              />
              <VStack flex={1}>
                <Text fontWeight="medium" color="gray.700">
                  Localización GPS no disponible
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Disponible solo para pólizas de Cobertura Amplia
                </Text>
              </VStack>
              <TouchableOpacity onPress={() => navigation.navigate('Cotizar')}>
                <Text color="blue.500" fontSize="xs" fontWeight="bold">
                  Actualizar
                </Text>
              </TouchableOpacity>
            </HStack>
          </Box>
        )}
        
        {/* Active Report Card (if exists) */}
        {hasActiveReport && activeReport && (
          <Box mx={4} mt={2}>
            <ReportCard 
              report={activeReport} 
              onPress={() => navigation.navigate('TrackReports')}
            />
          </Box>
        )}
        
        {/* Quick Actions */}
        <Box mx={4} mt={2}>
          <HStack space={4} justifyContent="space-between">
            {quickActions.map((action, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={action.onPress}
                style={{ flex: 1 }}
              >
                <Box
                  bg="white"
                  p={4}
                  borderRadius="xl"
                  shadow={2}
                  alignItems="center"
                  borderWidth={1}
                  borderColor="gray.100"
                >
                  <Icon 
                    as={MaterialCommunityIcons} 
                    name={action.icon} 
                    size="lg" 
                    color={action.color} 
                    mb={2}
                  />
                  <Text 
                    fontSize="xs" 
                    textAlign="center" 
                    fontWeight="medium"
                  >
                    {action.title}
                  </Text>
                </Box>
              </TouchableOpacity>
            ))}
          </HStack>
        </Box>
        
        <Divider my={2} />
        
        {/* Insurance Cards */}
        <Box mx={4}>
          <CarInsuranceCard 
            title="Seguro Completo"
            description="Protección integral para tu vehículo contra todo tipo de riesgos."
            image={require('../../img/bannerIntegral.png')}
          />
        </Box>
        
        <Box mx={4}>
          <CarInsuranceCard 
            title="Asistencia en Carretera"
            description="Ayuda 24/7 en cualquier lugar donde te encuentres."
            image="https://segurosypensionesparatodos.fundacionmapfre.org/media/blog/asistencia-carretera-1194x535-1.png"
          />
        </Box>
        
        <Box mx={4}>
          <CarInsuranceCard 
            title="Cobertura de Responsabilidad Civil"
            description="Protección financiera contra daños a terceros."
            image={require('../../img/banner.png')}
          />
        </Box>
      </VStack>
    </ScrollView>
  );
};

export default HomeScreen;
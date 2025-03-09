import React, { useState, useEffect } from 'react';
import { ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { VStack, HStack, Box, Text, Heading, Icon, Divider, useTheme, Spinner } from 'native-base';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import CarInsuranceCard from '../components/CarInsuranceCard';
import ReportCard from '../components/ReportCard';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

const HomeScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [hasActiveReport, setHasActiveReport] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      fetchActiveReports();
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

  const fetchActiveReports = async () => {
    try {
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
    <ScrollView>
      <VStack space={4} pb={4}>
        <Header />
        
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
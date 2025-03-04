import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { VStack, HStack, Box, Text, Heading, Icon, Divider, useTheme } from 'native-base';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import CarInsuranceCard from '../components/CarInsuranceCard';
import ReportCard from '../components/ReportCard';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [hasActiveReport, setHasActiveReport] = useState(true);

  // Simulated active report data
  const activeReport = {
    id: '042133248841',
    title: 'Grúa en camino para entregar tu vehículo',
    description: 'Grúa en camino para entregar',
    status: 'en progreso',
    type: 'tow',
    date: '2023-03-15'
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
      icon: 'phone',  // Cambiamos el icono a un teléfono
      onPress: handleEmergencyCall,
      color: '#2196F3'
    }
  ];

  const incidentTypes = [
    { id: 'collision', title: 'Colisión', icon: 'car-crash' },
    { id: 'roadside', title: 'Asistencia', icon: 'road-variant' },
    { id: 'glass', title: 'Cristales', icon: 'car-door' },
    { id: 'theft', title: 'Robo', icon: 'shield-car' }
  ];

  const handleReportIncident = (type) => {
    navigation.navigate('CreateReport', { incidentType: type });
  };

  return (
    <ScrollView>
      <VStack space={4} pb={4}>
        <Header />
        
        {/* Active Report Card (if exists) */}
        {hasActiveReport && (
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
        
        {/* Report Types Section */}
        {/* <Box mx={4} mt={4}>
          <Heading size="md" mb={4}>Tipos de Incidentes</Heading>
          <Box 
            bg="white" 
            p={4} 
            borderRadius="xl" 
            shadow={2}
            borderWidth={1}
            borderColor="gray.100"
          >
            <HStack flexWrap="wrap" justifyContent="space-between">
              {incidentTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => handleReportIncident(type.id)}
                  style={{ width: '48%', marginBottom: 16 }}
                >
                  <Box
                    bg="blue.50"
                    p={4}
                    borderRadius="lg"
                    alignItems="center"
                    borderWidth={1}
                    borderColor="blue.100"
                  >
                    <Icon 
                      as={MaterialCommunityIcons} 
                      name={type.icon} 
                      size="xl" 
                      color="#2196F3" 
                      mb={2}
                    />
                    <Text fontWeight="medium" color="#2196F3">
                      {type.title}
                    </Text>
                  </Box>
                </TouchableOpacity>
              ))}
            </HStack>
          </Box>
        </Box> */}
        
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

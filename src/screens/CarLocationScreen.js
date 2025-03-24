import React, { useState, useEffect } from 'react';
import { StyleSheet, Dimensions, View, Alert, Linking, Platform } from 'react-native';
import { Box, VStack, HStack, Text, Icon, Spinner, Button, useToast } from 'native-base';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';

// URL del servidor Express - IMPORTANTE: AJUSTA ESTA URL
const API_URL = 'http://192.168.1.67:3000'; // ¡CAMBIA ESTA IP POR LA DE TU SERVIDOR!

const CarLocationScreen = ({ route, navigation }) => {
  const [carLocation, setCarLocation] = useState(null);
  const [carAddress, setCarAddress] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gpsInfo, setGpsInfo] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // Obtener ubicación del usuario
    getUserLocation();
    
    // Obtener ubicación del vehículo
    fetchCarLocation();
    
    // Configurar un intervalo para actualizar la ubicación periódicamente
    const intervalId = setInterval(() => {
      fetchCarLocation(false); // false para no mostrar el indicador de carga
    }, 10000); // Actualizar cada 10 segundos
    
    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(intervalId);
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        toast.show({
          description: "Se requiere permiso para acceder a la ubicación",
          status: "warning"
        });
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
    } catch (error) {
      console.error('Error getting user location:', error);
      toast.show({
        description: "No se pudo obtener tu ubicación actual",
        status: "error"
      });
    }
  };

  // Obtener coordenadas GPS del servidor Express
  const fetchCarLocation = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setRefreshing(true);
    
    try {
      console.log(`Intentando conectar a: ${API_URL}/api/gps`);
      
      // Hacer la petición al servidor Express con un timeout
      const response = await axios.get(`${API_URL}/api/gps`, { 
        timeout: 5000 // 5 segundos de timeout
      });
      
      console.log('Respuesta del servidor:', response.data);
      const data = response.data;
      
      // Verificar que los datos son válidos
      if (data && data.latitud && data.longitud) {
        // Convertir a números para asegurarnos
        const latitude = parseFloat(data.latitud);
        const longitude = parseFloat(data.longitud);
        
        console.log(`Datos GPS recibidos: Lat ${latitude}, Lng ${longitude}`);
        
        // Actualizar la ubicación del coche
        setCarLocation({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        });
        
        // Guardar información adicional del GPS
        setGpsInfo({
          altitud: data.altitud,
          satelites: data.satelites,
          hora: data.hora || new Date().toISOString()
        });
        
        // Establecer dirección basada en coordenadas
        setCarAddress(`Ubicación GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        
        // Intentar obtener la dirección usando la API de geocodificación inversa
        try {
          const geocodeResponse = await Location.reverseGeocodeAsync({
            latitude,
            longitude
          });
          
          if (geocodeResponse && geocodeResponse.length > 0) {
            const address = geocodeResponse[0];
            const addressText = [
              address.street,
              address.city,
              address.region,
              address.country
            ].filter(Boolean).join(', ');
            
            if (addressText.trim()) {
              setCarAddress(addressText);
            }
          }
        } catch (geocodeError) {
          console.error('Error en geocodificación:', geocodeError);
          // Ya tenemos una dirección basada en coordenadas, así que no hacemos nada
        }
        
        // Indicar que estamos usando datos reales
        setUsingFallback(false);
        setConnectionError(false);
        
        if (showLoading) {
          toast.show({
            description: "Ubicación del vehículo actualizada desde GPS",
            status: "success"
          });
        }
      } else {
        // Si no hay datos válidos, mostrar un mensaje
        console.warn('Datos GPS incompletos:', data);
        
        if (showLoading) {
          toast.show({
            description: "Datos GPS incompletos o no disponibles",
            status: "warning"
          });
        }
        
        // Si no hay ubicación previa, usar datos simulados como fallback
        if (!carLocation || usingFallback) {
          useFallbackLocation();
        }
      }
    } catch (error) {
      console.error('Error obteniendo datos GPS:', error);
      setConnectionError(true);
      
      // if (showLoading) {
      //   toast.show({
      //     description: `No se pudo conectar con el servidor GPS: ${error.message}`,
      //     status: "error"
      //   });
      // }
      
      // Si hay un error de conexión, usar datos simulados como fallback
      useFallbackLocation();
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  // Función de respaldo para usar datos simulados si no se puede conectar al servidor
  const useFallbackLocation = () => {
    console.log('Usando ubicación de respaldo (simulada)');
    setUsingFallback(true);
    
    // Coordenadas simuladas (Ciudad de México y alrededores)
    const simulatedLocations = [
      { latitude: 19.432608, longitude: -99.133209, address: "Centro Histórico, CDMX (SIMULADO)" },
      { latitude: 19.336128, longitude: -99.187469, address: "San Ángel, CDMX (SIMULADO)" },
      { latitude: 19.503510, longitude: -99.149880, address: "Lindavista, CDMX (SIMULADO)" },
      { latitude: 19.375180, longitude: -99.175935, address: "Coyoacán, CDMX (SIMULADO)" },
      { latitude: 19.432209, longitude: -99.167783, address: "Roma Norte, CDMX (SIMULADO)" }
    ];
    
    // Seleccionar una ubicación aleatoria
    const randomIndex = Math.floor(Math.random() * simulatedLocations.length);
    const randomLocation = simulatedLocations[randomIndex];
    
    // Establecer la ubicación en el formato correcto para react-native-maps
    setCarLocation({
      latitude: randomLocation.latitude,
      longitude: randomLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    });
    setCarAddress(randomLocation.address);
    
    // Datos GPS simulados
    setGpsInfo({
      altitud: "1234.5",
      satelites: "8",
      hora: new Date().toISOString()
    });
  };

  const refreshLocation = () => {
    fetchCarLocation(true);
  };

  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la tierra en km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distancia en km
    return d;
  };
  
  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };

  const calculateDistance = () => {
    if (!userLocation || !carLocation) return null;
    
    const distance = getDistanceFromLatLonInKm(
      userLocation.latitude, 
      userLocation.longitude, 
      carLocation.latitude, 
      carLocation.longitude
    );
    
    return distance.toFixed(2);
  };

  // Función para abrir la ubicación en la app de mapas nativa
  const openInMapsApp = () => {
    if (!carLocation) return;
    
    const { latitude, longitude } = carLocation;
    const label = encodeURIComponent("Ubicación de mi vehículo");
    
    let url;
    if (Platform.OS === 'ios') {
      url = `maps:0,0?q=${latitude},${longitude}(${label})`;
    } else {
      url = `geo:0,0?q=${latitude},${longitude}(${label})`;
    }
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        return Linking.openURL(url);
      } else {
        // Fallback para navegadores web
        const browserUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        return Linking.openURL(browserUrl);
      }
    }).catch(err => {
      console.error('Error al abrir la app de mapas:', err);
      toast.show({
        description: "No se pudo abrir la aplicación de mapas",
        status: "error"
      });
    });
  };

  // Función para probar la conexión al servidor
  const testServerConnection = async () => {
    try {
      toast.show({
        description: `Intentando conectar a: ${API_URL}/api/gps`,
        status: "info"
      });
      
      const response = await axios.get(`${API_URL}/api/gps`, { timeout: 5000 });
      
      Alert.alert(
        "Resultado de la conexión",
        `Conexión exitosa!\n\nDatos recibidos: ${JSON.stringify(response.data, null, 2)}`,
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert(
        "Error de conexión",
        `No se pudo conectar al servidor: ${error.message}\n\nVerifica que:\n- La URL del servidor es correcta\n- El servidor está en ejecución\n- Ambos dispositivos están en la misma red`,
        [{ text: "OK" }]
      );
    }
  };

  if (loading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="lg" color="blue.500" />
        <Text mt={4}>Obteniendo ubicación del vehículo...</Text>
        <Button mt={6} onPress={testServerConnection} variant="outline">
          Probar conexión al servidor
        </Button>
      </Box>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={carLocation}
        showsUserLocation={true}
      >
        <Marker 
          coordinate={{
            latitude: carLocation.latitude,
            longitude: carLocation.longitude
          }}
          title="Tu vehículo"
          description={carAddress}
        />
      </MapView>
      
      {/* Indicador de datos simulados */}
      {usingFallback && (
        <Box 
          position="absolute" 
          top={4} 
          left={4} 
          right={4} 
          bg="orange.500" 
          p={2} 
          borderRadius="md"
          opacity={0.9}
        >
          <HStack space={2} alignItems="center">
            <Icon as={MaterialCommunityIcons} name="alert" color="white" size="sm" />
            <Text color="white" fontWeight="medium" fontSize="xs">
              Usando datos simulados. No se pudo conectar al  GPS.
            </Text>
          </HStack>
        </Box>
      )}
      
      {/* Botón para abrir en mapas */}
      <Button
        position="absolute"
        top={usingFallback ? 16 : 4}
        right={4}
        leftIcon={<Icon as={MaterialCommunityIcons} name="navigation" size="sm" />}
        onPress={openInMapsApp}
        colorScheme="blue"
        shadow={2}
        size="sm"
      >
        Abrir en Mapas
      </Button>
      
      {/* Botón para probar conexión */}
      <Button
        position="absolute"
        top={usingFallback ? 16 : 4}
        left={4}
        leftIcon={<Icon as={MaterialCommunityIcons} name="server-network" size="sm" />}
        onPress={testServerConnection}
        colorScheme={connectionError ? "red" : "gray"}
        shadow={2}
        size="sm"
        opacity={0.8}
      >
        Probar Servidor
      </Button>
      
      {/* Info Panel */}
      <Box 
        position="absolute" 
        bottom={0} 
        left={0} 
        right={0} 
        bg="white" 
        p={4} 
        borderTopRadius="2xl" 
        shadow={5}
      >
        <VStack space={4}>
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="lg" fontWeight="bold">
              Ubicación del Vehículo
              {usingFallback && <Text color="orange.500"> (Simulada)</Text>}
            </Text>
            <Button 
              size="sm" 
              leftIcon={<Icon as={MaterialCommunityIcons} name="refresh" size="sm" />}
              isLoading={refreshing}
              onPress={refreshLocation}
              variant="ghost"
              colorScheme="blue"
            >
              Actualizar
            </Button>
          </HStack>
          
          <VStack space={3} bg="blue.50" p={3} borderRadius="lg">
            <HStack space={3} alignItems="center">
              <Icon as={MaterialCommunityIcons} name="map-marker" size="md" color="blue.600" />
              <VStack flex={1}>
                <Text fontSize="xs" color="gray.500">Dirección</Text>
                <Text fontWeight="medium">{carAddress}</Text>
              </VStack>
            </HStack>
            
            {gpsInfo && (
              <>
                <HStack space={3} alignItems="center">
                  <Icon as={MaterialCommunityIcons} name="clock-outline" size="md" color="blue.600" />
                  <VStack flex={1}>
                    <Text fontSize="xs" color="gray.500">Última actualización</Text>
                    <Text fontWeight="medium">
                      {gpsInfo.hora ? new Date(gpsInfo.hora).toLocaleTimeString() : new Date().toLocaleTimeString()}
                    </Text>
                  </VStack>
                </HStack>
                
                {/* <HStack space={3} alignItems="center">
                  <Icon as={Ionicons} name="cellular" size="md" color="blue.600" />
                  <VStack flex={1}>
                    <Text fontSize="xs" color="gray.500">Satélites conectados</Text>
                    <Text fontWeight="medium">{gpsInfo.satelites || "N/A"}</Text>
                  </VStack>
                </HStack> */}
                
                {/* <HStack space={3} alignItems="center">
                  <Icon as={MaterialCommunityIcons} name="elevation-rise" size="md" color="blue.600" />
                  <VStack flex={1}>
                    <Text fontSize="xs" color="gray.500">Altitud</Text>
                    <Text fontWeight="medium">
                      {gpsInfo.altitud ? `${gpsInfo.altitud} m` : "N/A"}
                    </Text>
                  </VStack>
                </HStack> */}
              </>
            )}
            
            {userLocation && (
              <HStack space={3} alignItems="center">
                <Icon as={MaterialCommunityIcons} name="map-marker-distance" size="md" color="blue.600" />
                <VStack flex={1}>
                  <Text fontSize="xs" color="gray.500">Distancia desde tu ubicación</Text>
                  <Text fontWeight="medium">{calculateDistance()} km</Text>
                </VStack>
              </HStack>
            )}
            
            <HStack space={3} alignItems="center">
              <Icon as={MaterialCommunityIcons} name="car" size="md" color="blue.600" />
              <VStack flex={1}>
                <Text fontSize="xs" color="gray.500">Coordenadas</Text>
                <Text fontWeight="medium">
                  {carLocation.latitude.toFixed(6)}, {carLocation.longitude.toFixed(6)}
                </Text>
              </VStack>
            </HStack>
          </VStack>
          
          <Text fontSize="xs" color="gray.500" textAlign="center">
            {usingFallback 
              ? "Usando datos simulados. No se pudo conectar al GPS."
              : "Datos obtenidos desde el módulo GPS NEO-6M conectado al ESP32"}
          </Text>
          
          {/* {connectionError && (
            <Button 
              size="sm" 
              colorScheme="orange" 
              onPress={testServerConnection}
              leftIcon={<Icon as={MaterialCommunityIcons} name="server-network" size="sm" />}
            >
              Verificar conexión con el servidor
            </Button>
          )} */}
        </VStack>
      </Box>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default CarLocationScreen;
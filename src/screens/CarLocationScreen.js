"use client"

import { useState, useEffect } from "react"
import { StyleSheet, View, Alert, Linking, Platform } from "react-native"
import { Box, VStack, HStack, Text, Icon, Spinner, Button, useToast, ScrollView, Pressable } from "native-base"
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import * as Location from "expo-location"
import axios from "axios"
import { collection, addDoc, updateDoc, doc } from "firebase/firestore"
import { db } from "../../db/firebase"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { FormControl, Input, TextArea, Modal, Divider } from "native-base"

// URL del servidor Express - IMPORTANTE: AJUSTA ESTA URL
const API_URL = "http://172.10.106.3:3000" // ¡CAMBIA ESTA IP POR LA DE TU SERVIDOR!

const CarLocationScreen = ({ route, navigation }) => {
  const [carLocation, setCarLocation] = useState(null)
  const [carAddress, setCarAddress] = useState("")
  const [userLocation, setUserLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [gpsInfo, setGpsInfo] = useState(null)
  const [connectionError, setConnectionError] = useState(false)
  const [usingFallback, setUsingFallback] = useState(false)
  const [showFullInfo, setShowFullInfo] = useState(false)
  const toast = useToast()
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false) // New state
  const [showTheftReportModal, setShowTheftReportModal] = useState(false)
  const [theftDescription, setTheftDescription] = useState("")
  const [theftLocation, setTheftLocation] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [userData, setUserData] = useState(null)
  const [vehicleData, setVehicleData] = useState(null)

  useEffect(() => {
    // Obtener permisos de ubicación
    const requestLocationPermission = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === "granted") {
        setLocationPermissionGranted(true)
      } else {
        toast.show({
          description: "Se requiere permiso para acceder a la ubicación",
          status: "warning",
        })
      }
    }

    requestLocationPermission()
  }, [])

  useEffect(() => {
    // Obtener ubicación del usuario
    const getUserLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()

        if (status !== "granted") {
          toast.show({
            description: "Se requiere permiso para acceder a la ubicación",
            status: "warning",
          })
          return
        }

        const location = await Location.getCurrentPositionAsync({})
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        })
      } catch (error) {
        console.error("Error getting user location:", error)
        toast.show({
          description: "No se pudo obtener tu ubicación actual",
          status: "error",
        })
      }
    }

    // Obtener ubicación del vehículo
    const fetchCarLocation = async (showLoading = true) => {
      if (showLoading) {
        setLoading(true)
      }
      setRefreshing(true)

      try {
        console.log(`Intentando conectar a: ${API_URL}/api/gps`)

        // Hacer la petición al servidor Express con un timeout
        const response = await axios.get(`${API_URL}/api/gps`, {
          timeout: 5000, // 5 segundos de timeout
        })

        console.log("Respuesta del servidor:", response.data)
        const data = response.data

        // Verificar que los datos son válidos
        if (data && data.latitud && data.longitud) {
          // Convertir a números para asegurarnos
          const latitude = Number.parseFloat(data.latitud)
          const longitude = Number.parseFloat(data.longitud)

          console.log(`Datos GPS recibidos: Lat ${latitude}, Lng ${longitude}`)

          // Actualizar la ubicación del coche
          setCarLocation({
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          })

          // Guardar información adicional del GPS
          setGpsInfo({
            altitud: data.altitud,
            satelites: data.satelites,
            hora: data.hora || new Date().toISOString(),
          })

          // Establecer dirección basada en coordenadas
          setCarAddress(`Ubicación GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)

          // Intentar obtener la dirección usando la API de geocodificación inversa
          try {
            const geocodeResponse = await Location.reverseGeocodeAsync({
              latitude,
              longitude,
            })

            if (geocodeResponse && geocodeResponse.length > 0) {
              const address = geocodeResponse[0]
              const addressText = [address.street, address.city, address.region, address.country]
                .filter(Boolean)
                .join(", ")

              if (addressText.trim()) {
                setCarAddress(addressText)
              }
            }
          } catch (geocodeError) {
            console.error("Error en geocodificación:", geocodeError)
            // Ya tenemos una dirección basada en coordenadas, así que no hacemos nada
          }

          // Indicar que estamos usando datos reales
          setUsingFallback(false)
          setConnectionError(false)

          if (showLoading) {
            toast.show({
              description: "Ubicación del vehículo actualizada desde GPS",
              status: "success",
            })
          }
        } else {
          // Si no hay datos válidos, mostrar un mensaje
          console.warn("Datos GPS incompletos:", data)

          if (showLoading) {
            toast.show({
              description: "Datos GPS incompletos o no disponibles",
              status: "warning",
            })
          }

          // Si no hay ubicación previa, usar datos simulados como fallback
          if (!carLocation || usingFallback) {
            useFallbackLocation()
          }
        }
      } catch (error) {
        setConnectionError(true)

        // Si hay un error de conexión, usar datos simulados como fallback
        useFallbackLocation()
      } finally {
        if (showLoading) {
          setLoading(false)
        }
        setRefreshing(false)
      }
    }

    if (locationPermissionGranted) {
      // Obtener ubicación del usuario
      getUserLocation()

      // Obtener ubicación del vehículo
      fetchCarLocation()

      // Configurar un intervalo para actualizar la ubicación periódicamente
      const intervalId = setInterval(() => {
        fetchCarLocation(false) // false para no mostrar el indicador de carga
      }, 10000) // Actualizar cada 10 segundos

      // Limpiar el intervalo cuando el componente se desmonte
      return () => clearInterval(intervalId)
    }
  }, [locationPermissionGranted])

  useEffect(() => {
    const getUserData = async () => {
      try {
        const data = await AsyncStorage.getItem("@user_data")
        if (data) {
          const user = JSON.parse(data)
          setUserData(user)

          // Si hay información del vehículo en la ruta, la usamos
          if (route.params?.vehicleData) {
            setVehicleData(route.params.vehicleData)
          }
        }
      } catch (error) {
        console.error("Error retrieving user data:", error)
      }
    }

    getUserData()
  }, [])

  // Función de respaldo para usar datos simulados si no se puede conectar al servidor
  const useFallbackLocation = () => {
    console.log("Usando ubicación de respaldo (simulada)")
    setUsingFallback(true)

    // Coordenadas simuladas (Ciudad de México y alrededores)
    const simulatedLocations = [
      { latitude: 32.456, longitude: -116.8865, address: "Delicias, Tijuana (SIMULADO)" },
      { latitude: 32.4658, longitude: -116.8669, address: "Altiplano, Tijuana (SIMULADO)" },
      { latitude: 32.4794, longitude: -116.905, address: "El Pípila, Tijuana (SIMULADO)" },
      { latitude: 32.485712, longitude: -116.847116, address: "El Florido, Tijuana (SIMULADO)" },
    ]

    // Seleccionar una ubicación aleatoria
    const randomIndex = Math.floor(Math.random() * simulatedLocations.length)
    const randomLocation = simulatedLocations[randomIndex]

    // Establecer la ubicación en el formato correcto para react-native-maps
    setCarLocation({
      latitude: randomLocation.latitude,
      longitude: randomLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    })
    setCarAddress(randomLocation.address)

    // Datos GPS simulados
    setGpsInfo({
      altitud: "1234.5",
      satelites: "8",
      hora: new Date().toISOString(),
    })
  }

  const refreshLocation = () => {
    fetchCarLocation(true)
  }

  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Radio de la tierra en km
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c // Distancia en km
    return d
  }

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180)
  }

  const calculateDistance = () => {
    if (!userLocation || !carLocation) return null

    const distance = getDistanceFromLatLonInKm(
      userLocation.latitude,
      userLocation.longitude,
      carLocation.latitude,
      carLocation.longitude,
    )

    return distance.toFixed(2)
  }

  // Función para abrir la ubicación en la app de mapas nativa
  const openInMapsApp = () => {
    if (!carLocation) return

    const { latitude, longitude } = carLocation
    const label = encodeURIComponent("Ubicación de mi vehículo")

    let url
    if (Platform.OS === "ios") {
      url = `maps:0,0?q=${latitude},${longitude}(${label})`
    } else {
      url = `geo:0,0?q=${latitude},${longitude}(${label})`
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url)
        } else {
          // Fallback para navegadores web
          const browserUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
          return Linking.openURL(browserUrl)
        }
      })
      .catch((err) => {
        console.error("Error al abrir la app de mapas:", err)
        toast.show({
          description: "No se pudo abrir la aplicación de mapas",
          status: "error",
        })
      })
  }

  // Función para probar la conexión al servidor
  const testServerConnection = async () => {
    try {
      toast.show({
        description: `Intentando conectar a: ${API_URL}/api/gps`,
        status: "info",
      })

      const response = await axios.get(`${API_URL}/api/gps`, { timeout: 5000 })

      Alert.alert(
        "Resultado de la conexión",
        `Conexión exitosa!\n\nDatos recibidos: ${JSON.stringify(response.data, null, 2)}`,
        [{ text: "OK" }],
      )
    } catch (error) {
      Alert.alert(
        "Error de conexión",
        `No se pudo conectar al servidor: ${error.message}\n\nVerifica que:\n- La URL del servidor es correcta\n- El servidor está en ejecución\n- Ambos dispositivos están en la misma red`,
        [{ text: "OK" }],
      )
    }
  }

  const submitTheftReport = async () => {
    if (!theftDescription || theftDescription.length < 10) {
      toast.show({
        description: "Por favor proporciona una descripción detallada del robo",
        status: "warning",
      })
      return
    }

    if (!theftLocation) {
      toast.show({
        description: "Por favor indica la ubicación donde ocurrió el robo",
        status: "warning",
      })
      return
    }

    // Mostrar alerta de confirmación
    Alert.alert(
      "Confirmación de Reporte de Robo",
      "Estás a punto de reportar el robo de tu vehículo. Esta acción es seria y generará un reporte oficial en el sistema. ¿Estás seguro de continuar?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              setSubmitting(true)

              if (!userData || !vehicleData) {
                toast.show({
                  description: "No se pudo obtener la información necesaria para el reporte",
                  status: "error",
                })
                setSubmitting(false)
                return
              }

              // Crear el documento de reclamo por robo
              const reclamo = {
                idUsuario: userData.id,
                estadoReclamo: "Pendiente",
                tipoSiniestro: "theft", // Tipo específico para robo
                descripcion: theftDescription,
                ubicacion: theftLocation,
                fotos: [], // Sin fotos inicialmente
                necesitaAsistencia: true, // Siempre necesita asistencia en caso de robo
                fechaCreacion: new Date(),
                vehiculoId: vehicleData.id,
                esRobo: true, // Campo específico para identificar robos
                prioridad: "alta", // Prioridad alta para robos
                coordenadas: carLocation
                  ? {
                      latitude: carLocation.latitude,
                      longitude: carLocation.longitude,
                    }
                  : null,
              }

              // Guardar en Firestore
              const reclamosRef = collection(db, "log", userData.id, "reclamosUser")
              const docRef = await addDoc(reclamosRef, reclamo)

              // Actualizar el documento con su ID
              await updateDoc(doc(db, "log", userData.id, "reclamosUser", docRef.id), {
                idReclamo: docRef.id,
              })

              // Actualizar el estado del vehículo a "robado"
              await updateDoc(doc(db, "log", userData.id, "carrosUser", vehicleData.id), {
                estado: "robado",
                fechaReporteRobo: new Date(),
              })

              toast.show({
                description: "Reporte de robo enviado exitosamente",
                status: "success",
              })

              // Cerrar modal y limpiar campos
              setShowTheftReportModal(false)
              setTheftDescription("")
              setTheftLocation("")

              // Mostrar alerta con próximos pasos
              Alert.alert(
                "Reporte Registrado",
                "Tu reporte de robo ha sido registrado. Un agente se pondrá en contacto contigo a la brevedad. Por favor, asegúrate de presentar una denuncia ante las autoridades correspondientes.",
                [{ text: "Entendido", onPress: () => navigation.goBack() }],
              )
            } catch (error) {
              console.error("Error submitting theft report:", error)
              toast.show({
                description: "Error al enviar el reporte de robo. Intenta de nuevo.",
                status: "error",
              })
            } finally {
              setSubmitting(false)
            }
          },
        },
      ],
    )
  }

  if (loading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="lg" color="blue.500" />
        <Text mt={4}>Obteniendo ubicación del vehículo...</Text>
        <Button mt={6} onPress={testServerConnection} variant="outline">
          Probar conexión al servidor
        </Button>
      </Box>
    )
  }

  return (
    <View style={styles.container}>
      <MapView style={styles.map} provider={PROVIDER_GOOGLE} region={carLocation} showsUserLocation={true}>
        <Marker
          coordinate={{
            latitude: carLocation.latitude,
            longitude: carLocation.longitude,
          }}
          title="Tu vehículo"
          description={carAddress}
        />
      </MapView>

      {/* Indicador de datos simulados */}
      {usingFallback && (
        <Box position="absolute" top={4} left={4} right={4} bg="orange.500" p={2} borderRadius="md" opacity={0.9}>
          <HStack space={2} alignItems="center">
            <Icon as={MaterialCommunityIcons} name="alert" color="white" size="sm" />
            <Text color="white" fontWeight="medium" fontSize="xs">
              Usando datos simulados. No se pudo conectar al GPS.
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

      {/* Botón para reportar robo */}
      <Button
        position="absolute"
        top={usingFallback ? 16 : 4}
        left={4}
        leftIcon={<Icon as={MaterialCommunityIcons} name="car-off" size="sm" />}
        onPress={() => setShowTheftReportModal(true)}
        colorScheme="red"
        shadow={2}
        size="sm"
      >
        Reportar Robo
      </Button>

      {/* Info Panel - Versión compacta */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        bg="white"
        borderTopRadius="2xl"
        shadow={5}
        maxHeight={showFullInfo ? "70%" : "30%"}
        transition={{
          type: "spring",
          damping: 15,
          stiffness: 120,
        }}
      >
        <Pressable onPress={() => setShowFullInfo(!showFullInfo)} _pressed={{ opacity: 0.8 }} py={2}>
          <Icon
            as={Ionicons}
            name={showFullInfo ? "chevron-down" : "chevron-up"}
            size="md"
            color="gray.400"
            alignSelf="center"
          />
        </Pressable>

        <ScrollView p={4} showsVerticalScrollIndicator={true}>
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
                  <Text fontSize="xs" color="gray.500">
                    Dirección
                  </Text>
                  <Text fontWeight="medium">{carAddress}</Text>
                </VStack>
              </HStack>

              {gpsInfo && (
                <>
                  <HStack space={3} alignItems="center">
                    <Icon as={MaterialCommunityIcons} name="clock-outline" size="md" color="blue.600" />
                    <VStack flex={1}>
                      <Text fontSize="xs" color="gray.500">
                        Última actualización
                      </Text>
                      <Text fontWeight="medium">
                        {gpsInfo.hora ? new Date(gpsInfo.hora).toLocaleTimeString() : new Date().toLocaleTimeString()}
                      </Text>
                    </VStack>
                  </HStack>

                  {showFullInfo && (
                    <>
                      <HStack space={3} alignItems="center">
                        <Icon as={Ionicons} name="cellular" size="md" color="blue.600" />
                        <VStack flex={1}>
                          <Text fontSize="xs" color="gray.500">
                            Satélites conectados
                          </Text>
                          <Text fontWeight="medium">{gpsInfo.satelites || "N/A"}</Text>
                        </VStack>
                      </HStack>

                      <HStack space={3} alignItems="center">
                        <Icon as={MaterialCommunityIcons} name="elevation-rise" size="md" color="blue.600" />
                        <VStack flex={1}>
                          <Text fontSize="xs" color="gray.500">
                            Altitud
                          </Text>
                          <Text fontWeight="medium">{gpsInfo.altitud ? `${gpsInfo.altitud} m` : "N/A"}</Text>
                        </VStack>
                      </HStack>
                    </>
                  )}
                </>
              )}

              {userLocation && (
                <HStack space={3} alignItems="center">
                  <Icon as={MaterialCommunityIcons} name="map-marker-distance" size="md" color="blue.600" />
                  <VStack flex={1}>
                    <Text fontSize="xs" color="gray.500">
                      Distancia desde tu ubicación
                    </Text>
                    <Text fontWeight="medium">{calculateDistance()} km</Text>
                  </VStack>
                </HStack>
              )}

              <HStack space={3} alignItems="center">
                <Icon as={MaterialCommunityIcons} name="car" size="md" color="blue.600" />
                <VStack flex={1}>
                  <Text fontSize="xs" color="gray.500">
                    Coordenadas
                  </Text>
                  <Text fontWeight="medium">
                    {carLocation.latitude.toFixed(6)}, {carLocation.longitude.toFixed(6)}
                  </Text>
                </VStack>
              </HStack>
            </VStack>

            {showFullInfo && (
              <>
                <Text fontSize="xs" color="gray.500" textAlign="center">
                  {usingFallback
                    ? "Usando datos simulados. No se pudo conectar al GPS."
                    : "Datos obtenidos desde el módulo GPS NEO-6M conectado al ESP32"}
                </Text>

                {connectionError && (
                  <Button
                    size="sm"
                    colorScheme="orange"
                    onPress={testServerConnection}
                    leftIcon={<Icon as={MaterialCommunityIcons} name="server-network" size="sm" />}
                  >
                    Verificar conexión con el servidor
                  </Button>
                )}

                <Box bg="gray.50" p={4} borderRadius="lg" mt={2}>
                  <Text fontSize="sm" fontWeight="bold" mb={2}>
                    Información adicional
                  </Text>
                  <Text fontSize="xs">
                    Este sistema utiliza un módulo GPS NEO-6M conectado a un ESP32 para rastrear la ubicación de tu
                    vehículo en tiempo real. Los datos se actualizan cada 10 segundos cuando la aplicación está abierta.
                  </Text>
                  <Text fontSize="xs" mt={2}>
                    Si no se puede establecer conexión con el dispositivo GPS, se mostrarán datos simulados como
                    respaldo.
                  </Text>
                </Box>
              </>
            )}
          </VStack>
        </ScrollView>
      </Box>

      {/* Modal para reportar robo */}
      <Modal isOpen={showTheftReportModal} onClose={() => setShowTheftReportModal(false)} size="xl">
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header bg="red.600">
            <Text color="white" fontWeight="bold">
              Reportar Robo de Vehículo
            </Text>
          </Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <Box bg="red.50" p={3} borderRadius="md">
                <HStack space={2} alignItems="center">
                  <Icon as={Ionicons} name="warning" size="md" color="red.600" />
                  <Text color="red.600" fontWeight="medium">
                    Esta acción es seria y generará un reporte oficial
                  </Text>
                </HStack>
                <Text fontSize="xs" color="red.600" mt={1}>
                  Reportar un vehículo como robado activará protocolos de seguridad y notificará a las autoridades
                  correspondientes.
                </Text>
              </Box>

              {vehicleData && (
                <Box bg="gray.50" p={3} borderRadius="md">
                  <Text fontWeight="bold">
                    {vehicleData.marca} {vehicleData.modelo}
                  </Text>
                  <Text fontSize="sm">Placas: {vehicleData.placas}</Text>
                  <Text fontSize="sm">VIN: {vehicleData.vin}</Text>
                </Box>
              )}

              <FormControl isRequired>
                <FormControl.Label>Ubicación del Robo</FormControl.Label>
                <Input placeholder="¿Dónde ocurrió el robo?" value={theftLocation} onChangeText={setTheftLocation} />
              </FormControl>

              <FormControl isRequired>
                <FormControl.Label>Descripción del Incidente</FormControl.Label>
                <TextArea
                  h={20}
                  placeholder="Describe cómo, cuándo y en qué circunstancias ocurrió el robo"
                  value={theftDescription}
                  onChangeText={setTheftDescription}
                />
                <FormControl.HelperText>
                  Proporciona todos los detalles posibles para facilitar la investigación
                </FormControl.HelperText>
              </FormControl>

              <Divider />

              <Text fontSize="xs" color="gray.500">
                Después de reportar el robo, te recomendamos:
              </Text>
              <VStack space={1}>
                <HStack space={2} alignItems="center">
                  <Icon as={Ionicons} name="checkmark-circle" size="xs" color="green.500" />
                  <Text fontSize="xs">Presentar una denuncia ante las autoridades</Text>
                </HStack>
                <HStack space={2} alignItems="center">
                  <Icon as={Ionicons} name="checkmark-circle" size="xs" color="green.500" />
                  <Text fontSize="xs">Contactar a tu agente de seguros</Text>
                </HStack>
                <HStack space={2} alignItems="center">
                  <Icon as={Ionicons} name="checkmark-circle" size="xs" color="green.500" />
                  <Text fontSize="xs">Tener a mano la documentación del vehículo</Text>
                </HStack>
              </VStack>
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" colorScheme="blueGray" onPress={() => setShowTheftReportModal(false)}>
                Cancelar
              </Button>
              <Button colorScheme="red" onPress={submitTheftReport} isLoading={submitting} isLoadingText="Enviando...">
                Reportar Robo
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
})

export default CarLocationScreen


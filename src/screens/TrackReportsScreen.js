"use client"

import { useState, useEffect } from "react"
import { ScrollView, TouchableOpacity } from "react-native"
import { 
  VStack, 
  Box, 
  Text, 
  Heading, 
  HStack, 
  Icon, 
  Divider, 
  Badge, 
  Spinner,
  Modal,
  Button,
  Image,
  useToast
} from "native-base"
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons"
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore"
import { db } from '../config/firebaseConfig';
import AsyncStorage from "@react-native-async-storage/async-storage"
import Header from "../components/Header"
import { LinearGradient } from "expo-linear-gradient"

// Definición de tipos de incidentes
const INCIDENT_TYPES = {
  collision: {
    name: "Colisión",
    icon: "car-emergency"
  },
  roadside: {
    name: "Asistencia vial",
    icon: "tow-truck"
  },
  glass: {
    name: "Rotura de cristales",
    icon: "car-door"
  },
  theft: {
    name: "Robo",
    icon: "shield-alert"
  },
  terceros: {
    name: "Daños a terceros",
    icon: "car-multiple"
  }
}

const TrackReportsScreen = ({ navigation }) => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [vehicles, setVehicles] = useState({}) // Cache para vehículos
  
  const toast = useToast()

  useEffect(() => {
    getUserData()
  }, [])

  useEffect(() => {
    if (userData) {
      fetchUserReports()
    }
  }, [userData])

  const getUserData = async () => {
    try {
      const data = await AsyncStorage.getItem("@user_data")
      if (data) {
        setUserData(JSON.parse(data))
      }
    } catch (error) {
      console.error("Error retrieving user data:", error)
      toast.show({
        description: "Error al obtener datos del usuario",
        status: "error"
      })
    }
  }

  const fetchVehicleDetails = async (vehicleId) => {
    // Si ya tenemos el vehículo en caché, lo devolvemos
    if (vehicles[vehicleId]) {
      return vehicles[vehicleId]
    }
    
    try {
      const vehicleRef = doc(db, "log", userData.id, "carrosUser", vehicleId)
      const vehicleSnap = await getDoc(vehicleRef)
      
      if (vehicleSnap.exists()) {
        const vehicleData = vehicleSnap.data()
        // Actualizamos la caché
        setVehicles(prev => ({
          ...prev,
          [vehicleId]: vehicleData
        }))
        return vehicleData
      }
      return null
    } catch (error) {
      console.error("Error fetching vehicle details:", error)
      return null
    }
  }

  const fetchUserReports = async () => {
    try {
      setLoading(true)
      const reportsRef = collection(db, "log", userData.id, "reclamosUser")
      const q = query(reportsRef, orderBy("fechaCreacion", "desc"))
      const reportsSnapshot = await getDocs(q)
      
      const reportsData = []
      
      // Primero recopilamos todos los reportes
      reportsSnapshot.forEach((doc) => {
        reportsData.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      // Luego obtenemos los detalles de los vehículos para cada reporte
      const reportsWithVehicles = await Promise.all(
        reportsData.map(async (report) => {
          if (report.vehiculoId) {
            const vehicleData = await fetchVehicleDetails(report.vehiculoId)
            if (vehicleData) {
              return {
                ...report,
                vehiculoInfo: {
                  marca: vehicleData.marca,
                  modelo: vehicleData.modelo,
                  anio: vehicleData.anio,
                  placa: vehicleData.placa
                }
              }
            }
          }
          return report
        })
      )
      
      setReports(reportsWithVehicles)
    } catch (error) {
      console.error("Error fetching user reports:", error)
      toast.show({
        description: "Error al obtener reportes",
        status: "error"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Pendiente":
        return "warning"
      case "En Revisión":
        return "info"
      case "Aprobado":
        return "success"
      case "Rechazado":
        return "danger"
      case "Completado":
        return "success"
      default:
        return "gray"
    }
  }

  const getReportIcon = (type) => {
    return INCIDENT_TYPES[type]?.icon || "file-document-outline"
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return "Fecha desconocida"
    
    const date = timestamp.toDate ? 
                timestamp.toDate() : 
                new Date(timestamp)
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handleReportPress = (report) => {
    setSelectedReport(report)
    setShowModal(true)
  }

  const handleRefresh = () => {
    if (userData) {
      fetchUserReports()
    }
  }

  if (loading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="lg" color="blue.500" />
        <Text mt={4}>Cargando reportes...</Text>
      </Box>
    )
  }

  return (
    <ScrollView>
      <Header />
      <LinearGradient colors={['#f0f4f8', '#e9ecef']} style={{ flex: 1 }}>
        <VStack space={4} p={4}>
          <Box bg="white" p={4} borderRadius="xl" shadow={3}>
            <HStack justifyContent="space-between" alignItems="center" mb={4}>
              <Heading size="md" color="blue.600">
                Seguimiento de Reportes
              </Heading>
              <TouchableOpacity onPress={handleRefresh}>
                <Icon as={Ionicons} name="refresh" size="sm" color="blue.500" />
              </TouchableOpacity>
            </HStack>

            {reports.length > 0 ? (
              <VStack space={3} divider={<Divider />}>
                {reports.map((report) => (
                  <TouchableOpacity key={report.id} onPress={() => handleReportPress(report)}>
                    <HStack space={3} alignItems="center" py={2}>
                      <Box bg="blue.50" p={2} borderRadius="full">
                        <Icon 
                          as={MaterialCommunityIcons} 
                          name={getReportIcon(report.tipoSiniestro)} 
                          size="md" 
                          color="blue.500" 
                        />
                      </Box>

                      <VStack flex={1}>
                        <HStack justifyContent="space-between" alignItems="center">
                          <Text fontWeight="bold" fontSize="sm">
                            Reporte #{report.id.substring(0, 8)}
                          </Text>
                          <Badge colorScheme={getStatusColor(report.estadoReclamo)} variant="subtle">
                            {report.estadoReclamo}
                          </Badge>
                        </HStack>

                        <Text fontWeight="medium">
                          {INCIDENT_TYPES[report.tipoSiniestro]?.name || report.tipoSiniestro}
                        </Text>

                        <HStack justifyContent="space-between" alignItems="center">
                          <Text fontSize="xs" color="gray.500">
                            {report.vehiculoInfo ? 
                              `${report.vehiculoInfo.marca} ${report.vehiculoInfo.modelo}` : 
                              "Vehículo no especificado"}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {formatDate(report.fechaCreacion)}
                          </Text>
                        </HStack>
                      </VStack>
                    </HStack>
                  </TouchableOpacity>
                ))}
              </VStack>
            ) : (
              <Box p={4} alignItems="center">
                <Icon as={MaterialCommunityIcons} name="file-document-outline" size="4xl" color="gray.300" mb={2} />
                <Text color="gray.500" textAlign="center">
                  No tienes reportes activos en este momento
                </Text>
                <Button 
                  mt={4} 
                  colorScheme="blue" 
                  size="sm"
                  leftIcon={<Icon as={Ionicons} name="add-circle-outline" size="sm" />}
                  onPress={() => navigation.navigate('CreateReport')}
                >
                  Crear nuevo reporte
                </Button>
              </Box>
            )}
          </Box>
        </VStack>
      </LinearGradient>

      {/* Modal de detalles del reporte */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="lg">
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Detalles del Reporte</Modal.Header>
          <Modal.Body>
            {selectedReport && (
              <VStack space={4}>
                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontWeight="bold">ID:</Text>
                  <Text>{selectedReport.id}</Text>
                </HStack>
                
                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontWeight="bold">Estado:</Text>
                  <Badge colorScheme={getStatusColor(selectedReport.estadoReclamo)}>
                    {selectedReport.estadoReclamo}
                  </Badge>
                </HStack>
                
                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontWeight="bold">Tipo:</Text>
                  <Text>{INCIDENT_TYPES[selectedReport.tipoSiniestro]?.name || selectedReport.tipoSiniestro}</Text>
                </HStack>
                
                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontWeight="bold">Fecha:</Text>
                  <Text>{formatDate(selectedReport.fechaCreacion)}</Text>
                </HStack>
                
                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontWeight="bold">Vehículo:</Text>
                  <Text>
                    {selectedReport.vehiculoInfo ? 
                      `${selectedReport.vehiculoInfo.marca} ${selectedReport.vehiculoInfo.modelo} (${selectedReport.vehiculoInfo.placa})` : 
                      "No especificado"}
                  </Text>
                </HStack>
                
                <VStack>
                  <Text fontWeight="bold">Ubicación:</Text>
                  <Text>{selectedReport.ubicacion || "No especificada"}</Text>
                </VStack>
                
                <VStack>
                  <Text fontWeight="bold">Descripción:</Text>
                  <Text>{selectedReport.descripcion || "Sin descripción"}</Text>
                </VStack>
                
                {selectedReport.necesitaAsistencia && (
                  <Badge colorScheme="red" alignSelf="flex-start">
                    Requiere asistencia inmediata
                  </Badge>
                )}
                
                {selectedReport.fotos && selectedReport.fotos.length > 0 && (
                  <VStack space={2}>
                    <Text fontWeight="bold">Fotos:</Text>
                    <HStack space={2} flexWrap="wrap">
                      {selectedReport.fotos.map((foto, index) => (
                        <Image 
                          key={index}
                          source={{ uri: foto }} 
                          alt={`Foto ${index + 1}`}
                          size="md"
                          borderRadius="md"
                        />
                      ))}
                    </HStack>
                  </VStack>
                )}
                
                {selectedReport.evaluadorAsignado && (
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontWeight="bold">Evaluador:</Text>
                    <Text>{selectedReport.evaluadorAsignado}</Text>
                  </HStack>
                )}
                
                {selectedReport.montoCompensacion && (
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontWeight="bold">Compensación:</Text>
                    <Text fontWeight="bold" color="green.500">
                      ${selectedReport.montoCompensacion.toLocaleString()}
                    </Text>
                  </HStack>
                )}
                
                {selectedReport.fechaResolucion && (
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontWeight="bold">Fecha de resolución:</Text>
                    <Text>{formatDate(selectedReport.fechaResolucion)}</Text>
                  </HStack>
                )}
              </VStack>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button 
                variant="ghost" 
                colorScheme="blueGray" 
                onPress={() => setShowModal(false)}
              >
                Cerrar
              </Button>
              {selectedReport && selectedReport.estadoReclamo === "Pendiente" && (
                <Button 
                  colorScheme="danger" 
                  onPress={() => {
                    // Aquí iría la lógica para cancelar el reporte
                    setShowModal(false)
                    toast.show({
                      description: "Funcionalidad de cancelación no implementada",
                      status: "info"
                    })
                  }}
                >
                  Cancelar Reporte
                </Button>
              )}
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </ScrollView>
  )
}

export default TrackReportsScreen
import React, { useState, useEffect } from 'react';
import { ScrollView, TouchableOpacity, Image as RNImage } from "react-native"
import {
  VStack,
  Box,
  Heading,
  FormControl,
  Input,
  TextArea,
  Button,
  Select,
  CheckIcon,
  Radio,
  HStack,
  Text,
  useToast,
  Icon,
  Spinner,
  Image,
  Divider,
  AlertDialog,
} from "native-base"
import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc  } from "firebase/firestore"
import { db } from "../../db/firebase"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as ImagePicker from "expo-image-picker"
import { Ionicons } from "@expo/vector-icons"
import Header from "../components/Header"
import { LinearGradient } from "expo-linear-gradient"

// Definición de tipos de pólizas y sus coberturas
const POLICY_TYPES = {
  respCivil: {
    name: "Responsabilidad Civil",
    coverages: ["terceros"],
    description: "Cubre solo la responsabilidad civil por daños a terceros."
  },
  basico: {
    name: "Básico",
    coverages: ["terceros", "responsabilidadCivil"],
    description: "Cubre daños a terceros y responsabilidad civil."
  },
  amplio: {
    name: "Amplio",
    coverages: ["terceros", "responsabilidadCivil", "roboTotal", "danosPropios", "gastosMedicos", "autoSustituto"],
    description: "Cubre daños propios, robo total, responsabilidad civil, gastos médicos y auto sustituto."
  }
}

// Definición de tipos de incidentes y qué cobertura requieren
const INCIDENT_TYPES = {
  collision: {
    name: "Colisión",
    requiredCoverage: "danosPropios",
    description: "Accidente que involucra daños al vehículo"
  },
  roadside: {
    name: "Asistencia vial",
    requiredCoverage: "autoSustituto",
    description: "Problemas mecánicos, grúa, etc."
  },
  glass: {
    name: "Rotura de cristales",
    requiredCoverage: "danosPropios",
    description: "Daños a parabrisas o ventanas"
  },
  theft: {
    name: "Robo",
    requiredCoverage: "roboTotal",
    description: "Robo total o parcial del vehículo"
  },
  terceros: {
    name: "Daños a terceros",
    requiredCoverage: "terceros",
    description: "Daños causados a otras personas o propiedades"
  }
}

const CreateReportScreen = ({ navigation }) => {
  const [reportType, setReportType] = useState("")
  const [vehicle, setVehicle] = useState("")
  const [vehicleData, setVehicleData] = useState(null)
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [needsAssistance, setNeedsAssistance] = useState("no")
  const [images, setImages] = useState([])
  const [userData, setUserData] = useState(null)
  const [userVehicles, setUserVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [policyData, setPolicyData] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [validIncidentTypes, setValidIncidentTypes] = useState([])

  const toast = useToast()
  const cancelRef = React.useRef(null)

  useEffect(() => {
    getUserData()
  }, [])

  useEffect(() => {
    if (userData) {
      fetchUserVehicles()
    }
  }, [userData])

  useEffect(() => {
    if (vehicle) {
      fetchVehiclePolicy()
    } else {
      setPolicyData(null)
      setVehicleData(null)
    }
  }, [vehicle])

  useEffect(() => {
    if (policyData) {
      determineValidIncidentTypes()
    } else {
      setValidIncidentTypes([])
    }
  }, [policyData])

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

  const fetchUserVehicles = async () => {
    try {
      setLoading(true)
      const vehiclesRef = collection(db, "log", userData.id, "carrosUser")
      const vehiclesSnapshot = await getDocs(vehiclesRef)
      
      const vehicles = []
      vehiclesSnapshot.forEach((doc) => {
        vehicles.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      setUserVehicles(vehicles)
    } catch (error) {
      console.error("Error fetching user vehicles:", error)
      toast.show({
        description: "Error al obtener vehículos",
        status: "error"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchVehiclePolicy = async () => {
    try {
      // Primero obtenemos los datos del vehículo seleccionado
      const selectedVehicle = userVehicles.find(v => v.id === vehicle)
      setVehicleData(selectedVehicle)
      
      // Luego buscamos si tiene una póliza activa
      const policiesRef = collection(db, "log", userData.id, "polizaUser")
      const q = query(policiesRef, where("carroId", "==", vehicle))
      const policiesSnapshot = await getDocs(q)
      
      let activePolicy = null
      const now = new Date()
      
      policiesSnapshot.forEach((doc) => {
        const policy = doc.data()
        const expiryDate = policy.fechaVencimiento?.toDate ? 
                          policy.fechaVencimiento.toDate() : 
                          new Date(policy.fechaVencimiento)
        
        if (expiryDate > now) {
          activePolicy = {
            id: doc.id,
            ...policy
          }
        }
      })
      
      if (activePolicy) {
        setPolicyData(activePolicy)
      } else {
        setPolicyData(null)
        setAlertMessage("Este vehículo no tiene una póliza activa. Por favor, contrata una póliza antes de crear un reporte.")
        setIsOpen(true)
      }
    } catch (error) {
      console.error("Error fetching vehicle policy:", error)
      toast.show({
        description: "Error al verificar la póliza",
        status: "error"
      })
    }
  }

  const determineValidIncidentTypes = () => {
    if (!policyData || !policyData.polizaId) return
    
    const policyType = policyData.polizaId
    const policyInfo = POLICY_TYPES[policyType]
    
    if (!policyInfo) return
    
    const validTypes = Object.keys(INCIDENT_TYPES).filter(incidentType => {
      const incident = INCIDENT_TYPES[incidentType]
      return policyInfo.coverages.includes(incident.requiredCoverage) || 
             incidentType === "terceros" // Todos los tipos de póliza cubren daños a terceros
    })
    
    setValidIncidentTypes(validTypes)
    
    // Si el tipo de reporte actual no es válido, lo reseteamos
    if (reportType && !validTypes.includes(reportType)) {
      setReportType("")
    }
  }

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Limitamos a máximo 3 imágenes
        if (images.length >= 3) {
          toast.show({
            description: "Máximo 3 imágenes permitidas",
            status: "warning"
          })
          return
        }
        
        setImages([...images, result.assets[0].uri])
      }
    } catch (error) {
      console.error("Error picking image:", error)
      toast.show({
        description: "Error al seleccionar imagen",
        status: "error"
      })
    }
  }

  const removeImage = (index) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)
  }

  const uploadImageToCloudinary = async (uri) => {
    const cloudName = "dexgwbbzn" // Reemplaza con tu cloud name de Cloudinary
    const uploadPreset = "safecar" // Reemplaza con tu upload preset
    
    const formData = new FormData()
    formData.append("file", {
      uri,
      type: "image/jpeg",
      name: `report_${Date.now()}.jpg`
    })
    formData.append("upload_preset", uploadPreset)
    
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
        headers: {
          "Accept": "application/json",
          "Content-Type": "multipart/form-data"
        }
      })
      
      const data = await response.json()
      return data.secure_url
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error)
      throw error
    }
  }

  const validateForm = () => {
    if (!reportType) {
      toast.show({
        description: "Selecciona un tipo de incidente",
        status: "warning"
      })
      return false
    }
    
    if (!vehicle) {
      toast.show({
        description: "Selecciona un vehículo",
        status: "warning"
      })
      return false
    }
    
    if (!location) {
      toast.show({
        description: "Ingresa la ubicación del incidente",
        status: "warning"
      })
      return false
    }
    
    if (!description || description.length < 10) {
      toast.show({
        description: "Proporciona una descripción detallada (mínimo 10 caracteres)",
        status: "warning"
      })
      return false
    }
    
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    try {
      setSubmitting(true)
      
      // Subir imágenes a Cloudinary
      const uploadedImageUrls = []
      for (const imageUri of images) {
        try {
          const imageUrl = await uploadImageToCloudinary(imageUri)
          uploadedImageUrls.push(imageUrl)
        } catch (error) {
          console.error("Error uploading image:", error)
          toast.show({
            description: "Error al subir imágenes. Intenta de nuevo.",
            status: "error"
          })
          setSubmitting(false)
          return
        }
      }
      
      // Crear el documento de reclamo
      const reclamo = {
        idUsuario: userData.id,
        idPoliza: policyData.id,
        estadoReclamo: "Pendiente",
        tipoSiniestro: reportType,
        descripcion: description,
        ubicacion: location,
        fotos: uploadedImageUrls,
        necesitaAsistencia: needsAssistance === "yes",
        fechaCreacion: new Date(),
        vehiculoId: vehicle,
      }
      
      // Guardar en Firestore
      const reclamosRef = collection(db, "log", userData.id, "reclamosUser")
      const docRef = await addDoc(reclamosRef, reclamo)
      
      // Actualizar el documento con su ID
      await updateDoc(doc(db, "log", userData.id, "reclamosUser", docRef.id), {
        idReclamo: docRef.id
      })
      
      toast.show({
        description: "Reporte enviado exitosamente",
        status: "success"
      })
      
      // Navegar de vuelta
      navigation.goBack()
    } catch (error) {
      console.error("Error submitting report:", error)
      toast.show({
        description: "Error al enviar el reporte. Intenta de nuevo.",
        status: "error"
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="lg" color="blue.500" />
        <Text mt={4}>Cargando información...</Text>
      </Box>
    )
  }

  return (
    <ScrollView>
      <Header />
      <LinearGradient colors={['#f0f4f8', '#e9ecef']} style={{ flex: 1 }}>
        <VStack space={4} p={4}>
          <Box bg="white" p={4} borderRadius="xl" shadow={3}>
            <Heading size="md" mb={4} color="blue.600">
              Crear Nuevo Reporte
            </Heading>

            <FormControl mb={4} isRequired>
              <FormControl.Label>Vehículo</FormControl.Label>
              <Select
                selectedValue={vehicle}
                minWidth="200"
                accessibilityLabel="Selecciona el vehículo"
                placeholder="Selecciona el vehículo"
                _selectedItem={{
                  bg: "blue.100",
                  endIcon: <CheckIcon size="5" />,
                }}
                onValueChange={(itemValue) => setVehicle(itemValue)}
                borderRadius="lg"
              >
                {userVehicles.map((v) => (
                  <Select.Item 
                    key={v.id} 
                    label={`${v.marca} ${v.modelo} (${v.placa})`} 
                    value={v.id} 
                  />
                ))}
              </Select>
              {vehicleData && policyData && (
                <Box mt={2} p={2} bg="blue.50" borderRadius="md">
                  <Text fontSize="xs" color="blue.600">
                    Póliza: {POLICY_TYPES[policyData.polizaId]?.name || policyData.polizaId}
                  </Text>
                  <Text fontSize="xs" color="blue.600">
                    Vence: {policyData.fechaVencimiento?.toDate ? 
                            policyData.fechaVencimiento.toDate().toLocaleDateString() : 
                            new Date(policyData.fechaVencimiento).toLocaleDateString()}
                  </Text>
                </Box>
              )}
            </FormControl>

            <FormControl mb={4} isRequired isDisabled={!policyData}>
              <FormControl.Label>Tipo de Incidente</FormControl.Label>
              <Select
                selectedValue={reportType}
                minWidth="200"
                accessibilityLabel="Selecciona el tipo de incidente"
                placeholder="Selecciona el tipo de incidente"
                _selectedItem={{
                  bg: "blue.100",
                  endIcon: <CheckIcon size="5" />,
                }}
                onValueChange={(itemValue) => setReportType(itemValue)}
                borderRadius="lg"
              >
                {validIncidentTypes.map((type) => (
                  <Select.Item 
                    key={type} 
                    label={INCIDENT_TYPES[type].name} 
                    value={type} 
                  />
                ))}
              </Select>
              {policyData && reportType && (
                <Text fontSize="xs" mt={1} color="gray.500">
                  {INCIDENT_TYPES[reportType]?.description}
                </Text>
              )}
              {policyData && validIncidentTypes.length === 0 && (
                <Text fontSize="xs" mt={1} color="red.500">
                  Tu póliza no cubre ningún tipo de incidente. Contacta a soporte.
                </Text>
              )}
            </FormControl>

            <FormControl mb={4} isRequired>
              <FormControl.Label>Ubicación</FormControl.Label>
              <Input 
                placeholder="Ingresa la ubicación del incidente" 
                value={location} 
                onChangeText={setLocation}
                borderRadius="lg"
              />
            </FormControl>

            <FormControl mb={4} isRequired>
              <FormControl.Label>Descripción</FormControl.Label>
              <TextArea 
                h={20} 
                placeholder="Describe lo que ocurrió con detalle" 
                value={description} 
                onChangeText={setDescription}
                borderRadius="lg"
              />
            </FormControl>

            <FormControl mb={4}>
              <FormControl.Label>Fotos del incidente (máx. 3)</FormControl.Label>
              <HStack space={2} flexWrap="wrap">
                {images.map((img, index) => (
                  <Box key={index} position="relative" mb={2}>
                    <Image 
                      source={{ uri: img }} 
                      alt={`Imagen ${index + 1}`}
                      size="lg"
                      borderRadius="md"
                    />
                    <TouchableOpacity 
                      onPress={() => removeImage(index)}
                      style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        backgroundColor: 'white',
                        borderRadius: 12,
                        padding: 2
                      }}
                    >
                      <Icon as={Ionicons} name="close-circle" size="sm" color="red.500" />
                    </TouchableOpacity>
                  </Box>
                ))}
                {images.length < 3 && (
                  <TouchableOpacity onPress={pickImage}>
                    <Box 
                      width={100} 
                      height={100}
                      borderWidth={1} 
                      borderColor="gray.300" 
                      borderStyle="dashed"
                      borderRadius="md"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Icon as={Ionicons} name="add" size="md" color="gray.400" />
                    </Box>
                  </TouchableOpacity>
                )}
              </HStack>
              <Text fontSize="xs" mt={1} color="gray.500">
                Sube fotos claras del incidente para agilizar el proceso
              </Text>
            </FormControl>

            <Divider my={4} />

            <FormControl mb={4}>
              <FormControl.Label>¿Necesitas asistencia inmediata?</FormControl.Label>
              <Radio.Group 
                name="needsAssistance" 
                value={needsAssistance} 
                onChange={(value) => setNeedsAssistance(value)}
              >
                <HStack space={4}>
                  <Radio value="yes" my={1}>
                    Sí
                  </Radio>
                  <Radio value="no" my={1}>
                    No
                  </Radio>
                </HStack>
              </Radio.Group>
              {needsAssistance === "yes" && (
                <Text fontSize="xs" mt={1} color="blue.600">
                  Un agente se pondrá en contacto contigo lo antes posible
                </Text>
              )}
            </FormControl>

            <Button 
              colorScheme="blue" 
              onPress={handleSubmit} 
              mt={2}
              isLoading={submitting}
              isLoadingText="Enviando..."
              borderRadius="lg"
              shadow={2}
            >
              Enviar Reporte
            </Button>
          </Box>
        </VStack>
      </LinearGradient>

      <AlertDialog 
        leastDestructiveRef={cancelRef} 
        isOpen={isOpen} 
        onClose={() => {
          setIsOpen(false)
          navigation.goBack()
        }}
      >
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>Atención</AlertDialog.Header>
          <AlertDialog.Body>
            {alertMessage}
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button.Group space={2}>
              <Button 
                colorScheme="blue" 
                onPress={() => {
                  setIsOpen(false)
                  navigation.goBack()
                }}
              >
                Entendido
              </Button>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </ScrollView>
  )
}

export default CreateReportScreen
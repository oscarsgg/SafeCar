"use client"

import { useEffect, useState } from "react"
import { View, Text, FlatList, ActivityIndicator, Alert, TouchableOpacity, Platform } from "react-native"
import { Button, Box, Modal, VStack, HStack, Image, Icon, Pressable, useToast } from "native-base"
import { useNavigation } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { db } from "../../db/firebase"
import { collection, getDocs, doc, deleteDoc, getDoc } from "firebase/firestore"
import { getUserDocId, getUserCars } from "../utils/functions"
import { MaterialIcons, Ionicons } from "@expo/vector-icons"
import * as FileSystem from "expo-file-system"
// import * as Sharing from "expo-sharing"
// import * as Print from "expo-print"

// Configuración de los tipos de póliza y coberturas
const POLIZAS_CONFIG = {
  respCivil: {
    nombre: "Responsabilidad Civil",
    descripcion: "Responsabilidad civil obligatoria",
    color: "#00bfff",
    coberturas: {
      responsabilidadCivil: true,
      gastosMedicos: false,
      robo: false,
      danosMateriales: false,
      asistenciaVial: false,
      geolocalizacion: false,
    },
  },
  basico: {
    nombre: "Básico",
    descripcion: "Protección contra daños a terceros",
    color: "#2196F3",
    coberturas: {
      responsabilidadCivil: true,
      gastosMedicos: true,
      robo: false,
      danosMateriales: false,
      asistenciaVial: true,
      geolocalizacion: false,
    },
  },
  amplio: {
    nombre: "Cobertura Amplia",
    descripcion: "Protección total para tu vehículo",
    color: "#2424a4",
    coberturas: {
      responsabilidadCivil: true,
      gastosMedicos: true,
      robo: true,
      danosMateriales: true,
      asistenciaVial: true,
      geolocalizacion: true,
    },
  },
}

const PolizasScreen = () => {
  const navigation = useNavigation()
  const [polizas, setPolizas] = useState([])
  const [loading, setLoading] = useState(true)
  const [userCars, setUserCars] = useState([])
  const [selectedPoliza, setSelectedPoliza] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [userData, setUserData] = useState(null)
  const toast = useToast()

  useEffect(() => {
    const fetchPolizas = async () => {
      try {
        const user = await AsyncStorage.getItem("@user_data")
        if (!user) return
        const userData = JSON.parse(user)
        setUserData(userData)
        const { email } = userData
        const userId = await getUserDocId(email)
        if (!userId) return

        // Obtener los carros del usuario
        const cars = await getUserCars(email)
        setUserCars(cars)

        const polizaRef = collection(db, `log/${userId}/polizaUser`)
        const querySnapshot = await getDocs(polizaRef)

        const fetchedPolizas = []
        for (const docSnap of querySnapshot.docs) {
          const polizaData = docSnap.data()
          const polizaId = polizaData.polizaId

          const polizaRef = doc(db, "polizas", polizaId)
          const polizaSnap = await getDoc(polizaRef)

          fetchedPolizas.push({
            id: docSnap.id,
            carroId: polizaData.carroId,
            fechaCompra: polizaData.fechaCompra?.toDate(),
            fechaVencimiento: polizaData.fechaVencimiento?.toDate(),
            precioFinal: polizaData.precioFinal,
            polizaId: polizaId,
            polizaNombre: polizaSnap.exists() ? polizaSnap.data().nombre : "Desconocido",
            polizaData: polizaSnap.exists() ? polizaSnap.data() : null,
          })
        }

        setPolizas(fetchedPolizas)
      } catch (error) {
        console.error("Error obteniendo pólizas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPolizas()
  }, [])

  const eliminarPoliza = async (polizaId) => {
    try {
      const user = await AsyncStorage.getItem("@user_data")
      if (!user) return
      const { email } = JSON.parse(user)
      const userId = await getUserDocId(email)
      if (!userId) return

      await deleteDoc(doc(db, `log/${userId}/polizaUser/${polizaId}`))
      setPolizas(polizas.filter((p) => p.id !== polizaId))
      Alert.alert("Éxito", "Póliza eliminada correctamente")
      setShowModal(false)
    } catch (error) {
      console.error("Error eliminando póliza:", error)
    }
  }

  const getCarDescription = (carroId) => {
    const car = userCars.find((c) => c.id === carroId)
    if (car) {
      return `${car.marca} ${car.modelo} ${car.trim || ""} (${car.año})`
    }
    return "Carro Desconocido"
  }

  const getCar = (carroId) => {
    return userCars.find((c) => c.id === carroId) || null
  }

  const handlePolizaPress = (poliza) => {
    setSelectedPoliza(poliza)
    setShowModal(true)
  }

  const formatDate = (date) => {
    if (!date) return "N/A"
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const generatePdfHtml = (poliza, car) => {
    const polizaConfig = POLIZAS_CONFIG[poliza.polizaId] || {
      nombre: poliza.polizaNombre,
      descripcion: "Póliza de seguro",
      coberturas: {},
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Póliza de Seguro</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          max-width: 200px;
          margin-bottom: 10px;
        }
        h1 {
          color: #2196F3;
          margin: 0;
          font-size: 24px;
        }
        .policy-number {
          font-size: 18px;
          color: #666;
          margin: 5px 0 20px;
        }
        .section {
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #2196F3;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        .info-row {
          display: flex;
          margin-bottom: 8px;
        }
        .info-label {
          font-weight: bold;
          width: 40%;
        }
        .info-value {
          width: 60%;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
        .coverage-yes {
          color: green;
          font-weight: bold;
        }
        .coverage-no {
          color: red;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="https://firebasestorage.googleapis.com/v0/b/safecar-app.appspot.com/o/logogod.png?alt=media" alt="SafeCar Logo" class="logo">
        <h1>PÓLIZA DE SEGURO SAFECAR</h1>
        <p class="policy-number">Póliza No: ${poliza.id.substring(0, 8).toUpperCase()}</p>
      </div>
      
      <div class="section">
        <div class="section-title">DATOS DEL ASEGURADO</div>
        <div class="info-row">
          <div class="info-label">Nombre:</div>
          <div class="info-value">${userData?.firstName || ""} ${userData?.lastName || ""}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Email:</div>
          <div class="info-value">${userData?.email || ""}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Teléfono:</div>
          <div class="info-value">${userData?.phone || ""}</div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">DATOS DEL VEHÍCULO</div>
        <div class="info-row">
          <div class="info-label">Marca:</div>
          <div class="info-value">${car?.marca || "No disponible"}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Modelo:</div>
          <div class="info-value">${car?.modelo || "No disponible"}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Año:</div>
          <div class="info-value">${car?.año || "No disponible"}</div>
        </div>
        <div class="info-row">
          <div class="info-label">VIN:</div>
          <div class="info-value">${car?.vin || "No disponible"}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Placas:</div>
          <div class="info-value">${car?.placas || "No disponible"}</div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">DATOS DE LA PÓLIZA</div>
        <div class="info-row">
          <div class="info-label">Tipo de Póliza:</div>
          <div class="info-value">${polizaConfig.nombre}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Descripción:</div>
          <div class="info-value">${polizaConfig.descripcion}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Fecha de Emisión:</div>
          <div class="info-value">${formatDate(poliza.fechaCompra)}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Fecha de Vencimiento:</div>
          <div class="info-value">${formatDate(poliza.fechaVencimiento)}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Prima Anual:</div>
          <div class="info-value">$${poliza.precioFinal.toLocaleString()} MXN</div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">COBERTURAS</div>
        <table>
          <tr>
            <th>Cobertura</th>
            <th>Incluido</th>
          </tr>
          <tr>
            <td>Responsabilidad Civil (Daños a terceros)</td>
            <td class="${polizaConfig.coberturas.responsabilidadCivil ? "coverage-yes" : "coverage-no"}">
              ${polizaConfig.coberturas.responsabilidadCivil ? "✓ Incluido" : "✕ No incluido"}
            </td>
          </tr>
          <tr>
            <td>Gastos Médicos a Ocupantes</td>
            <td class="${polizaConfig.coberturas.gastosMedicos ? "coverage-yes" : "coverage-no"}">
              ${polizaConfig.coberturas.gastosMedicos ? "✓ Incluido" : "✕ No incluido"}
            </td>
          </tr>
          <tr>
            <td>Robo Total</td>
            <td class="${polizaConfig.coberturas.robo ? "coverage-yes" : "coverage-no"}">
              ${polizaConfig.coberturas.robo ? "✓ Incluido" : "✕ No incluido"}
            </td>
          </tr>
          <tr>
            <td>Daños Materiales al Vehículo</td>
            <td class="${polizaConfig.coberturas.danosMateriales ? "coverage-yes" : "coverage-no"}">
              ${polizaConfig.coberturas.danosMateriales ? "✓ Incluido" : "✕ No incluido"}
            </td>
          </tr>
          <tr>
            <td>Asistencia Vial</td>
            <td class="${polizaConfig.coberturas.asistenciaVial ? "coverage-yes" : "coverage-no"}">
              ${polizaConfig.coberturas.asistenciaVial ? "✓ Incluido" : "✕ No incluido"}
            </td>
          </tr>
          <tr>
            <td>Geolocalización del Vehículo</td>
            <td class="${polizaConfig.coberturas.geolocalizacion ? "coverage-yes" : "coverage-no"}">
              ${polizaConfig.coberturas.geolocalizacion ? "✓ Incluido" : "✕ No incluido"}
            </td>
          </tr>
        </table>
      </div>
      
      <div class="footer">
        <p>Este documento es una constancia digital de tu póliza de seguro SafeCar.</p>
        <p>Para cualquier aclaración o duda, comunícate al centro de atención: (800) 123-4567</p>
        <p>© ${new Date().getFullYear()} SafeCar - Todos los derechos reservados</p>
      </div>
    </body>
    </html>
    `
  }

  const downloadPdf = async () => {
    if (!selectedPoliza) return

    try {
      setGeneratingPdf(true)
      const car = getCar(selectedPoliza.carroId)
      const html = generatePdfHtml(selectedPoliza, car)

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      })

      const pdfName = `Poliza_SafeCar_${selectedPoliza.id.substring(0, 8)}.pdf`

      if (Platform.OS === "android") {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync()

        if (permissions.granted) {
          const destinationUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            pdfName,
            "application/pdf",
          )

          await FileSystem.copyAsync({
            from: uri,
            to: destinationUri,
          })

          toast.show({
            description: "PDF guardado en tu dispositivo",
            status: "success",
          })
        } else {
          // Si no se otorgan permisos, compartir el archivo
          await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" })
        }
      } else {
        // En iOS, simplemente compartir el archivo
        await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" })
      }
    } catch (error) {
      console.error("Error al generar PDF:", error)
      toast.show({
        description: "Error al generar el PDF",
        status: "error",
      })
    } finally {
      setGeneratingPdf(false)
    }
  }

  const renderPolizaItem = ({ item }) => {
    const polizaConfig = POLIZAS_CONFIG[item.polizaId] || { color: "#999" }

    return (
      <TouchableOpacity onPress={() => handlePolizaPress(item)}>
        <Box
          p={4}
          my={2}
          borderLeftWidth={4}
          borderLeftColor={polizaConfig.color}
          borderRadius="lg"
          bg="white"
          shadow={2}
          width="90%"
          alignSelf="center"
        >
          <HStack justifyContent="space-between" alignItems="center">
            <VStack space={1} flex={1}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: polizaConfig.color || "#333" }}>
                {item.polizaNombre}
              </Text>
              <Text style={{ fontSize: 14 }}>Vehículo: {getCarDescription(item.carroId)}</Text>
              <HStack space={2} mt={1}>
                <Text style={{ fontSize: 12, color: "#666" }}>
                  Vigencia: {formatDate(item.fechaCompra)} - {formatDate(item.fechaVencimiento)}
                </Text>
              </HStack>
            </VStack>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#2196F3" }}>
              ${item.precioFinal.toLocaleString()}
            </Text>
          </HStack>
        </Box>
      </TouchableOpacity>
    )
  }

  const PolizaDetailModal = () => {
    if (!selectedPoliza) return null

    const car = getCar(selectedPoliza.carroId)
    const polizaConfig = POLIZAS_CONFIG[selectedPoliza.polizaId] || {
      nombre: selectedPoliza.polizaNombre,
      descripcion: "Póliza de seguro",
      color: "#999",
      coberturas: {},
    }

    return (
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="xl">
        <Modal.Content maxWidth="400px">
          <Modal.CloseButton />
          <Modal.Header bg={polizaConfig.color} _text={{ color: "white", fontWeight: "bold" }} borderBottomWidth={0}>
            Detalles de Póliza
          </Modal.Header>

          <Modal.Body>
            <VStack space={4}>
              {/* Logo y encabezado */}
              <Box alignItems="center" mb={2}>
                <Image source={require("../../img/logogod.png")} alt="SafeCar Logo" size="md" resizeMode="contain" />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Póliza No: {selectedPoliza.id.substring(0, 8).toUpperCase()}
                </Text>
              </Box>

              {/* Información de la póliza */}
              <Box bg={`${polizaConfig.color}10`} p={4} rounded="md">
                <Text fontSize="xl" fontWeight="bold" color={polizaConfig.color} mb={1}>
                  {polizaConfig.nombre}
                </Text>
                <Text fontSize="sm" mb={3}>
                  {polizaConfig.descripcion}
                </Text>

                <HStack justifyContent="space-between" mb={1}>
                  <Text fontSize="sm" fontWeight="medium">
                    Fecha de emisión:
                  </Text>
                  <Text fontSize="sm">{formatDate(selectedPoliza.fechaCompra)}</Text>
                </HStack>

                <HStack justifyContent="space-between" mb={1}>
                  <Text fontSize="sm" fontWeight="medium">
                    Fecha de vencimiento:
                  </Text>
                  <Text fontSize="sm">{formatDate(selectedPoliza.fechaVencimiento)}</Text>
                </HStack>

                <HStack justifyContent="space-between">
                  <Text fontSize="sm" fontWeight="medium">
                    Prima anual:
                  </Text>
                  <Text fontSize="sm" fontWeight="bold" color={polizaConfig.color}>
                    ${selectedPoliza.precioFinal.toLocaleString()} MXN
                  </Text>
                </HStack>
              </Box>

              {/* Información del vehículo */}
              <Box>
                <Text fontSize="md" fontWeight="bold" mb={2}>
                  Vehículo Asegurado
                </Text>

                <Box bg="gray.50" p={3} rounded="md">
                  {car ? (
                    <VStack space={1}>
                      <HStack justifyContent="space-between">
                        <Text fontSize="sm" color="gray.500">
                          Marca:
                        </Text>
                        <Text fontSize="sm" fontWeight="medium">
                          {car.marca}
                        </Text>
                      </HStack>

                      <HStack justifyContent="space-between">
                        <Text fontSize="sm" color="gray.500">
                          Modelo:
                        </Text>
                        <Text fontSize="sm" fontWeight="medium">
                          {car.modelo} {car.trim || ""}
                        </Text>
                      </HStack>

                      <HStack justifyContent="space-between">
                        <Text fontSize="sm" color="gray.500">
                          Año:
                        </Text>
                        <Text fontSize="sm" fontWeight="medium">
                          {car.año}
                        </Text>
                      </HStack>

                      <HStack justifyContent="space-between">
                        <Text fontSize="sm" color="gray.500">
                          VIN:
                        </Text>
                        <Text fontSize="sm" fontWeight="medium">
                          {car.vin}
                        </Text>
                      </HStack>

                      <HStack justifyContent="space-between">
                        <Text fontSize="sm" color="gray.500">
                          Placas:
                        </Text>
                        <Text fontSize="sm" fontWeight="medium">
                          {car.placas}
                        </Text>
                      </HStack>
                    </VStack>
                  ) : (
                    <Text fontSize="sm" color="gray.500">
                      Información del vehículo no disponible
                    </Text>
                  )}
                </Box>
              </Box>

              {/* Tabla de coberturas */}
              <Box>
                <Text fontSize="md" fontWeight="bold" mb={2}>
                  Coberturas Incluidas
                </Text>

                <VStack space={2} bg="gray.50" p={3} rounded="md">
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="sm">Responsabilidad Civil</Text>
                    <Icon
                      as={MaterialIcons}
                      name={polizaConfig.coberturas.responsabilidadCivil ? "check-circle" : "cancel"}
                      color={polizaConfig.coberturas.responsabilidadCivil ? "green.500" : "red.500"}
                      size="sm"
                    />
                  </HStack>

                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="sm">Gastos Médicos</Text>
                    <Icon
                      as={MaterialIcons}
                      name={polizaConfig.coberturas.gastosMedicos ? "check-circle" : "cancel"}
                      color={polizaConfig.coberturas.gastosMedicos ? "green.500" : "red.500"}
                      size="sm"
                    />
                  </HStack>

                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="sm">Robo Total</Text>
                    <Icon
                      as={MaterialIcons}
                      name={polizaConfig.coberturas.robo ? "check-circle" : "cancel"}
                      color={polizaConfig.coberturas.robo ? "green.500" : "red.500"}
                      size="sm"
                    />
                  </HStack>

                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="sm">Daños Materiales</Text>
                    <Icon
                      as={MaterialIcons}
                      name={polizaConfig.coberturas.danosMateriales ? "check-circle" : "cancel"}
                      color={polizaConfig.coberturas.danosMateriales ? "green.500" : "red.500"}
                      size="sm"
                    />
                  </HStack>

                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="sm">Asistencia Vial</Text>
                    <Icon
                      as={MaterialIcons}
                      name={polizaConfig.coberturas.asistenciaVial ? "check-circle" : "cancel"}
                      color={polizaConfig.coberturas.asistenciaVial ? "green.500" : "red.500"}
                      size="sm"
                    />
                  </HStack>

                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="sm">Geolocalización</Text>
                    <Icon
                      as={MaterialIcons}
                      name={polizaConfig.coberturas.geolocalizacion ? "check-circle" : "cancel"}
                      color={polizaConfig.coberturas.geolocalizacion ? "green.500" : "red.500"}
                      size="sm"
                    />
                  </HStack>
                </VStack>
              </Box>

              <Text fontSize="xs" color="gray.500" textAlign="center">
                Para cualquier aclaración o duda, comunícate al centro de atención: (800) 123-4567
              </Text>
            </VStack>
          </Modal.Body>

          <Modal.Footer>
            <HStack space={2} justifyContent="space-between" width="100%">
              {/* <Button
                colorScheme="red"
                variant="outline"
                flex={1}
                leftIcon={<Icon as={MaterialIcons} name="delete" size="sm" />}
                onPress={() => {
                  Alert.alert("Eliminar Póliza", "¿Estás seguro de que deseas eliminar esta póliza?", [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Eliminar", onPress: () => eliminarPoliza(selectedPoliza.id), style: "destructive" },
                  ])
                }}
              >
                Eliminar
              </Button>

              <Button
                colorScheme="primary"
                flex={1}
                leftIcon={<Icon as={MaterialIcons} name="file-download" size="sm" />}
                onPress={downloadPdf}
                isLoading={generatingPdf}
                isLoadingText="Generando..."
              >
                Descargar PDF
              </Button> */}
            </HStack>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f4f4f4" }}>
      <Box bg="primary.500" p={4} shadow={2}>
        <HStack space={3} alignItems="center">
          <Pressable onPress={() => navigation.goBack()}>
            <Icon as={Ionicons} name="arrow-back" size="md" color="white" />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "white" }}>Mis Pólizas</Text>
        </HStack>
      </Box>

      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" style={{ flex: 1, justifyContent: "center" }} />
      ) : polizas.length === 0 ? (
        <VStack flex={1} justifyContent="center" alignItems="center" p={4}>
          <Icon as={MaterialIcons} name="policy" size="6xl" color="gray.300" />
          <Text style={{ textAlign: "center", fontSize: 18, marginTop: 20, fontWeight: "bold" }}>
            Aún no tienes ninguna póliza
          </Text>
          <Text style={{ textAlign: "center", fontSize: 14, marginTop: 10, color: "#666" }}>
            Cotiza y adquiere una póliza para proteger tu vehículo
          </Text>
          <Button
            mt={6}
            onPress={() => navigation.navigate("Cotizar")}
            leftIcon={<Icon as={MaterialIcons} name="add-circle-outline" size="sm" />}
          >
            Cotizar Seguro
          </Button>
        </VStack>
      ) : (
        <FlatList
          data={polizas}
          keyExtractor={(item) => item.id}
          renderItem={renderPolizaItem}
          contentContainerStyle={{ paddingVertical: 10 }}
        />
      )}

      <PolizaDetailModal />
    </View>
  )
}

export default PolizasScreen
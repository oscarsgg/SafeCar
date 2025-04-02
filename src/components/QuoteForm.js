"use client"

import { useState } from "react"
import { VStack, Box, Button, Text, Input, HStack, Pressable, Icon, Modal, useToast, Divider } from "native-base"
import { Car, Shield, ShieldCheck, ShieldPlus } from "lucide-react-native"
import CreditCardForm from "./CreditCardForm"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../../db/firebase"

// Configuración de los tipos de póliza y coberturas
const POLIZAS_CONFIG = {
  respCivil: {
    nombre: "Responsabilidad Civil",
    icon: Shield,
    descripcion: "Responsabilidad civil obligatoria",
    factor: 1.0,
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
    icon: ShieldCheck,
    descripcion: "Protección contra daños a terceros",
    factor: 1.5,
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
    icon: ShieldPlus,
    descripcion: "Protección total para tu vehículo",
    factor: 2.5,
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

const QuoteForm = ({ userData, navigation }) => {
  const [VIN, setVin] = useState("")
  const [plates, setPlates] = useState("")
  const [loading, setLoading] = useState(false)
  const [carData, setCarData] = useState(null)
  const [precioBase, setPrecioBase] = useState(0)
  const [polizas, setPolizas] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDetalleModal, setShowDetalleModal] = useState(false)

  const toast = useToast()

  // Calcular el precio base según las características del vehículo
  const calcularPrecioBase = (carInfo) => {
    // Obtener año actual para calcular la antigüedad
    const currentYear = new Date().getFullYear()
    const vehicleAge = currentYear - Number.parseInt(carInfo.modelYear)

    // Precio base inicial
    let precio = 1000 // Precio mínimo

    // 1. Ajuste por antigüedad
    if (vehicleAge <= 3) {
      // Vehículo nuevo: precio más alto por el valor
      precio += 3000
    } else if (vehicleAge <= 7) {
      // Vehículo seminuevo: precio medio
      precio += 1800
    } else if (vehicleAge <= 15) {
      // Vehículo usado: precio base
      precio += 1000
    } else {
      // Vehículo antiguo: precio más alto por riesgo de fallas
      precio += 775
    }

    // 2. Ajuste por marca (algunas marcas tienen repuestos más caros)
    const marcasPremium = ["BMW", "MERCEDES-BENZ", "AUDI", "LEXUS", "PORSCHE"]
    const marcasDeportivas = ["FERRARI", "LAMBORGHINI", "MASERATI"]

    if (marcasDeportivas.includes(carInfo.marca.toUpperCase())) {
      precio += 10000 // Autos deportivos de lujo
    } else if (marcasPremium.includes(carInfo.marca.toUpperCase())) {
      precio += 5000 // Autos premium
    }

    // 3. Ajuste por tipo de vehículo (inferido por el modelo)
    const modeloSUV = ["RAV4", "CR-V", "ROGUE", "EXPLORER", "TAHOE"].some((suv) =>
      carInfo.modelo.toUpperCase().includes(suv),
    )

    const modeloPickup = ["F-150", "SILVERADO", "RAM", "TUNDRA"].some((pickup) =>
      carInfo.modelo.toUpperCase().includes(pickup),
    )

    if (modeloSUV) {
      precio += 2000 // SUVs tienen más riesgo y valor
    } else if (modeloPickup) {
      precio += 3000 // Pickups tienen más riesgo y valor
    }

    return precio
  }

  // Generar los diferentes tipos de pólizas con sus precios calculados
  const generarPolizas = (precioBase) => {
    const polizasGeneradas = Object.keys(POLIZAS_CONFIG).map((tipo) => {
      const config = POLIZAS_CONFIG[tipo]
      return {
        id: tipo,
        nombre: config.nombre,
        icon: config.icon,
        descripcion: config.descripcion,
        factor: config.factor,
        coberturas: config.coberturas,
        costo_base: Math.round(precioBase * config.factor),
      }
    })

    setPolizas(polizasGeneradas)
  }

  // Verificar si ya existe un vehículo con el mismo VIN en la base de datos
  const checkVinExists = async (vin) => {
    try {
      // Buscar en todas las colecciones de carrosUser de todos los usuarios
      const usersRef = collection(db, "log")
      const usersSnapshot = await getDocs(usersRef)

      for (const userDoc of usersSnapshot.docs) {
        const carsRef = collection(db, `log/${userDoc.id}/carrosUser`)
        const carsSnapshot = await getDocs(carsRef)

        for (const carDoc of carsSnapshot.docs) {
          const carData = carDoc.data()
          if (carData.vin && carData.vin.toUpperCase() === vin.toUpperCase()) {
            return true // VIN encontrado
          }
        }
      }

      return false // VIN no encontrado
    } catch (error) {
      console.error("Error verificando VIN:", error)
      return false // En caso de error, permitir continuar
    }
  }

  const fetchCarDataByVIN = async () => {
    if (!VIN || VIN.length !== 17) {
      toast.show({
        description: "Por favor ingresa un VIN válido de 17 caracteres",
        status: "warning",
      })
      return
    }

    setLoading(true)

    try {
      // Verificar si ya existe un vehículo con este VIN en la base de datos
      const vinExists = await checkVinExists(VIN)

      if (vinExists) {
        toast.show({
          description: "Este VIN ya está registrado en el sistema. No se puede crear una póliza duplicada.",
          status: "error",
          duration: 5000,
        })
        setLoading(false)
        return
      }

      // Si no hay un VIN existente, continuar con la búsqueda del vehículo
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${VIN}?format=json`)
      const data = await response.json()
      const carInfo = data.Results[0]

      if (!carInfo.ModelYear || !carInfo.Make || !carInfo.Model) {
        toast.show({
          description: "No se encontraron datos válidos para este VIN",
          status: "error",
        })
        setLoading(false)
        return
      }

      const carDataInfo = {
        modelYear: carInfo.ModelYear,
        marca: carInfo.Make,
        modelo: carInfo.Model,
        trim: carInfo.Trim || "",
        transmissionStyle: carInfo.TransmissionStyle || "",
        placas: plates,
      }

      setCarData(carDataInfo)

      // Calcular precio base para este vehículo
      const precio = calcularPrecioBase(carDataInfo)
      setPrecioBase(precio)

      // Generar las diferentes pólizas con sus precios
      generarPolizas(precio)
    } catch (error) {
      toast.show({
        description: "Error al obtener datos del vehículo",
        status: "error",
      })
    }
    setLoading(false)
  }

  // Validar placas con entre 6 y 7 caracteres alfanuméricos
  const validatePlates = (plates) => {
    const regex = /^[A-Z0-9]{6,7}$/
    return regex.test(plates)
  }

  // Modificar la función handleSubmit para incluir la navegación
  const handleSubmit = () => {
    if (!validatePlates(plates)) {
      toast.show({
        description: "Por favor ingresa un formato de placas válido (Ej: ABC1234...)",
        status: "warning",
      })
      return
    }
    if (!VIN || VIN.length !== 17) {
      toast.show({
        description: "Por favor ingresa un VIN válido de 17 caracteres",
        status: "warning",
      })
      return
    }
    setShowPaymentModal(true)
  }

  // Añadir esta nueva función para limpiar el formulario y redirigir
  const handlePaymentSuccess = () => {
    // Cerrar el modal de pago
    setShowPaymentModal(false)

    // Limpiar todos los estados
    setVin("")
    setPlates("")
    setCarData(null)
    setPrecioBase(0)
    setPolizas([])
    setSelectedPlan(null)

    // Mostrar mensaje de éxito
    toast.show({
      description: "¡Pago completado con éxito! Redirigiendo...",
      status: "success",
      duration: 3000,
    })

    // Redirigir a MyVehicle después de un breve retraso para que el usuario vea el mensaje
    setTimeout(() => {
      navigation.navigate("Inicio", { screen: "MyVehicles" })
    }, 1500)
  }

  return (
    <VStack space={6}>
      {/* Sección de búsqueda por VIN */}
      <Box bg="white" p={6} rounded="2xl" shadow={3}>
        <VStack space={4}>
          <HStack space={3} alignItems="center">
            <Icon as={Car} size="xl" color="primary.500" />
            <VStack>
              <Text fontSize="2xl" fontWeight="bold">
                Cotiza tu seguro
              </Text>
              <Text fontSize="sm" color="gray.500">
                Ingresa el VIN y las placas de tu vehículo para comenzar
              </Text>
            </VStack>
          </HStack>

          {/* Campo VIN */}
          <Input
            value={VIN}
            onChangeText={(text) => setVin(text.toUpperCase())}
            placeholder="Ej: 1HGCM82633A123456"
            size="xl"
            fontSize="md"
            borderWidth={2}
            _focus={{
              borderColor: "primary.500",
              backgroundColor: "white",
            }}
          />

          {/* Campo Placas */}
          <Input
            value={plates}
            onChangeText={(text) => setPlates(text.toUpperCase())}
            placeholder="Ej: ABC1234"
            size="xl"
            fontSize="md"
            borderWidth={2}
            _focus={{
              borderColor: "primary.500",
              backgroundColor: "white",
            }}
          />

          <Button
            size="lg"
            colorScheme="primary"
            isLoading={loading}
            onPress={fetchCarDataByVIN}
            _text={{ fontSize: "md", fontWeight: "bold" }}
          >
            Buscar Vehículo
          </Button>
        </VStack>
      </Box>

      {/* Datos del vehículo */}
      {carData && (
        <Box bg="white" p={6} rounded="2xl" shadow={3}>
          <VStack space={4}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize="xl" fontWeight="bold" color="gray.800">
                Datos del Vehículo
              </Text>

              {/* <Text fontSize="md" fontWeight="bold" color="primary.500">
                Prima Base: ${precioBase.toLocaleString()}
              </Text> */}
            </HStack>

            <VStack space={3} bg="gray.50" p={4} rounded="xl">
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="md" color="gray.500">
                  Año
                </Text>
                <Text fontSize="md" fontWeight="semibold">
                  {carData.modelYear}
                </Text>
              </HStack>
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="md" color="gray.500">
                  Marca
                </Text>
                <Text fontSize="md" fontWeight="semibold">
                  {carData.marca}
                </Text>
              </HStack>
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="md" color="gray.500">
                  Modelo
                </Text>
                <Text fontSize="md" fontWeight="semibold">
                  {carData.modelo}
                </Text>
              </HStack>
              {carData.trim && (
                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="md" color="gray.500">
                    Submodelo
                  </Text>
                  <Text fontSize="md" fontWeight="semibold">
                    {carData.trim}
                  </Text>
                </HStack>
              )}
              {carData.transmissionStyle && (
                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="md" color="gray.500">
                    Transmisión
                  </Text>
                  <Text fontSize="md" fontWeight="semibold">
                    {carData.transmissionStyle}
                  </Text>
                </HStack>
              )}
              {carData.placas && (
                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="md" color="gray.500">
                    Placas
                  </Text>
                  <Text fontSize="md" fontWeight="semibold">
                    {carData.placas}
                  </Text>
                </HStack>
              )}
            </VStack>
          </VStack>
        </Box>
      )}

      {/* Planes de seguro */}
      {carData && polizas.length > 0 && (
        <VStack space={4}>
          <Text fontSize="xl" fontWeight="bold" color="gray.800">
            Planes Disponibles
          </Text>

          {polizas.map((plan) => (
            <Pressable key={plan.id} onPress={() => setSelectedPlan(plan)}>
              <Box
                bg="white"
                p={6}
                rounded="2xl"
                shadow={3}
                borderWidth={2}
                borderColor={selectedPlan?.id === plan.id ? "primary.500" : "transparent"}
              >
                <HStack space={4} alignItems="center" mb={4}>
                  <Box bg={selectedPlan?.id === plan.id ? "primary.500" : "gray.100"} p={3} rounded="xl">
                    <Icon as={plan.icon} size="lg" color={selectedPlan?.id === plan.id ? "white" : "gray.500"} />
                  </Box>
                  <VStack>
                    <Text fontSize="lg" fontWeight="bold" color="gray.800">
                      {plan.nombre}
                    </Text>
                    <HStack alignItems="baseline" space={1}>
                      <Text fontSize="2xl" fontWeight="bold" color="primary.500">
                        ${plan.costo_base.toLocaleString()}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        /anual
                      </Text>
                    </HStack>
                  </VStack>
                </HStack>

                <Text color="gray.600" fontSize="md" mb={3}>
                  {plan.descripcion}
                </Text>

                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => {
                    setSelectedPlan(plan)
                    setShowDetalleModal(true)
                  }}
                >
                  Ver detalle de cobertura
                </Button>
              </Box>
            </Pressable>
          ))}
        </VStack>
      )}

      {selectedPlan && (
        <Button size="lg" bg="primary.500" _pressed={{ bg: "primary.600" }} onPress={handleSubmit} mt={4}>
          <Text color="white" fontSize="md" fontWeight="bold">
            Pagar ${selectedPlan.costo_base.toLocaleString()} MXN
          </Text>
        </Button>
      )}

      {/* Modal de detalle de cobertura */}
      <Modal isOpen={showDetalleModal} onClose={() => setShowDetalleModal(false)} size="lg">
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Plan {selectedPlan?.nombre}</Modal.Header>
          <Modal.Body>
            {selectedPlan && (
              <VStack space={4}>
                <Text fontSize="md">{selectedPlan.descripcion}</Text>

                <Divider />

                <Text fontSize="lg" fontWeight="bold">
                  Coberturas incluidas:
                </Text>

                <VStack space={3} bg="gray.50" p={4} rounded="xl">
                  <HStack space={2} alignItems="center">
                    <Box
                      w="6"
                      h="6"
                      bg={selectedPlan.coberturas.responsabilidadCivil ? "green.500" : "red.500"}
                      rounded="full"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text color="white" fontWeight="bold">
                        {selectedPlan.coberturas.responsabilidadCivil ? "✓" : "✕"}
                      </Text>
                    </Box>
                    <Text flex={1}>Responsabilidad Civil (Daños a terceros)</Text>
                  </HStack>

                  <HStack space={2} alignItems="center">
                    <Box
                      w="6"
                      h="6"
                      bg={selectedPlan.coberturas.gastosMedicos ? "green.500" : "red.500"}
                      rounded="full"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text color="white" fontWeight="bold">
                        {selectedPlan.coberturas.gastosMedicos ? "✓" : "✕"}
                      </Text>
                    </Box>
                    <Text flex={1}>Gastos Médicos a Ocupantes</Text>
                  </HStack>

                  <HStack space={2} alignItems="center">
                    <Box
                      w="6"
                      h="6"
                      bg={selectedPlan.coberturas.robo ? "green.500" : "red.500"}
                      rounded="full"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text color="white" fontWeight="bold">
                        {selectedPlan.coberturas.robo ? "✓" : "✕"}
                      </Text>
                    </Box>
                    <Text flex={1}>Robo Total</Text>
                  </HStack>

                  <HStack space={2} alignItems="center">
                    <Box
                      w="6"
                      h="6"
                      bg={selectedPlan.coberturas.danosMateriales ? "green.500" : "red.500"}
                      rounded="full"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text color="white" fontWeight="bold">
                        {selectedPlan.coberturas.danosMateriales ? "✓" : "✕"}
                      </Text>
                    </Box>
                    <Text flex={1}>Daños Materiales al Vehículo</Text>
                  </HStack>

                  <HStack space={2} alignItems="center">
                    <Box
                      w="6"
                      h="6"
                      bg={selectedPlan.coberturas.asistenciaVial ? "green.500" : "red.500"}
                      rounded="full"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text color="white" fontWeight="bold">
                        {selectedPlan.coberturas.asistenciaVial ? "✓" : "✕"}
                      </Text>
                    </Box>
                    <Text flex={1}>Asistencia Vial</Text>
                  </HStack>

                  <HStack space={2} alignItems="center">
                    <Box
                      w="6"
                      h="6"
                      bg={selectedPlan.coberturas.geolocalizacion ? "green.500" : "red.500"}
                      rounded="full"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text color="white" fontWeight="bold">
                        {selectedPlan.coberturas.geolocalizacion ? "✓" : "✕"}
                      </Text>
                    </Box>
                    <Text flex={1}>Geolocalizacion del vehiculo en tiempo real</Text>
                  </HStack>
                </VStack>

                <HStack justifyContent="space-between" bg="blue.50" p={4} rounded="xl">
                  <Text fontSize="lg" fontWeight="bold">
                    Precio Anual:
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" color="primary.600">
                    ${selectedPlan.costo_base.toLocaleString()} MXN
                  </Text>
                </HStack>

                <Text mt={2} fontSize="sm" color="gray.500" textAlign="center">
                  El precio está calculado en base a las características de tu vehículo y las coberturas incluidas.
                </Text>
              </VStack>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              flex={1}
              onPress={() => {
                setShowDetalleModal(false)
                setShowPaymentModal(true)
              }}
              colorScheme="primary"
            >
              Seleccionar y Pagar
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>

      {/* Modal de pago */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} size="lg">
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Pago con Tarjeta</Modal.Header>
          <Modal.Body>
            <CreditCardForm
              amount={selectedPlan?.costo_base}
              onSuccess={handlePaymentSuccess}
              onClose={() => setShowPaymentModal(false)}
              userData={userData}
              carData={{ ...carData, vin: VIN }}
              selectedPlan={selectedPlan}
            />
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </VStack>
  )
}

export default QuoteForm
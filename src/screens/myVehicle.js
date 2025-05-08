import { useEffect, useState } from "react"
import { ActivityIndicator, Image, StatusBar, TouchableOpacity } from "react-native"
import { Box, Text, Button, HStack, VStack, Icon, Heading, Divider, Center, Pressable, ScrollView } from "native-base"
import { useNavigation } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getUserCars } from "../utils/functions"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { Landmark } from "lucide-react-native"

// Función para obtener imagen de Car Imagery
const getCarImageryImage = async (marca, modelo) => {
  try {
    const response = await fetch(
      `https://www.carimagery.com/api.asmx/GetImageUrl?searchTerm=${encodeURIComponent(marca + " " + modelo)}`,
    )
    const text = await response.text()

    // Extraer la URL usando regex
    const match = text.match(/<string[^>]*>(.*?)<\/string>/)
    const imageUrl = match ? match[1] : null

    return imageUrl || "https://via.placeholder.com/300" // Imagen de respaldo
  } catch (error) {
    console.error("Error obteniendo imagen:", error)
    return "https://via.placeholder.com/300" // Imagen de respaldo en caso de error
  }
}

const MyVehiclesScreen = () => {
  const navigation = useNavigation()
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [carImages, setCarImages] = useState({}) // Guardamos las imágenes aquí
  const [selectedCar, setSelectedCar] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await AsyncStorage.getItem("@user_data")
        const user = data ? JSON.parse(data) : null

        if (user?.email) {
          const carsData = await getUserCars(user.email)
          setCars(carsData || [])
          if (carsData && carsData.length > 0) {
            setSelectedCar(carsData[0])
          }
        }
      } catch (error) {
        console.error("Error obteniendo datos del usuario:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Cargar imágenes después de obtener los autos
  useEffect(() => {
    const fetchImages = async () => {
      const images = {}
      for (const car of cars) {
        images[car.vin] = await getCarImageryImage(car.marca, car.modelo)
      }
      setCarImages(images)
    }

    if (cars.length > 0) {
      fetchImages()
    }
  }, [cars])

  // Función para obtener un color de fondo basado en la marca del coche
  const getCarBgColor = (marca) => {
    const brandColors = {
      Honda: ["#e8f5e9", "#c8e6c9"],
      Toyota: ["#e3f2fd", "#bbdefb"],
      Ford: ["#e8eaf6", "#c5cae9"],
      Chevrolet: ["#fff3e0", "#ffe0b2"],
      Nissan: ["#f3e5f5", "#e1bee7"],
      BMW: ["#e0f7fa", "#b2ebf2"],
      Mercedes: ["#fafafa", "#f5f5f5"],
      Audi: ["#eceff1", "#cfd8dc"],
      Volkswagen: ["#f1f8e9", "#dcedc8"],
      Hyundai: ["#e1f5fe", "#b3e5fc"],
      Kia: ["#ede7f6", "#d1c4e9"],
      LAMBORGHINI: ["#98dbe3", "#14b8b8"],
    }

    return brandColors[marca] || ["#f5f5f5", "#e0e0e0"] // Color por defecto
  }

  const renderCarCard = (car) => {
    const fechaRegistro = car.fechaRegistro?.seconds
      ? new Date(car.fechaRegistro.seconds * 1000).toLocaleDateString()
      : "Fecha no disponible"

    const bgColors = getCarBgColor(car.marca)

    return (
      <Box width="100%" mb={4} overflow="hidden" borderRadius="2xl" shadow={3}>
        <LinearGradient
          colors={bgColors}
          style={{
            padding: 20,
            borderRadius: 16,
          }}
        >
          <VStack space={2}>
            <HStack justifyContent="space-between" alignItems="center">
              <VStack>
                <Text fontSize="md" color="gray.600" fontWeight="medium">
                  {car.marca}
                </Text>
                <Heading size="xl" fontWeight="bold">
                  {car.modelo}
                </Heading>
              </VStack>

              <Box position="relative" width="50%" height={120}>
                {carImages[car.vin] ? (
                  <Image
                    source={{ uri: carImages[car.vin] }}
                    style={{
                      width: "100%",
                      height: "100%",
                      resizeMode: "contain",
                    }}
                  />
                ) : (
                  <Center width="100%" height="100%">
                    <ActivityIndicator size="large" color="#000" />
                  </Center>
                )}
              </Box>
            </HStack>

            <HStack space={2} mt={2}>
              <Box bg="rgba(0,0,0,0.05)" px={3} py={1} borderRadius="full" flexDirection="row" alignItems="center">
                <Icon as={Ionicons} name="calendar-outline" size="xs" color="gray.600" mr={1} />
                <Text fontSize="xs" color="gray.600">
                  {car.año}
                </Text>
              </Box>

              <Box bg="rgba(0,0,0,0.05)" px={3} py={1} borderRadius="full" flexDirection="row" alignItems="center">
                <Icon as={MaterialCommunityIcons} name="car-shift-pattern" size="xs" color="gray.600" mr={1} />
                <Text fontSize="xs" color="gray.600">
                  {car.transmision}
                </Text>
              </Box>
            </HStack>

            <Divider my={2} bg="rgba(0,0,0,0.1)" />

            <VStack space={1}>
              <HStack justifyContent="space-between">
                <Text fontSize="xs" color="gray.500">
                  Placas
                </Text>
                <Text fontSize="xs" fontWeight="medium">
                  {car.placas}
                </Text>
              </HStack>

              {car.trim && (
                <HStack justifyContent="space-between">
                  <Text fontSize="xs" color="gray.500">
                    SubModelo
                  </Text>
                  <Text fontSize="xs" fontWeight="medium">
                    {car.trim}
                  </Text>
                </HStack>
              )}

              <HStack justifyContent="space-between">
                <Text fontSize="xs" color="gray.500">
                  VIN
                </Text>
                <Text fontSize="xs" fontWeight="medium">
                  {car.vin}
                </Text>
              </HStack>

              <HStack justifyContent="space-between">
                <Text fontSize="xs" color="gray.500">
                  Registro
                </Text>
                <Text fontSize="xs" fontWeight="medium">
                  {fechaRegistro}
                </Text>
              </HStack>
            </VStack>
          </VStack>
        </LinearGradient>
      </Box>
    )
  }

  return (
    <Box flex={1} bg="white" safeArea>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <Box px={4} pt={4} pb={2} flexDirection="row" justifyContent="space-between" alignItems="center">
        <HStack space={2} alignItems="center">
          <Pressable onPress={() => navigation.goBack()}>
            <Icon as={Ionicons} name="arrow-back" size="md" color="gray.800" />
          </Pressable>
          <Heading size="lg">Mis Vehículos</Heading>
        </HStack>

        <Box width={10} />
      </Box>

      {loading ? (
        <Center flex={1}>
          <ActivityIndicator size="large" color="#2196F3" />
        </Center>
      ) : cars.length === 0 ? (
        <Center flex={1} px={4}>
          <Icon as={Ionicons} name="car-outline" size="6xl" color="gray.300" />
          <Text fontSize="lg" color="gray.500" textAlign="center" mt={4}>
            No tienes vehículos registrados.
          </Text>
          <Button
            mt={6}
            leftIcon={<Icon as={Ionicons} name="add-circle-outline" size="sm" />}
            onPress={() => navigation.goBack()}
          >
            Agregar Vehículo
          </Button>
        </Center>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
          {cars.map((car, index) => (
            <TouchableOpacity key={index} activeOpacity={0.7} onPress={() => setSelectedCar(car)}>
              {renderCarCard(car)}
            </TouchableOpacity>
          ))}

          <Box height={80} />
        </ScrollView>
      )}

      <Box position="absolute" bottom={6} left={0} right={0} alignItems="center">
        <Button
          width="90%"
          onPress={() => navigation.goBack()}
          shadow={3}
          leftIcon={<Icon as={Ionicons} name="arrow-back-outline" size="sm" />}
        >
          Volver
        </Button>
      </Box>
    </Box>
  )
}

export default MyVehiclesScreen


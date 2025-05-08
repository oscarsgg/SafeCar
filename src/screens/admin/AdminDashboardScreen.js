import { useState, useEffect, useCallback } from "react"
import {
  Box,
  VStack,
  HStack,
  Text,
  ScrollView,
  Icon,
  Pressable,
  useColorModeValue,
  Image,
  Progress,
  Spinner,
  useTheme,
} from "native-base"
import { RefreshControl } from "react-native"
import { collection, getDocs, query, where, getCountFromServer, orderBy, limit } from "firebase/firestore"
import { db } from "../../../db/firebase"
import { Ionicons } from "@expo/vector-icons"
import Header from "../../components/Header"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Mapeo de tipos de incidentes
const INCIDENT_TYPES = {
  collision: {
    name: "Colisión",
    icon: "car-crash",
  },
  roadside: {
    name: "Asistencia vial",
    icon: "tow-truck",
  },
  glass: {
    name: "Rotura de cristales",
    icon: "car-door",
  },
  theft: {
    name: "Robo",
    icon: "shield-alert",
  },
  terceros: {
    name: "Daños a terceros",
    icon: "car-multiple",
  },
}

const AdminDashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPolicies: 0,
    totalClaims: 0,
    newUsersThisMonth: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [latestClaim, setLatestClaim] = useState(null)
  const [userData, setUserData] = useState(null)

  const theme = useTheme()
  const bgColor = useColorModeValue("gray.50", "gray.900")
  const cardBgColor = useColorModeValue("white", "gray.800")
  const textColor = useColorModeValue("gray.800", "white")
  const secondaryTextColor = useColorModeValue("gray.600", "gray.300")
  const primaryColor = "blue.500"

  useEffect(() => {
    getUserData()
  }, [])

  useEffect(() => {
    if (userData) {
      fetchStats()
      fetchLatestClaim()
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
    }
  }

  const fetchStats = async () => {
    try {
      setLoading(true)

      // Obtener total de usuarios
      const usersRef = collection(db, "log")
      const usersSnapshot = await getCountFromServer(usersRef)
      const totalUsers = usersSnapshot.data().count

      // Obtener usuarios nuevos este mes
      const currentDate = new Date()
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const newUsersQuery = query(usersRef, where("createdAt", ">=", firstDayOfMonth))
      const newUsersSnapshot = await getCountFromServer(newUsersQuery)
      const newUsersThisMonth = newUsersSnapshot.data().count

      // Contar pólizas activas
      let totalPolicies = 0
      const usersQuerySnapshot = await getDocs(usersRef)

      for (const userDoc of usersQuerySnapshot.docs) {
        const policiesRef = collection(db, "log", userDoc.id, "polizaUser")
        const policiesSnapshot = await getDocs(policiesRef)

        // Contar pólizas activas (no vencidas)
        const now = new Date()
        policiesSnapshot.forEach((doc) => {
          const policy = doc.data()
          const expiryDate = policy.fechaVencimiento?.toDate
            ? policy.fechaVencimiento.toDate()
            : new Date(policy.fechaVencimiento)

          if (expiryDate > now) {
            totalPolicies++
          }
        })
      }

      // Contar reclamos pendientes
      let totalClaims = 0

      for (const userDoc of usersQuerySnapshot.docs) {
        const claimsRef = collection(db, "log", userDoc.id, "reclamosUser")
        const pendingClaimsQuery = query(claimsRef, where("estadoReclamo", "in", ["Pendiente", "En Revisión"]))
        const pendingClaimsSnapshot = await getCountFromServer(pendingClaimsQuery)

        totalClaims += pendingClaimsSnapshot.data().count
      }

      setStats({
        totalUsers,
        totalPolicies,
        totalClaims,
        newUsersThisMonth,
      })
    } catch (error) {
      console.error("Error al obtener estadísticas:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLatestClaim = async () => {
    try {
      // Obtener todos los usuarios
      const usersRef = collection(db, "log")
      const usersSnapshot = await getDocs(usersRef)

      let latestClaimData = null
      let latestClaimDate = new Date(0) // Fecha muy antigua para comparar

      // Buscar el reclamo más reciente entre todos los usuarios
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id
        const userData = userDoc.data()

        const claimsRef = collection(db, "log", userId, "reclamosUser")
        const recentClaimsQuery = query(
          claimsRef,
          where("estadoReclamo", "in", ["Pendiente", "En Revisión"]),
          orderBy("fechaCreacion", "desc"),
          limit(1),
        )

        try {
          const claimsSnapshot = await getDocs(recentClaimsQuery)

          if (!claimsSnapshot.empty) {
            const claimDoc = claimsSnapshot.docs[0]
            const claimData = claimDoc.data()

            const claimDate = claimData.fechaCreacion?.toDate
              ? claimData.fechaCreacion.toDate()
              : new Date(claimData.fechaCreacion)

            if (claimDate > latestClaimDate) {
              latestClaimDate = claimDate
              latestClaimData = {
                id: claimDoc.id,
                userId: userId,
                userName: `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
                ...claimData,
              }
            }
          }
        } catch (error) {
          // Si falla por falta de índice, continuamos con el siguiente usuario
          console.log(`Error al obtener reclamos para usuario ${userId}:`, error)
          continue
        }
      }

      if (latestClaimData) {
        // Calcular tiempo transcurrido
        const now = new Date()
        const claimDate = latestClaimDate
        const diffMs = now - claimDate
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        let timeAgo
        if (diffDays > 0) {
          timeAgo = `${diffDays} día${diffDays > 1 ? "s" : ""}`
        } else if (diffHours > 0) {
          timeAgo = `${diffHours} hora${diffHours > 1 ? "s" : ""}`
        } else {
          timeAgo = `${diffMins} minuto${diffMins > 1 ? "s" : ""}`
        }

        // Formatear el reclamo para mostrarlo
        setLatestClaim({
          id: latestClaimData.id,
          userId: latestClaimData.userId,
          description:
            latestClaimData.descripcion ||
            INCIDENT_TYPES[latestClaimData.tipoSiniestro]?.name ||
            latestClaimData.tipoSiniestro ||
            "Reclamo sin descripción",
          status: latestClaimData.estadoReclamo,
          timeAgo: timeAgo,
          userName: latestClaimData.userName,
          vehicleInfo: latestClaimData.vehiculoInfo,
        })
      }
    } catch (error) {
      console.error("Error al obtener el reclamo más reciente:", error)
    }
  }

  // Función para manejar la recarga al deslizar hacia abajo
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      // Recargar todos los datos necesarios
      await getUserData()
      if (userData) {
        await Promise.all([fetchStats(), fetchLatestClaim()])
      }
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setRefreshing(false)
    }
  }, [userData])

  const getProgressValue = (status) => {
    switch (status) {
      case "Pendiente":
        return 25
      case "En Revisión":
        return 50
      case "Aprobado":
        return 75
      case "Completado":
        return 100
      default:
        return 0
    }
  }

  const ActionButton = ({ icon, title, onPress }) => (
    <Pressable flex={1} onPress={onPress}>
      {({ isPressed }) => (
        <Box
          bg={cardBgColor}
          p={4}
          rounded="xl"
          shadow={2}
          style={{
            transform: [{ scale: isPressed ? 0.98 : 1 }],
          }}
          alignItems="center"
        >
          <Icon as={Ionicons} name={icon} size={8} color={primaryColor} mb={2} />
          <Text fontSize="sm" color={textColor} textAlign="center">
            {title}
          </Text>
        </Box>
      )}
    </Pressable>
  )

  if (loading && !refreshing) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Spinner size="lg" color="blue.500" />
        <Text mt={4}>Cargando estadísticas...</Text>
      </Box>
    )
  }

  return (
    <ScrollView
      bg={bgColor}
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
      <Header />
      <Box p={4}>
        {/* Tarjeta de último reclamo */}
        {latestClaim ? (
          <Pressable onPress={() => navigation.navigate("Reclamos")} mb={4}>
            <Box bg={cardBgColor} p={4} rounded="xl" shadow={2}>
              <HStack space={4} alignItems="center">
                <Icon as={Ionicons} name="alert-circle" size={10} color="orange.500" />
                <VStack flex={1}>
                  <HStack justifyContent="space-between">
                    {/* <Text fontSize="sm" color={secondaryTextColor}>
                      Reclamo #{latestClaim.id.substring(0, 8)}
                    </Text> */}
                    <Text fontSize="xs" color={secondaryTextColor}>
                      {latestClaim.userName}
                    </Text>
                  </HStack>
                  <Text fontSize="md" fontWeight="bold" color={textColor}>
                    {latestClaim.description}
                  </Text>
                  <HStack alignItems="center" space={2} mt={1}>
                    <Progress value={getProgressValue(latestClaim.status)} size="xs" flex={1} colorScheme="blue" />
                    <Text fontSize="xs" color="blue.500">
                      {latestClaim.status}
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color={secondaryTextColor} mt={1}>
                    Actualizado hace {latestClaim.timeAgo}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </Pressable>
        ) : (
          <Box bg={cardBgColor} p={4} rounded="xl" shadow={2} mb={4} alignItems="center">
            <Icon as={Ionicons} name="document-text-outline" size={10} color="gray.400" mb={2} />
            <Text color="gray.500">No hay reclamos pendientes</Text>
          </Box>
        )}

        {/* Botones de acción */}
        <HStack space={4} mb={6}>
          <ActionButton icon="people" title="Gestionar Usuarios" onPress={() => navigation.navigate("Usuarios")} />
          <ActionButton
            icon="document-text"
            title="Gestionar Reclamos"
            onPress={() => navigation.navigate("Reclamos")}
          />
          <ActionButton
            icon="person-add"
            title="Registrar Admin"
            onPress={() => navigation.navigate("Usuarios", { screen: "AdminRegister" })}
          />
        </HStack>

        {/* Resumen de estadísticas */}
        <Box bg={cardBgColor} p={4} rounded="xl" shadow={2} mb={4}>
          <Text fontSize="xl" fontWeight="bold" color={primaryColor} mb={4}>
            Panel de Control
          </Text>
          <VStack space={4}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text color={textColor}>Usuarios totales</Text>
              <Text fontWeight="bold" color={primaryColor}>
                {stats.totalUsers}
              </Text>
            </HStack>
            <HStack justifyContent="space-between" alignItems="center">
              <Text color={textColor}>Pólizas activas</Text>
              <Text fontWeight="bold" color={primaryColor}>
                {stats.totalPolicies}
              </Text>
            </HStack>
            <HStack justifyContent="space-between" alignItems="center">
              <Text color={textColor}>Reclamos pendientes</Text>
              <Text fontWeight="bold" color="orange.500">
                {stats.totalClaims}
              </Text>
            </HStack>
            <HStack justifyContent="space-between" alignItems="center">
              <Text color={textColor}>Nuevos usuarios este mes</Text>
              <Text fontWeight="bold" color="green.500">
                {stats.newUsersThisMonth}
              </Text>
            </HStack>
          </VStack>
        </Box>

        {/* Tarjeta informativa */}
        <Box bg={cardBgColor} rounded="xl" shadow={2} overflow="hidden">
          <Box p={4}>
            <Text fontSize="xl" fontWeight="bold" color={primaryColor}>
              Panel de Administración
            </Text>
            <Text color={secondaryTextColor} mt={2}>
              Gestiona usuarios, pólizas y reclamos desde un solo lugar.
            </Text>
          </Box>
          <Image source={require("../../../img/banner.png")} alt="Admin Dashboard" height={200} width="100%" />
        </Box>
      </Box>
    </ScrollView>
  )
}

export default AdminDashboardScreen
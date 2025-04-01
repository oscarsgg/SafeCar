"use client"

import { useState, useEffect } from "react"
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Pressable,
  Input,
  Button,
  useColorModeValue,
  Badge,
  Spinner,
  FlatList,
  Modal,
  ScrollView,
  Divider,
  Avatar,
  useToast,
  Center,
} from "native-base"
import { RefreshControl } from "react-native"
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "../../../db/firebase"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import Header from "../../components/Header"
import AsyncStorage from "@react-native-async-storage/async-storage"

const AdminUsersScreen = ({ navigation }) => {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchText, setSearchText] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [userDetails, setUserDetails] = useState(null)
  const [userStats, setUserStats] = useState({
    vehicles: 0,
    policies: 0,
    claims: 0,
  })

  const toast = useToast()
  const bgColor = useColorModeValue("white", "gray.800")
  const cardBgColor = useColorModeValue("white", "gray.700")
  const modalBgColor = useColorModeValue("white", "gray.800")
  const textColor = useColorModeValue("gray.800", "white")
  const secondaryTextColor = useColorModeValue("gray.600", "gray.300")
  const borderColor = useColorModeValue("gray.200", "gray.600")

  useEffect(() => {
    getCurrentUser()
    fetchUsers()
  }, [])

  useEffect(() => {
    if (searchText) {
      const filtered = users.filter(
        (user) =>
          user.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(searchText.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchText.toLowerCase()),
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchText, users])

  const getCurrentUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("@user_data")
      if (userData) {
        setCurrentUser(JSON.parse(userData))
      }
    } catch (error) {
      console.error("Error retrieving user data:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const usersRef = collection(db, "log")
      const usersSnapshot = await getDocs(usersRef)

      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setUsers(usersData)
      setFilteredUsers(usersData)
    } catch (error) {
      console.error("Error al obtener usuarios:", error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchUsers()
      await getCurrentUser()
    } catch (error) {
      console.error("Error al actualizar datos:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleUserStatusChange = async (userId, isActive) => {
    try {
      // No permitir desactivar al usuario actual
      if (currentUser && currentUser.id === userId) {
        toast.show({
          description: "No puedes desactivar tu propia cuenta",
          status: "warning",
        })
        return
      }

      const userRef = doc(db, "log", userId)
      await updateDoc(userRef, {
        isActive: !isActive,
      })

      // Actualizar la lista local
      setUsers(users.map((user) => (user.id === userId ? { ...user, isActive: !isActive } : user)))

      // Si el usuario está en el modal, actualizar también
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, isActive: !isActive })
      }

      toast.show({
        description: `Usuario ${!isActive ? "activado" : "desactivado"} correctamente`,
        status: !isActive ? "success" : "info",
      })
    } catch (error) {
      console.error("Error al actualizar estado del usuario:", error)
      toast.show({
        description: "Error al actualizar el estado del usuario",
        status: "error",
      })
    }
  }

  const fetchUserDetails = async (userId) => {
    try {
      // Obtener datos del usuario
      const userRef = doc(db, "log", userId)
      const userDoc = await getDoc(userRef)

      if (!userDoc.exists()) {
        toast.show({
          description: "Usuario no encontrado",
          status: "error",
        })
        return
      }

      const userData = {
        id: userDoc.id,
        ...userDoc.data(),
      }

      setSelectedUser(userData)

      // Obtener estadísticas del usuario
      const vehiclesRef = collection(db, "log", userId, "carrosUser")
      const vehiclesSnapshot = await getDocs(vehiclesRef)

      const policiesRef = collection(db, "log", userId, "polizaUser")
      const policiesSnapshot = await getDocs(policiesRef)

      const claimsRef = collection(db, "log", userId, "reclamosUser")
      const claimsSnapshot = await getDocs(claimsRef)

      setUserStats({
        vehicles: vehiclesSnapshot.size,
        policies: policiesSnapshot.size,
        claims: claimsSnapshot.size,
      })

      // Obtener detalles adicionales si es necesario
      // Por ejemplo, la póliza más reciente o el último reclamo
      let latestPolicy = null
      let latestDate = new Date(0)

      policiesSnapshot.forEach((doc) => {
        const policy = doc.data()
        const creationDate = policy.fechaCreacion?.toDate
          ? policy.fechaCreacion.toDate()
          : new Date(policy.fechaCreacion)

        if (creationDate > latestDate) {
          latestDate = creationDate
          latestPolicy = {
            id: doc.id,
            ...policy,
          }
        }
      })

      setUserDetails({
        latestPolicy,
      })

      setShowModal(true)
    } catch (error) {
      console.error("Error al obtener detalles del usuario:", error)
      toast.show({
        description: "Error al cargar los detalles del usuario",
        status: "error",
      })
    }
  }

  const renderUserItem = ({ item }) => (
    <Pressable onPress={() => fetchUserDetails(item.id)}>
      {({ isPressed }) => (
        <Box
          bg={cardBgColor}
          p={4}
          rounded="xl"
          shadow={2}
          mb={3}
          style={{
            transform: [{ scale: isPressed ? 0.98 : 1 }],
          }}
        >
          <HStack justifyContent="space-between" alignItems="center">
            <HStack space={3} alignItems="center">
              <Icon
                as={Ionicons}
                name={item.isAdmin ? "shield" : "person"}
                size={6}
                color={item.isAdmin ? "purple.500" : "blue.500"}
              />
              <VStack>
                <Text fontSize="md" fontWeight="bold" color={textColor}>
                  {item.firstName} {item.lastName}
                </Text>
                <Text fontSize="sm" color={secondaryTextColor}>
                  {item.email}
                </Text>
              </VStack>
            </HStack>

            <HStack space={2} alignItems="center">
              {item.isAdmin && (
                <Badge colorScheme="purple" variant="subtle" rounded="full">
                  Admin
                </Badge>
              )}
              <Badge colorScheme={item.isActive !== false ? "green" : "red"} variant="subtle" rounded="full">
                {item.isActive !== false ? "Activo" : "Inactivo"}
              </Badge>
              <Pressable onPress={() => handleUserStatusChange(item.id, item.isActive !== false)}>
                <Icon
                  as={MaterialIcons}
                  name={item.isActive !== false ? "block" : "check-circle"}
                  size={5}
                  color={item.isActive !== false ? "red.500" : "green.500"}
                />
              </Pressable>
            </HStack>
          </HStack>
        </Box>
      )}
    </Pressable>
  )

  const UserDetailModal = () => {
    if (!selectedUser) return null

    return (
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="xl">
        <Modal.Content maxWidth="400px" bg={modalBgColor}>
          <Modal.CloseButton />
          <Modal.Header borderBottomWidth={0}>Detalles del Usuario</Modal.Header>
          <Modal.Body>
            <ScrollView showsVerticalScrollIndicator={false}>
              <VStack space={4} alignItems="center" mb={4}>
                <Avatar
                  size="xl"
                  source={selectedUser.profileImageURL ? { uri: selectedUser.profileImageURL } : undefined}
                >
                  {selectedUser.firstName?.charAt(0)}
                </Avatar>

                <VStack alignItems="center">
                  <Text fontSize="xl" fontWeight="bold" color={textColor}>
                    {selectedUser.firstName} {selectedUser.lastName}
                  </Text>
                  <Text fontSize="sm" color={secondaryTextColor}>
                    {selectedUser.email}
                  </Text>

                  <HStack space={2} mt={2}>
                    {selectedUser.isAdmin && (
                      <Badge colorScheme="purple" variant="subtle" rounded="full">
                        Administrador
                      </Badge>
                    )}
                    <Badge
                      colorScheme={selectedUser.isActive !== false ? "green" : "red"}
                      variant="subtle"
                      rounded="full"
                    >
                      {selectedUser.isActive !== false ? "Activo" : "Inactivo"}
                    </Badge>
                  </HStack>
                </VStack>
              </VStack>

              <Divider my={2} bg={borderColor} />

              <VStack space={4} mt={2}>
                <Heading size="sm" color={textColor}>
                  Información de Contacto
                </Heading>

                <HStack space={3} alignItems="center">
                  <Icon as={Ionicons} name="mail-outline" size={5} color="blue.500" />
                  <Text color={textColor}>{selectedUser.email}</Text>
                </HStack>

                {selectedUser.phone && (
                  <HStack space={3} alignItems="center">
                    <Icon as={Ionicons} name="call-outline" size={5} color="blue.500" />
                    <Text color={textColor}>{selectedUser.phone}</Text>
                  </HStack>
                )}

                {selectedUser.address && (
                  <HStack space={3} alignItems="flex-start">
                    <Icon as={Ionicons} name="location-outline" size={5} color="blue.500" mt={1} />
                    <Text color={textColor} flex={1}>
                      {selectedUser.address}
                    </Text>
                  </HStack>
                )}
              </VStack>

              <Divider my={4} bg={borderColor} />

              <VStack space={4}>
                <Heading size="sm" color={textColor}>
                  Estadísticas
                </Heading>

                <HStack justifyContent="space-between" alignItems="center">
                  <VStack alignItems="center" space={1}>
                    <Icon as={Ionicons} name="car-outline" size={6} color="blue.500" />
                    <Text fontWeight="bold" color={textColor}>
                      {userStats.vehicles}
                    </Text>
                    <Text fontSize="xs" color={secondaryTextColor}>
                      Vehículos
                    </Text>
                  </VStack>

                  <VStack alignItems="center" space={1}>
                    <Icon as={Ionicons} name="shield-checkmark-outline" size={6} color="green.500" />
                    <Text fontWeight="bold" color={textColor}>
                      {userStats.policies}
                    </Text>
                    <Text fontSize="xs" color={secondaryTextColor}>
                      Pólizas
                    </Text>
                  </VStack>

                  <VStack alignItems="center" space={1}>
                    <Icon as={Ionicons} name="document-text-outline" size={6} color="orange.500" />
                    <Text fontWeight="bold" color={textColor}>
                      {userStats.claims}
                    </Text>
                    <Text fontSize="xs" color={secondaryTextColor}>
                      Reclamos
                    </Text>
                  </VStack>
                </HStack>
              </VStack>

              {userDetails?.latestPolicy && (
                <>
                  <Divider my={4} bg={borderColor} />

                  <VStack space={3}>
                    <Heading size="sm" color={textColor}>
                      Última Póliza
                    </Heading>

                    <Box bg="blue.50" p={3} rounded="md">
                      <HStack justifyContent="space-between" mb={1}>
                        <Text fontSize="xs" color="blue.800">
                          Tipo:
                        </Text>
                        <Text fontSize="xs" fontWeight="bold" color="blue.800">
                          {userDetails.latestPolicy.polizaId === "amplio"
                            ? "Cobertura Amplia"
                            : userDetails.latestPolicy.polizaId === "basico"
                              ? "Cobertura Básica"
                              : userDetails.latestPolicy.polizaId === "rc"
                                ? "Responsabilidad Civil"
                                : userDetails.latestPolicy.polizaId}
                        </Text>
                      </HStack>

                      {userDetails.latestPolicy.vehiculoInfo && (
                        <HStack justifyContent="space-between" mb={1}>
                          <Text fontSize="xs" color="blue.800">
                            Vehículo:
                          </Text>
                          <Text fontSize="xs" fontWeight="bold" color="blue.800">
                            {`${userDetails.latestPolicy.vehiculoInfo.marca} ${userDetails.latestPolicy.vehiculoInfo.modelo}`}
                          </Text>
                        </HStack>
                      )}

                      {userDetails.latestPolicy.fechaVencimiento && (
                        <HStack justifyContent="space-between">
                          <Text fontSize="xs" color="blue.800">
                            Vencimiento:
                          </Text>
                          <Text fontSize="xs" fontWeight="bold" color="blue.800">
                            {new Date(userDetails.latestPolicy.fechaVencimiento.seconds * 1000).toLocaleDateString()}
                          </Text>
                        </HStack>
                      )}
                    </Box>
                  </VStack>
                </>
              )}

              <Divider my={4} bg={borderColor} />

              <VStack space={3}>
                <Heading size="sm" color={textColor}>
                  Acciones
                </Heading>

                <HStack space={3} justifyContent="center">
                  <Button
                    leftIcon={
                      <Icon
                        as={Ionicons}
                        name={selectedUser.isActive !== false ? "close-circle" : "checkmark-circle"}
                        size="sm"
                      />
                    }
                    onPress={() => {
                      handleUserStatusChange(selectedUser.id, selectedUser.isActive !== false)
                    }}
                    colorScheme={selectedUser.isActive !== false ? "red" : "green"}
                    variant="subtle"
                    flex={1}
                    isDisabled={currentUser && currentUser.id === selectedUser.id}
                  >
                    {selectedUser.isActive !== false ? "Desactivar" : "Activar"}
                  </Button>

                </HStack>

              </VStack>
            </ScrollView>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    )
  }

  return (
    <Box flex={1} bg={bgColor}>
      <Header />

      <Box flex={1} p={6}>
        <VStack space={4}>
          <HStack justifyContent="space-between" alignItems="center">
            <Heading size="lg" color={textColor}>
              Gestión de Usuarios
            </Heading>
          </HStack>
          <Button
            leftIcon={<Icon as={Ionicons} name="person-add" size="sm" />}
            onPress={() => navigation.navigate("AdminRegister")}
            colorScheme="blue"
            variant="solid"
            size="sm"
          >
            Nuevo Admin
          </Button>

          <Input
            placeholder="Buscar usuario..."
            value={searchText}
            onChangeText={setSearchText}
            width="100%"
            borderRadius="full"
            py={2}
            px={3}
            InputLeftElement={<Icon as={Ionicons} name="search" size={5} ml={2} color="gray.400" />}
            InputRightElement={
              searchText ? (
                <Pressable onPress={() => setSearchText("")} mr={2}>
                  <Icon as={Ionicons} name="close" size={5} color="gray.400" />
                </Pressable>
              ) : null
            }
          />

          {loading && !refreshing ? (
            <Box flex={1} justifyContent="center" alignItems="center">
              <Spinner size="lg" color="blue.500" />
            </Box>
          ) : (
            <FlatList
              data={filteredUsers}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#0077e6"]}
                  tintColor="#0077e6"
                />
              }
              ListEmptyComponent={
                <Center flex={1} py={10}>
                  <Icon as={Ionicons} name="search" size={12} color="gray.300" />
                  <Text color="gray.400" mt={2}>
                    No se encontraron usuarios
                  </Text>
                </Center>
              }
            />
          )}
        </VStack>
      </Box>

      {/* Modal de detalles del usuario */}
      <UserDetailModal />
    </Box>
  )
}

export default AdminUsersScreen
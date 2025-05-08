import React, { useState, useCallback } from "react"
import { ScrollView, RefreshControl } from "react-native"
import {
  VStack,
  Box,
  Text,
  Divider,
  Button,
  AlertDialog,
  HStack,
  Icon,
  useTheme,
  Pressable,
  useToast,
} from "native-base"
import { List } from "react-native-paper"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import Header from "../../components/Header"
import ProfileCard from "../../components/ProfileCard"
import { Ionicons } from "@expo/vector-icons"

const AdminProfileScreen = ({ handleLogout }) => {
  const navigation = useNavigation()
  const [userData, setUserData] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    pendingClaims: 0,
    lastLogin: null,
  })

  const theme = useTheme()
  const toast = useToast()
  const onClose = () => setIsOpen(false)
  const cancelRef = React.useRef(null)

  useFocusEffect(
    useCallback(() => {
      getUserData()
    }, []),
  )

  const getUserData = async () => {
    try {
      const data = await AsyncStorage.getItem("@user_data")
      if (data) {
        const parsedData = JSON.parse(data)
        setUserData(parsedData)

        // Actualizar la última fecha de inicio de sesión
        const now = new Date()
        setAdminStats((prev) => ({
          ...prev,
          lastLogin: now,
        }))

        // Aquí podrías obtener estadísticas reales desde Firestore
        // Por ahora usamos datos de ejemplo
        setAdminStats({
          totalUsers: 45,
          pendingClaims: 12,
          lastLogin: now,
        })
      }
    } catch (error) {
      console.error("Error retrieving user data:", error)
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await getUserData()
      toast.show({
        description: "Información actualizada",
        status: "success",
        duration: 2000,
      })
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setRefreshing(false)
    }
  }, [])

  const handleLogoutConfirmation = () => {
    setIsOpen(true)
  }

  const confirmLogout = () => {
    onClose()
    handleLogout()
  }

  const formatDate = (date) => {
    if (!date) return "N/A"
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary[500]]}
          tintColor={theme.colors.primary[500]}
        />
      }
    >
      <VStack>
        <Header />

        <Box px={4} pt={2} pb={4} mt={4}>
          <ProfileCard userData={userData} />

          {/* Admin Badge */}
          <Box position="absolute" top={6} right={6} bg="blue.600" px={3} py={1} borderRadius="full" shadow={2}>
            <HStack space={1} alignItems="center">
              <Icon as={Ionicons} name="shield" size="xs" color="white" />
              <Text color="white" fontWeight="bold" fontSize="xs">
                ADMINISTRADOR
              </Text>
            </HStack>
          </Box>

          <Divider my={4} />

          <Text fontSize="xl" fontWeight="bold" mb={4} color="gray.700">
            Opciones de Administrador
          </Text>

          <Box bg="white" rounded="xl" shadow={2} mb={4}>
            <List.Section>
              <List.Item
                title="Registrar Administrador"
                description="Crear nueva cuenta de admin"
                left={(props) => <List.Icon {...props} icon="account-plus" color={theme.colors.blue[500]} />}
                onPress={() => navigation.navigate("AdminRegister")}
              />
              <Divider my={0.5} />
            
              <List.Item
                title="Editar Perfil"
                description="Actualizar información personal"
                left={(props) => <List.Icon {...props} icon="account-edit" color={theme.colors.blue[500]} />}
                onPress={() => navigation.navigate("Perfil", { screen: "EditPerfil" })}
              />
              {/* <Divider my={0.5} /> */}
              
              {/* <List.Item
                title="Configuración"
                description="Preferencias de la aplicación"
                left={(props) => <List.Icon {...props} icon="cog" color={theme.colors.blue[500]} />}
                onPress={() => navigation.navigate("Perfil", { screen: "Configuration" })}
              /> */}
            </List.Section>
          </Box>

          <Button
            mt={4}
            colorScheme="danger"
            onPress={handleLogoutConfirmation}
            leftIcon={<Icon as={Ionicons} name="log-out-outline" size="sm" />}
            shadow={2}
          >
            Cerrar Sesión
          </Button>
        </Box>
      </VStack>

      <AlertDialog leastDestructiveRef={cancelRef} isOpen={isOpen} onClose={onClose}>
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>Cerrar Sesión</AlertDialog.Header>
          <AlertDialog.Body>¿Estás seguro que quieres cerrar sesión?</AlertDialog.Body>
          <AlertDialog.Footer>
            <Button.Group space={2}>
              <Button variant="unstyled" colorScheme="coolGray" onPress={onClose} ref={cancelRef}>
                Cancelar
              </Button>
              <Button colorScheme="danger" onPress={confirmLogout}>
                Cerrar Sesión
              </Button>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </ScrollView>
  )
}

export default AdminProfileScreen
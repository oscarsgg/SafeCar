import { useState, useCallback } from "react"
import { Avatar, Card, Title, Paragraph } from "react-native-paper"
import { VStack, HStack, Text, Icon, Pressable, Box, useToast, useDisclose, Actionsheet } from "native-base"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { getCarCount, getPolizaCount } from "../utils/functions"
import { useFocusEffect } from "@react-navigation/native"
import * as ImagePicker from "expo-image-picker"
import { Alert, ActivityIndicator } from "react-native"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "../../db/firebase"

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dexgwbbzn/image/upload"
const CLOUDINARY_UPLOAD_PRESET = "safecar" // Configura esto en tu dashboard de Cloudinary

const ProfileCard = ({ userData }) => {
  const [carCount, setCarCount] = useState(0)
  const [polizaCount, setPolizaCount] = useState(0)
  const [profileImage, setProfileImage] = useState(null)
  const [uploading, setUploading] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclose()
  const toast = useToast()

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        if (userData?.email) {
          try {
            // Solo obtener conteos de vehículos y pólizas si el usuario no es admin
            if (!userData.isAdmin) {
              const carCountData = await getCarCount(userData.email)
              const polizaCountData = await getPolizaCount(userData.email)
              setCarCount(carCountData)
              setPolizaCount(polizaCountData)
            }

            // Cargar la imagen de perfil si existe
            await loadProfileImage()
          } catch (error) {
            console.error("Error obteniendo los datos:", error)
          }
        }
      }

      fetchData()
    }, [userData]),
  )

  // Cargar la imagen de perfil desde Firestore
  const loadProfileImage = async () => {
    try {
      if (!userData?.id) return

      // Verificar si el usuario tiene una imagen de perfil guardada en Firestore
      const userRef = doc(db, "log", userData.id)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists() && userDoc.data().profileImageURL) {
        setProfileImage(userDoc.data().profileImageURL)
      }
    } catch (error) {
      console.error("Error cargando imagen de perfil:", error)
    }
  }

  // Solicitar permisos para acceder a la galería
  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== "granted") {
      toast.show({
        description: "Se necesitan permisos para acceder a la galería",
        status: "warning",
      })
      return false
    }
    return true
  }

  // Solicitar permisos para acceder a la cámara
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== "granted") {
      toast.show({
        description: "Se necesitan permisos para acceder a la cámara",
        status: "warning",
      })
      return false
    }
    return true
  }

  // Seleccionar imagen de la galería
  const pickImage = async () => {
    onClose()

    const hasPermission = await requestGalleryPermission()
    if (!hasPermission) return

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadToCloudinary(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Error seleccionando imagen:", error)
      toast.show({
        description: "Error al seleccionar la imagen",
        status: "error",
      })
    }
  }

  // Tomar foto con la cámara
  const takePhoto = async () => {
    onClose()

    const hasPermission = await requestCameraPermission()
    if (!hasPermission) return

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadToCloudinary(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Error tomando foto:", error)
      toast.show({
        description: "Error al tomar la foto",
        status: "error",
      })
    }
  }

  // Eliminar la imagen de perfil
  const removeProfileImage = async () => {
    onClose()

    if (!profileImage) return

    Alert.alert("Eliminar imagen", "¿Estás seguro de que deseas eliminar tu imagen de perfil?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Eliminar",
        onPress: async () => {
          try {
            setUploading(true)

            if (userData?.id) {
              // No necesitamos eliminar de Cloudinary, solo actualizar Firestore
              // Cloudinary tiene su propia gestión de recursos no utilizados

              // Actualizar Firestore
              const userRef = doc(db, "log", userData.id)
              await updateDoc(userRef, {
                profileImageURL: null,
              })

              setProfileImage(null)
              toast.show({
                description: "Imagen de perfil eliminada",
                status: "success",
              })
            }
          } catch (error) {
            console.error("Error eliminando imagen:", error)
            toast.show({
              description: "Error al eliminar la imagen",
              status: "error",
            })
          } finally {
            setUploading(false)
          }
        },
        style: "destructive",
      },
    ])
  }

  // Subir imagen a Cloudinary
  const uploadToCloudinary = async (uri) => {
    if (!userData?.id) {
      toast.show({
        description: "No se pudo identificar al usuario",
        status: "error",
      })
      return
    }

    try {
      setUploading(true)

      // Crear un nombre único para la imagen basado en el ID del usuario
      const filename = `profile_${userData.id}_${new Date().getTime()}`

      // Convertir URI a blob
      const response = await fetch(uri)
      const blob = await response.blob()

      // Crear FormData para la subida
      const formData = new FormData()
      formData.append("file", {
        uri: uri,
        type: "image/jpeg", // Puedes ajustar esto según el tipo de imagen
        name: filename,
      })
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)
      formData.append("folder", "profile_images")

      // Subir a Cloudinary
      const uploadResponse = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      })

      const uploadResult = await uploadResponse.json()

      if (uploadResult.error) {
        throw new Error(uploadResult.error.message)
      }

      // Obtener URL de la imagen
      const imageUrl = uploadResult.secure_url

      // Guardar URL en Firestore
      const userRef = doc(db, "log", userData.id)
      await updateDoc(userRef, {
        profileImageURL: imageUrl,
      })

      // Actualizar estado
      setProfileImage(imageUrl)

      toast.show({
        description: "Imagen de perfil actualizada",
        status: "success",
      })
    } catch (error) {
      console.error("Error subiendo imagen:", error)
      toast.show({
        description: "Error al subir la imagen: " + error.message,
        status: "error",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card
      elevation={3}
      style={{
        margin: 10,
        padding: 8,
        paddingBottom: 20,
        backgroundColor: "#f7f7f7",
        borderColor: "#007bff",
        borderWidth: 1,
        borderRadius: 10,
      }}
    >
      <Card.Content>
        <VStack space={4} alignItems="center">
          <Box position="relative">
            {uploading ? (
              <Box
                width={135}
                height={135}
                borderRadius={100}
                bg="gray.200"
                justifyContent="center"
                alignItems="center"
              >
                <ActivityIndicator size="large" color="#007bff" />
              </Box>
            ) : (
              <Avatar.Image size={135} source={profileImage ? { uri: profileImage } : require("../../img/user.png")} />
            )}

            <Pressable
              onPress={onOpen}
              position="absolute"
              bottom={0}
              right={0}
              bg="primary.500"
              borderRadius="full"
              p={2}
              zIndex={1}
            >
              <Icon as={Ionicons} name="camera" size={5} color="white" />
            </Pressable>
          </Box>

          <Title>
            {userData?.firstName} {userData?.lastName}
          </Title>
          <Paragraph>📞 {userData?.phone || "(Sin número de teléfono)"}</Paragraph>
          <Paragraph>📨 {userData?.email || "(Sin correo electronico)"}</Paragraph>

          {/* Solo mostrar contadores de vehículos y pólizas si NO es admin */}
          {userData && !userData.isAdmin && (
            <HStack space={4}>
              <VStack alignItems="center">
                <Icon as={Ionicons} name="car-outline" size={6} color="primary.500" />
                <Text>{carCount} Vehículos</Text>
              </VStack>
              <VStack alignItems="center">
                <Icon as={Ionicons} name="shield-checkmark-outline" size={6} color="primary.500" />
                <Text>{polizaCount} Póliza(s) Activa(s)</Text>
              </VStack>
            </HStack>
          )}
        </VStack>
      </Card.Content>

      {/* ActionSheet para opciones de imagen */}
      <Actionsheet isOpen={isOpen} onClose={onClose}>
        <Actionsheet.Content>
          <Box w="100%" h={60} px={4} justifyContent="center">
            <Text fontSize="16" color="gray.500" _dark={{ color: "gray.300" }}>
              Opciones de imagen de perfil
            </Text>
          </Box>
          <Actionsheet.Item
            startIcon={<Icon as={MaterialIcons} name="photo-library" size={5} color="gray.600" />}
            onPress={pickImage}
          >
            Elegir de la galería
          </Actionsheet.Item>
          <Actionsheet.Item
            startIcon={<Icon as={MaterialIcons} name="camera-alt" size={5} color="gray.600" />}
            onPress={takePhoto}
          >
            Tomar foto
          </Actionsheet.Item>
          {profileImage && (
            <Actionsheet.Item
              startIcon={<Icon as={MaterialIcons} name="delete" size={5} color="red.500" />}
              onPress={removeProfileImage}
            >
              Eliminar foto
            </Actionsheet.Item>
          )}
          <Actionsheet.Item onPress={onClose}>Cancelar</Actionsheet.Item>
        </Actionsheet.Content>
      </Actionsheet>
    </Card>
  )
}

export default ProfileCard
"use client"

import { useState } from "react"
import { Box, Text, Button, VStack, Input, Image, ScrollView, FormControl, useToast } from "native-base"
import { collection, addDoc, query, where, getDocs } from "firebase/firestore"
import { db } from "../../db/firebase";
import { LinearGradient } from "expo-linear-gradient"
import { Lock, Mail, User, Phone } from "lucide-react-native"

const RegisterScreen = ({ navigation, onLogin }) => {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()

  // Validar nombre y apellido (solo letras, sin números ni símbolos)
  const isValidName = (name) => /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/.test(name)

  // Validar email con expresión regular
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  // Validar contraseña (mínimo 5 caracteres)
  const isValidPassword = (password) => password.length >= 5

  // Validar que las contraseñas coincidan
  const doPasswordsMatch = () => password === confirmPassword

  // Validar número de teléfono (solo números, 10 dígitos)
  const isValidPhone = (phone) => /^\d{10}$/.test(phone)

  // Verificar si el correo ya existe
  const checkEmailExists = async (email) => {
    try {
      const emailQuery = query(collection(db, "log"), where("email", "==", email.toLowerCase().trim()))
      const emailSnapshot = await getDocs(emailQuery)
      return !emailSnapshot.empty
    } catch (error) {
      console.error("Error verificando email:", error)
      return false // En caso de error, asumimos que no existe para evitar bloquear el registro
    }
  }

  // Validar todos los campos
  const validateFields = () => {
    const newErrors = {}

    // Validar nombre
    if (!firstName.trim()) {
      newErrors.firstName = "El nombre es obligatorio"
    } else if (!isValidName(firstName)) {
      newErrors.firstName = "El nombre solo puede contener letras y espacios"
    }

    // Validar apellido
    if (!lastName.trim()) {
      newErrors.lastName = "El apellido es obligatorio"
    } else if (!isValidName(lastName)) {
      newErrors.lastName = "El apellido solo puede contener letras y espacios"
    }

    // Validar email
    if (!email.trim()) {
      newErrors.email = "El email es obligatorio"
    } else if (!isValidEmail(email)) {
      newErrors.email = "Ingrese un correo válido"
    }

    // Validar teléfono
    if (!phone.trim()) {
      newErrors.phone = "El teléfono es obligatorio"
    } else if (!isValidPhone(phone)) {
      newErrors.phone = "Ingrese un número de teléfono válido (10 dígitos)"
    }

    // Validar contraseña
    if (!password) {
      newErrors.password = "La contraseña es obligatoria"
    } else if (!isValidPassword(password)) {
      newErrors.password = "La contraseña debe tener al menos 5 caracteres"
    }

    // Validar confirmación de contraseña
    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirme su contraseña"
    } else if (!doPasswordsMatch()) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Manejo del registro
  const handleRegister = async () => {
    if (!validateFields()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Verificar si el correo ya existe
      const emailExists = await checkEmailExists(email)

      if (emailExists) {
        setErrors({ ...errors, email: "Este correo ya está registrado" })
        toast.show({
          description: "Este correo electrónico ya está registrado",
          status: "error",
          duration: 3000,
          placement: "top",
        })
        setIsSubmitting(false)
        return
      }

      // Aquí agregamos el campo isAdmin: false para los usuarios generales
      const docRef = await addDoc(collection(db, "log"), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password, // En un sistema real, la contraseña debería estar hasheada
        isAdmin: false, // Campo isAdmin establecido en false por defecto para usuarios generales
        isActive: true, // Usuario activo por defecto
        createdAt: new Date(),
      })

      console.log("Usuario registrado con ID:", docRef.id)

      toast.show({
        description: "Cuenta creada exitosamente",
        status: "success",
        duration: 3000,
        placement: "top",
      })

      // Si existe la función onLogin, la llamamos
      if (typeof onLogin === "function") {
        onLogin({
          id: docRef.id,
          firstName,
          lastName,
          email,
          phone,
        })
      } else {
        // Si no existe onLogin, navegamos a Login
        navigation.navigate("Login")
      }
    } catch (error) {
      console.error("Error al registrar usuario:", error)
      toast.show({
        description: "Error al crear la cuenta: " + error.message,
        status: "error",
        duration: 3000,
        placement: "top",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para formatear el número de teléfono (solo permitir dígitos)
  const handlePhoneChange = (text) => {
    // Eliminar cualquier carácter que no sea un dígito
    const formattedPhone = text.replace(/\D/g, "")
    setPhone(formattedPhone)
  }

  return (
    <LinearGradient colors={["#2563eb", "#3b82f6", "#60a5fa"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Box flex={1} justifyContent="center" alignItems="center" px={6} py={10}>
          <Box bg="white" rounded="3xl" width="100%" p={6} shadow={5}>
            <VStack space={6} alignItems="center">
              <Image source={require("../../img/logogod.png")} alt="Car Insurance" size="xl" resizeMode="contain" />

              <VStack space={2} width="100%">
                <Text fontSize="2xl" fontWeight="bold" color="blue.600" textAlign="center">
                  Regístrate en SafeCar
                </Text>
                <Text color="gray.500" textAlign="center">
                  Crea tu cuenta y comienza a proteger tu vehículo
                </Text>
              </VStack>

              <VStack space={4} width="100%">
                <FormControl isInvalid={!!errors.firstName}>
                  <Input
                    placeholder="Nombre"
                    value={firstName}
                    onChangeText={setFirstName}
                    size="lg"
                    borderRadius="full"
                    backgroundColor="gray.50"
                    InputLeftElement={<User size={20} color="gray" style={{ marginLeft: 10 }} />}
                  />
                  <FormControl.ErrorMessage>{errors.firstName}</FormControl.ErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.lastName}>
                  <Input
                    placeholder="Apellido"
                    value={lastName}
                    onChangeText={setLastName}
                    size="lg"
                    borderRadius="full"
                    backgroundColor="gray.50"
                    InputLeftElement={<User size={20} color="gray" style={{ marginLeft: 10 }} />}
                  />
                  <FormControl.ErrorMessage>{errors.lastName}</FormControl.ErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.email}>
                  <Input
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    size="lg"
                    borderRadius="full"
                    backgroundColor="gray.50"
                    InputLeftElement={<Mail size={20} color="gray" style={{ marginLeft: 10 }} />}
                  />
                  <FormControl.ErrorMessage>{errors.email}</FormControl.ErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.phone}>
                  <Input
                    placeholder="Teléfono (10 dígitos)"
                    value={phone}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                    size="lg"
                    borderRadius="full"
                    backgroundColor="gray.50"
                    InputLeftElement={<Phone size={20} color="gray" style={{ marginLeft: 10 }} />}
                    maxLength={10}
                  />
                  <FormControl.ErrorMessage>{errors.phone}</FormControl.ErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.password}>
                  <Input
                    placeholder="Contraseña"
                    value={password}
                    onChangeText={setPassword}
                    type="password"
                    size="lg"
                    borderRadius="full"
                    backgroundColor="gray.50"
                    InputLeftElement={<Lock size={20} color="gray" style={{ marginLeft: 10 }} />}
                  />
                  <FormControl.ErrorMessage>{errors.password}</FormControl.ErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.confirmPassword}>
                  <Input
                    placeholder="Confirmar Contraseña"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    type="password"
                    size="lg"
                    borderRadius="full"
                    backgroundColor="gray.50"
                    InputLeftElement={<Lock size={20} color="gray" style={{ marginLeft: 10 }} />}
                  />
                  <FormControl.ErrorMessage>{errors.confirmPassword}</FormControl.ErrorMessage>
                </FormControl>

                <Button
                  onPress={handleRegister}
                  size="lg"
                  rounded="full"
                  bg="blue.600"
                  _pressed={{ bg: "blue.700" }}
                  shadow={3}
                  isLoading={isSubmitting}
                  isLoadingText="Registrando..."
                >
                  Registrarse
                </Button>
              </VStack>

              <Text color="gray.500">
                ¿Ya tienes una cuenta?{" "}
                <Text color="blue.600" fontWeight="bold" onPress={() => navigation.navigate("Login")}>
                  Inicia sesión aquí
                </Text>
              </Text>
            </VStack>
          </Box>
        </Box>
      </ScrollView>
    </LinearGradient>
  )
}

export default RegisterScreen
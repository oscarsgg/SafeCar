"use client"

import { useState } from "react"
import { VStack, Box, Input, Text, Button, HStack, FormControl, useToast } from "native-base"
import { CreditCard } from "lucide-react-native"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../../db/firebase"

const CreditCardForm = ({ amount, onSuccess, onClose, userData, carData, selectedPlan }) => {
  const [cardNumber, setCardNumber] = useState("")
  const [cardHolder, setCardHolder] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")
  const [errors, setErrors] = useState({})
  const toast = useToast()

  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = cleaned.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(" ")
    } else {
      return text
    }
  }

  const formatExpiry = (text) => {
    const cleaned = text.replace(/[^0-9]/g, "")
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`
    }
    return cleaned
  }

  const validate = () => {
    const newErrors = {}

    if (!cardNumber || cardNumber.replace(/\s+/g, "").length !== 16) {
      newErrors.cardNumber = "Número de tarjeta inválido"
    }

    if (!cardHolder) {
      newErrors.cardHolder = "Nombre requerido"
    }

    if (!expiry || !expiry.includes("/")) {
      newErrors.expiry = "Fecha inválida"
    } else {
      const [month, year] = expiry.split("/")
      const currentYear = new Date().getFullYear() % 100
      const currentMonth = new Date().getMonth() + 1

      if (Number.parseInt(month) < 1 || Number.parseInt(month) > 12) {
        newErrors.expiry = "Mes inválido"
      } else if (
        Number.parseInt(year) < currentYear ||
        (Number.parseInt(year) === currentYear && Number.parseInt(month) < currentMonth)
      ) {
        newErrors.expiry = "Tarjeta vencida"
      }
    }

    if (!cvv || cvv.length !== 3) {
      newErrors.cvv = "CVV inválido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const saveTransactionData = async () => {
    try {
      const userLogRef = `log/${userData.id}` // Ruta base del usuario

      // Guardar datos del carro
      const carroRef = await addDoc(collection(db, `${userLogRef}/carrosUser`), {
        // userId: userData?.id,
        vin: carData.vin,
        marca: carData.marca,
        modelo: carData.modelo,
        año: carData.modelYear,
        placas: carData.placas,
        trim: carData.trim || "",
        transmision: carData.transmissionStyle || "",
        fechaRegistro: serverTimestamp(),
      })

      // Guardar datos de la póliza
      const fechaCompra = new Date()
      const fechaVencimiento = new Date(fechaCompra)
      fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1)

      const polizaRef = await addDoc(collection(db, `${userLogRef}/polizaUser`), {
        // userId: userData?.id,
        polizaId: selectedPlan.id,
        fechaCompra: serverTimestamp(),
        fechaVencimiento: fechaVencimiento,
        precioFinal: selectedPlan.costo_base,
        carroId: carroRef.id, // Referencia al carro registrado
      })

      console.log("Datos guardados exitosamente")
      return { carroRef, polizaRef }
    } catch (error) {
      console.error("Error al guardar datos:", error)
      throw error // Propagamos el error para manejarlo en handleSubmit
    }
  }

  const [isLoading, setIsLoading] = useState(false) // Nuevo estado de carga

  const handleSubmit = async () => {
    if (isLoading) return // Evita que se procese más de una vez

    if (validate()) {
      setIsLoading(true) // Activamos el estado de carga
      try {
        // Simulamos el proceso de pago
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Guardamos los datos en Firebase
        await saveTransactionData()

        // Notificamos éxito
        toast.show({
          description: "Pago procesado exitosamente",
          status: "success",
        })

        // Llamamos a onSuccess para limpiar el formulario y redirigir
        if (typeof onSuccess === "function") {
          onSuccess()
        }
      } catch (error) {
        console.error("Error en el proceso:", error)
        toast.show({
          description: "Error al procesar la transacción",
          status: "error",
        })
      } finally {
        setIsLoading(false) // Volvemos a habilitar el botón después del proceso
      }
    }
  }

  return (
    <Box p={0} rounded="2xl">
      <VStack space={6}>
        {/* Tarjeta Visual */}
        <Box bg="primary.500" p={6} rounded="xl" mb={4}>
          <VStack space={4}>
            <HStack justifyContent="space-between" alignItems="center">
              <CreditCard color="white" size={32} />
              <Text color="white" fontSize="xl" fontWeight="bold">
                Card
              </Text>
            </HStack>
            <Text color="white" fontSize="md" letterSpacing={0}>
              {cardNumber || "•••• •••• •••• ••••"}
            </Text>
            <HStack justifyContent="space-between">
              <Text color="white.700" fontSize="xs">
                {cardHolder || "TITULAR DE LA TARJETA"}
              </Text>
              <Text color="white.700" fontSize="xs">
                {expiry || "MM/YY"}
              </Text>
            </HStack>
          </VStack>
        </Box>

        {/* Formulario */}
        <FormControl isInvalid={"cardNumber" in errors}>
          <FormControl.Label>Número de Tarjeta</FormControl.Label>

          <Input
            value={cardNumber}
            onChangeText={(text) => setCardNumber(formatCardNumber(text))}
            maxLength={19}
            keyboardType="numeric"
            placeholder="0000 0000 0000 0000"
          />
          <FormControl.ErrorMessage>{errors.cardNumber}</FormControl.ErrorMessage>
        </FormControl>

        <FormControl isInvalid={"cardHolder" in errors}>
          <FormControl.Label>Titular de la Tarjeta</FormControl.Label>
          <Input value={cardHolder} onChangeText={setCardHolder} placeholder="Nombre como aparece en la tarjeta" />
          <FormControl.ErrorMessage>{errors.cardHolder}</FormControl.ErrorMessage>
        </FormControl>

        <HStack space={4}>
          <FormControl flex={1} isInvalid={"expiry" in errors}>
            <FormControl.Label>Vencimiento</FormControl.Label>
            <Input
              value={expiry}
              onChangeText={(text) => setExpiry(formatExpiry(text))}
              maxLength={5}
              placeholder="MM/YY"
              keyboardType="numeric"
            />
            <FormControl.ErrorMessage>{errors.expiry}</FormControl.ErrorMessage>
          </FormControl>

          <FormControl flex={1} isInvalid={"cvv" in errors}>
            <FormControl.Label>CVV</FormControl.Label>
            <Input
              value={cvv}
              onChangeText={(text) => setCvv(text.replace(/[^0-9]/g, ""))}
              maxLength={3}
              placeholder="123"
              keyboardType="numeric"
            />
            <FormControl.ErrorMessage>{errors.cvv}</FormControl.ErrorMessage>
          </FormControl>
        </HStack>

        <Button
          size="lg"
          onPress={handleSubmit}
          bg={isLoading ? "gray.400" : "primary.500"} // Cambia de color si está cargando
          isDisabled={isLoading} // Deshabilita el botón si está cargando
          _pressed={{ bg: "primary.600" }}
        >
          <Text color="white" fontSize="md" fontWeight="bold">
            {isLoading ? "Procesando..." : `Pagar $${amount} MXN`}
          </Text>
        </Button>
      </VStack>
    </Box>
  )
}

export default CreditCardForm
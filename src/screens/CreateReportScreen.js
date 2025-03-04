"use client"

import { useState } from "react"
import { ScrollView } from "react-native"
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
} from "native-base"

const CreateReportScreen = ({ navigation }) => {
  const [reportType, setReportType] = useState("")
  const [vehicle, setVehicle] = useState("")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [needsAssistance, setNeedsAssistance] = useState("no")

  const handleSubmit = () => {
    // Handle report submission
    console.log({
      reportType,
      vehicle,
      location,
      description,
      needsAssistance,
    })

    // Navigate back to home or to a confirmation screen
    navigation.goBack()
  }

  return (
    <ScrollView>
      <VStack space={4} p={4}>

        <Box bg="white" p={4} borderRadius="lg" shadow={2}>
          <Heading size="md" mb={4}>
            Crear Nuevo Reporte
          </Heading>

          <FormControl mb={4}>
            <FormControl.Label>Tipo de Incidente</FormControl.Label>
            <Select
              selectedValue={reportType}
              minWidth="200"
              accessibilityLabel="Selecciona el tipo de incidente"
              placeholder="Selecciona el tipo de incidente"
              _selectedItem={{
                bg: "primary.100",
                endIcon: <CheckIcon size="5" />,
              }}
              onValueChange={(itemValue) => setReportType(itemValue)}
            >
              <Select.Item label="Colisión" value="collision" />
              <Select.Item label="Asistencia vial" value="roadside" />
              <Select.Item label="Rotura de cristales" value="glass" />
              <Select.Item label="Robo" value="theft" />
              <Select.Item label="Otro" value="other" />
            </Select>
          </FormControl>

          <FormControl mb={4}>
            <FormControl.Label>Vehículo</FormControl.Label>
            <Select
              selectedValue={vehicle}
              minWidth="200"
              accessibilityLabel="Selecciona el vehículo"
              placeholder="Selecciona el vehículo"
              _selectedItem={{
                bg: "primary.100",
                endIcon: <CheckIcon size="5" />,
              }}
              onValueChange={(itemValue) => setVehicle(itemValue)}
            >
              <Select.Item label="Toyota Corolla (ABC-123)" value="vehicle1" />
              <Select.Item label="Honda Civic (XYZ-789)" value="vehicle2" />
              <Select.Item label="Otro vehículo" value="other" />
            </Select>
          </FormControl>

          <FormControl mb={4}>
            <FormControl.Label>Ubicación</FormControl.Label>
            <Input placeholder="Ingresa la ubicación del incidente" value={location} onChangeText={setLocation} />
          </FormControl>

          <FormControl mb={4}>
            <FormControl.Label>Descripción</FormControl.Label>
            <TextArea h={20} placeholder="Describe lo que ocurrió" value={description} onChangeText={setDescription} />
          </FormControl>

          <FormControl mb={4}>
            <FormControl.Label>¿Necesitas asistencia inmediata?</FormControl.Label>
            <Radio.Group name="needsAssistance" value={needsAssistance} onChange={(value) => setNeedsAssistance(value)}>
              <HStack space={4}>
                <Radio value="yes" my={1}>
                  Sí
                </Radio>
                <Radio value="no" my={1}>
                  No
                </Radio>
              </HStack>
            </Radio.Group>
          </FormControl>

          <Button colorScheme="primary" onPress={handleSubmit} mt={2}>
            Enviar Reporte
          </Button>
        </Box>
      </VStack>
    </ScrollView>
  )
}

export default CreateReportScreen


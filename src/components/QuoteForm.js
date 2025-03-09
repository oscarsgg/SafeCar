import React, { useState, useEffect } from "react";
import { VStack, Box, Button, Text, Input, HStack, Pressable, Icon, Modal, useToast } from "native-base";
import { Car, Shield, ShieldCheck, ShieldPlus } from "lucide-react-native";
import CreditCardForm from './CreditCardForm';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

const QuoteForm = ({ userData }) => {
  const [VIN, setVin] = useState("");
  const [plates, setPlates] = useState(""); // Placas como estado
  const [loading, setLoading] = useState(false);
  const [carData, setCarData] = useState(null);
  const [planes, setPlanes] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const toast = useToast();

  // Obtener planes de seguro
  useEffect(() => {
    const fetchPlanes = async () => {
      try {
        const planesSnapshot = await getDocs(collection(db, "polizas"));
        const planesData = [];

        const iconMap = {
          basico: Shield,
          respCivil: ShieldCheck,
          amplio: ShieldPlus
        };

        planesSnapshot.forEach((doc) => {
          planesData.push({
            id: doc.id,
            icon: iconMap[doc.id],
            ...doc.data()
          });
        });

        setPlanes(planesData);
      } catch (error) {
        console.error("Error al obtener planes:", error);
        toast.show({
          description: "No se pudieron cargar los planes disponibles",
          status: "error"
        });
      }
    };
    fetchPlanes();
  }, []);

  const fetchCarDataByVIN = async () => {
    if (!VIN || VIN.length !== 17) {
      toast.show({
        description: "Por favor ingresa un VIN válido de 17 caracteres",
        status: "warning"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${VIN}?format=json`
      );
      const data = await response.json();
      const carInfo = data.Results[0];

      if (!carInfo.ModelYear || !carInfo.Make || !carInfo.Model) {
        toast.show({
          description: "No se encontraron datos válidos para este VIN",
          status: "error"
        });
        setLoading(false);
        return;
      }

      setCarData({
        modelYear: carInfo.ModelYear,
        marca: carInfo.Make,
        modelo: carInfo.Model,
        trim: carInfo.Trim || "",
        transmissionStyle: carInfo.TransmissionStyle || "",
        placas: plates // Aquí añadimos las placas al carData
      });
    } catch (error) {
      toast.show({
        description: "Error al obtener datos del vehículo",
        status: "error"
      });
    }
    setLoading(false);
  };

  // Validar placas con entre 6 y 7 caracteres alfanuméricos (sin guiones ni espacios)
  const validatePlates = (plates) => {
    // Expresión regular para placas internacionales (6-7 caracteres alfanuméricos)
    const regex = /^[A-Z0-9]{6,7}$/;
    return regex.test(plates);
  };

  const handleSubmit = () => {
    if (!validatePlates(plates)) {
      toast.show({
        description: "Por favor ingresa un formato de placas válido (Ej: ABC1234...)",
        status: "warning"
      });
      return;
    }
    if (!VIN || VIN.length !== 17) {
      toast.show({
        description: "Por favor ingresa un VIN válido de 17 caracteres",
        status: "warning"
      });
      return;
    }
    setShowPaymentModal(true);
  };

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
              backgroundColor: "white"
            }}
          />

          {/* Campo Placas */}
          <Input
            value={plates}
            onChangeText={(text) => setPlates(text.toUpperCase())}
            placeholder="Ej: ABC-1234 o ABC 1234"
            size="xl"
            fontSize="md"
            borderWidth={2}
            _focus={{
              borderColor: "primary.500",
              backgroundColor: "white"
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
            <Text fontSize="xl" fontWeight="bold" color="gray.800">
              Datos del Vehículo
            </Text>

            <VStack space={3} bg="gray.50" p={4} rounded="xl">
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="md" color="gray.500">Año</Text>
                <Text fontSize="md" fontWeight="semibold">{carData.modelYear}</Text>
              </HStack>
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="md" color="gray.500">Marca</Text>
                <Text fontSize="md" fontWeight="semibold">{carData.marca}</Text>
              </HStack>
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="md" color="gray.500">Modelo</Text>
                <Text fontSize="md" fontWeight="semibold">{carData.modelo}</Text>
              </HStack>
              {carData.trim && (
                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="md" color="gray.500">Submodelo</Text>
                  <Text fontSize="md" fontWeight="semibold">{carData.trim}</Text>
                </HStack>
              )}
              {carData.transmissionStyle && (
                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="md" color="gray.500">Transmisión</Text>
                  <Text fontSize="md" fontWeight="semibold">{carData.transmissionStyle}</Text>
                </HStack>
              )}
              {carData.placas && (
                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="md" color="gray.500">Placas</Text>
                  <Text fontSize="md" fontWeight="semibold">{carData.placas}</Text>
                </HStack>
              )}
            </VStack>
          </VStack>
        </Box>
      )}

      {/* Planes de seguro */}
      {carData && planes.length > 0 && (
        <VStack space={4}>
          <Text fontSize="xl" fontWeight="bold" color="gray.800">
            Planes Disponibles
          </Text>

          {planes.map((plan) => (
            <Pressable
              key={plan.id}
              onPress={() => setSelectedPlan(plan)}
            >
              <Box
                bg="white"
                p={6}
                rounded="2xl"
                shadow={3}
                borderWidth={2}
                borderColor={selectedPlan?.id === plan.id ? "primary.500" : "transparent"}
              >
                <HStack space={4} alignItems="center" mb={4}>
                  <Box
                    bg={selectedPlan?.id === plan.id ? "primary.500" : "gray.100"}
                    p={3}
                    rounded="xl"
                  >
                    <Icon
                      as={plan.icon}
                      size="lg"
                      color={selectedPlan?.id === plan.id ? "white" : "gray.500"}
                    />
                  </Box>
                  <VStack>
                    <Text fontSize="lg" fontWeight="bold" color="gray.800">
                      {plan.nombre}
                    </Text>
                    <HStack alignItems="baseline" space={1}>
                      <Text fontSize="2xl" fontWeight="bold" color="primary.500">
                        ${plan.costo_base}
                      </Text>
                      <Text fontSize="sm" color="gray.500">/anual</Text>
                    </HStack>
                  </VStack>
                </HStack>

                <Text color="gray.600" fontSize="md">
                  {plan.descripcion}
                </Text>
              </Box>
            </Pressable>
          ))}
        </VStack>
      )}

      {selectedPlan && (
        <Button
          size="lg"
          bg="primary.500"
          _pressed={{ bg: "primary.600" }}
          onPress={handleSubmit}
          mt={4}
        >
          <Text color="white" fontSize="md" fontWeight="bold">
            Pagar ${selectedPlan.costo_base} MXN
          </Text>
        </Button>
      )}

      {/* Modal de pago */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        size="lg"
      >
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Pago con Tarjeta</Modal.Header>
          <Modal.Body>
            <CreditCardForm
              amount={selectedPlan?.costo_base}
              onSuccess={() => setShowPaymentModal(false)}
              onClose={() => setShowPaymentModal(false)}
              userData={userData}
              carData={{ ...carData, vin: VIN }}
              selectedPlan={selectedPlan}
            />
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </VStack>
  );
};

export default QuoteForm;
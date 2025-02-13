import React, { useState, useEffect } from "react";
import { VStack, Select, Button, Text, Input } from "native-base";
import { Alert } from "react-native";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../db/firebase";

const AddCar = () => {
  const [VIN, setVin] = useState("");
  const [trim, setTrim] = useState("");
  const [transmissionStyle, setTransmissionStyle] = useState("");
  const [modelYear, setModelYear] = useState("");
  const [model, setModel] = useState("");
  const [marca, setMarca] = useState("");

  const [anios, setAnios] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [selectedAnio, setSelectedAnio] = useState("");
  const [selectedMarca, setSelectedMarca] = useState("");
  const [selectedModelo, setSelectedModelo] = useState("");
  const [selectedTransmision, setSelectedTransmision] = useState("");

  // Estado para controlar si ya se obtuvieron datos por VIN
  const [datosObtenidos, setDatosObtenidos] = useState(false);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1979 }, (_, i) =>
      (currentYear - i).toString()
    );
    setAnios(years);
  }, []);

  useEffect(() => {
    if (selectedAnio) {
      fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json`)
        .then((response) => response.json())
        .then((data) => setMarcas(data.Results.map((item) => item.MakeName)))
        .catch(() => Alert.alert("Error", "No se pudo obtener las marcas"));
      setSelectedMarca("");
      setModelos([]);
      setSelectedModelo("");
    }
  }, [selectedAnio]);

  useEffect(() => {
    if (selectedMarca) {
      fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${selectedMarca}?format=json`)
        .then((response) => response.json())
        .then((data) => setModelos(data.Results.map((item) => item.Model_Name)))
        .catch(() => Alert.alert("Error", "No se pudo obtener los modelos"));
      setSelectedModelo("");
    }
  }, [selectedMarca]);

  const fetchCarDataByVIN = async () => {
    if (!VIN) {
      Alert.alert("Error", "Por favor ingresa un VIN válido");
      return;
    }
  
    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${VIN}?format=json`);
      const data = await response.json();
      const carData = data.Results[0];
  
      setModelYear(carData.ModelYear || "");
      setMarca(carData.Make || "");
      setModel(carData.Model || "");
      setTrim(carData.Trim || "");
      setTransmissionStyle(carData.TransmissionStyle || "");
  
      setDatosObtenidos(true); // Activa el estado de datos obtenidos
    } catch {
      Alert.alert("Error", "No se pudo obtener datos del VIN");
    }
  };
  
  // Nueva función para enviar datos obtenidos por VIN
  const handleSubmitVIN = async () => {
    if (!modelYear || !marca || !model) {
      Alert.alert("Error", "No hay datos suficientes del VIN");
      return;
    }
  
    try {
      await addDoc(collection(db, "carros"), {
        vin: VIN || "",
        anio: modelYear,
        marca: marca,
        modelo: model,
        trim: trim || "",
        transmissionStyle: transmissionStyle || "",
        usuario: "",
      });
  
      Alert.alert("Éxito", "Auto agregado exitosamente por VIN");
  
      // Resetear solo los datos del VIN
      setVin("");
      setModelYear("");
      setMarca("");
      setModel("");
      setTrim("");
      setTransmissionStyle("");
      setDatosObtenidos(false);
    } catch (error) {
      console.error("Error al agregar auto:", error);
      Alert.alert("Error", "No se pudo agregar el auto por VIN");
    }
  };
  
  // Ejecutar envío después de obtener datos del VIN
  useEffect(() => {
    if (datosObtenidos) {
      handleSubmitVIN();
    }
  }, [datosObtenidos]);
  
  const handleSubmit = async () => {
    if (!selectedAnio || !selectedMarca || !selectedModelo || !selectedTransmision) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }
  
    try {
      await addDoc(collection(db, "carros"), {
        vin: "",
        anio: selectedAnio,
        marca: selectedMarca,
        modelo: selectedModelo,
        trim: "",
        transmissionStyle: selectedTransmision,
        usuario: "",
      });
  
      Alert.alert("Éxito", "Auto agregado exitosamente");
  
      // Resetear solo los datos del formulario manual
      setSelectedAnio("");
      setSelectedMarca("");
      setSelectedModelo("");
      setSelectedTransmision("");
    } catch (error) {
      console.error("Error al agregar auto:", error);
      Alert.alert("Error", "No se pudo agregar el auto");
    }
  };  

  return (
    <VStack space={4} alignItems="center" padding={4}>
      <Input
        value={VIN}
        onChangeText={setVin}
        placeholder="Ingresa el VIN"
        width="80%"
      />
      <Button width="80%" bg="blue.500" onPress={fetchCarDataByVIN}>
        <Text color="white" bold>Obtener Datos por VIN</Text>
      </Button>

      <Select selectedValue={selectedAnio} onValueChange={setSelectedAnio} placeholder="Selecciona un Año" width="80%">
        {anios.map((anio) => (
          <Select.Item key={`anio-${anio}`} label={anio} value={anio} />
        ))}
      </Select>

      <Select selectedValue={selectedMarca} onValueChange={setSelectedMarca} placeholder="Selecciona una Marca" width="80%">
        {marcas.map((marca) => (
          <Select.Item key={`marca-${marca}`} label={marca} value={marca} />
        ))}
      </Select>

      <Select selectedValue={selectedModelo} onValueChange={setSelectedModelo} placeholder="Selecciona un Modelo" width="80%">
        {modelos.map((modelo) => (
          <Select.Item key={`modelo-${modelo}`} label={modelo} value={modelo} />
        ))}
      </Select>

      <Select selectedValue={selectedTransmision} onValueChange={setSelectedTransmision} placeholder="Selecciona una Transmisión" width="80%">
        <Select.Item label="Automática" value="Automática" />
        <Select.Item label="Estándar" value="Estándar" />
      </Select>

      <Button width="80%" bg="primary.500" onPress={handleSubmit}>
        <Text color="white" bold>Agregar Auto</Text>
      </Button>
    </VStack>
  );
};

export default AddCar;
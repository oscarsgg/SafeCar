import React, { useState, useEffect } from "react";
import { VStack, Select, Button, Text, Input } from "native-base";
import { Alert } from "react-native";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../db/firebase";

const AddCar = () => {
  const [vin, setVin] = useState("");
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

  // Estado para evitar que el Alert no se muestre
  const [alertaMostrada, setAlertaMostrada] = useState(false);

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
    if (!vin) {
      Alert.alert("Error", "Por favor ingresa un VIN válido");
      return;
    }

    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`);
      const data = await response.json();
      const carData = data.Results[0];

      setModelYear(carData.ModelYear || "");
      setMarca(carData.Make || "");
      setModel(carData.Model || "");
      setTrim(carData.Trim || "");
      setTransmissionStyle(carData.TransmissionStyle || "");

      // Solo actualiza los selects si no han sido seleccionados antes manualmente
      if (!selectedAnio) setSelectedAnio(carData.ModelYear || ""); 
      if (!selectedMarca) setSelectedMarca(carData.Make || "");
      if (!selectedModelo) setSelectedModelo(carData.Model || "");
      if (!selectedTransmision) setSelectedTransmision(carData.transmissionStyle || "");
    } catch {
      Alert.alert("Error", "No se pudo obtener datos del VIN");
    }
  };

  const handleSubmit = async () => {
    if (!selectedAnio || !selectedMarca || !selectedModelo || !selectedTransmision) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    try {
      await addDoc(collection(db, "carros"), {
        vin,
        anio: modelYear || selectedAnio,
        marca: marca || selectedMarca,
        modelo: model || selectedModelo,
        trim: trim || "",
        transmissionStyle: transmissionStyle || selectedTransmision,
        usuario: "",
      });

      // Asegura que el Alert se muestre correctamente
      if (!alertaMostrada) {
        setAlertaMostrada(true);
        setTimeout(() => {
          Alert.alert("Éxito", "Auto agregado exitosamente");
        }, 100);
      }

      // Reiniciar estados
      setVin("");
      setModelYear("");
      setMarca("");
      setModel("");
      setTrim("");
      setTransmissionStyle("");
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
        value={vin}
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

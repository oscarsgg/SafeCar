import React, { useState, useEffect } from "react";
import { VStack, Select, Button, Text } from "native-base";
import { Alert } from "react-native"; 

import { collection, addDoc } from "firebase/firestore";
import { db } from "../../db/firebase";

const AddCar = () => {
  const [selectedAnio, setSelectedAnio] = useState("");
  const [selectedMarca, setSelectedMarca] = useState("");
  const [selectedModelo, setSelectedModelo] = useState("");

  const [anios, setAnios] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);

  // Cargar lista de años desde 1980 hasta el actual
  useEffect(() => {
    const fetchAnios = () => {
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let i = currentYear; i >= 1980; i--) {
        years.push(i.toString());
      }
      setAnios(years);
    };
    fetchAnios();
  }, []);

  // Obtener marcas según el año seleccionado
  useEffect(() => {
    if (selectedAnio !== "") {
      setMarcas([]); // Limpiar marcas anteriores
      fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json`)
        .then((response) => response.json())
        .then((data) => {
          setMarcas(data.Results.map((item) => item.MakeName));
        })
        .catch((error) => alert("Error al obtener marcas", error));
    }
    setSelectedMarca("");
    setModelos([]);
    setSelectedModelo("");
  }, [selectedAnio]);

  // Obtener modelos según la marca seleccionada
  useEffect(() => {
    if (selectedMarca !== "") {
      setModelos([]); // Limpiar modelos anteriores
      fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${selectedMarca}?format=json`)
        .then((response) => response.json())
        .then((data) => {
          setModelos(data.Results.map((item) => item.Model_Name));
        })
        .catch((error) => alert("Error al obtener modelos", error));
    }
    setSelectedModelo("");
  }, [selectedMarca]);

  // Guardar datos en Firebase
  const handleSubmit = async () => {
    if (!selectedAnio || !selectedMarca || !selectedModelo) {
      Alert.alert("Error", "Por favor selecciona todos los campos");
      return;
    }

    try {
      await addDoc(collection(db, "carros"), {
        anio: selectedAnio,
        marca: selectedMarca,
        modelo: selectedModelo,
        usuario: "", // Dejar vacío por ahora
      });
      Alert.alert("Éxito", "Auto agregado exitosamente");
      setSelectedAnio("");
      setSelectedMarca("");
      setSelectedModelo("");
    } catch (error) {
      console.error("Error al agregar el auto:", error);
      Alert.alert("Error", "No se pudo agregar el auto");
    }
  };

  return (
    <VStack space={4} alignItems="center" padding={4}>
      <Select
        selectedValue={selectedAnio}
        onValueChange={setSelectedAnio}
        placeholder="Selecciona un año"
        width="80%"
      >
        {anios.map((anio) => (
          <Select.Item key={`anio-${anio}`} label={anio} value={anio} />
        ))}
      </Select>

      <Select
        selectedValue={selectedMarca}
        onValueChange={setSelectedMarca}
        placeholder="Selecciona una marca"
        width="80%"
      >
        {marcas.map((marca) => (
          <Select.Item key={`marca-${marca}`} label={marca} value={marca} />
        ))}
      </Select>

      <Select
        selectedValue={selectedModelo}
        onValueChange={setSelectedModelo}
        placeholder="Selecciona un modelo"
        width="80%"
      >
        {modelos.map((modelo) => (
          <Select.Item key={`modelo-${modelo}`} label={modelo} value={modelo} />
        ))}
      </Select>


      <Button width="80%" bg="primary.500" onPress={handleSubmit}>
        <Text color="white" bold>Agregar Auto</Text>
      </Button>
    </VStack>
  );
};

export default AddCar;

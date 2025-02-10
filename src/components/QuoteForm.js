import React from 'react';
import { VStack, Select, Button, Text } from 'native-base';

const QuoteForm = () => {
  return (
    <VStack space={4} alignItems="center">
      <Select placeholder="Selecciona una marca" width="80%">
        <Select.Item label="Toyota" value="toyota" />
        <Select.Item label="Honda" value="honda" />
        <Select.Item label="Ford" value="ford" />
      </Select>
      <Select placeholder="Selecciona un modelo" width="80%">
        <Select.Item label="Corolla" value="corolla" />
        <Select.Item label="Civic" value="civic" />
        <Select.Item label="Focus" value="focus" />
      </Select>
      <Select placeholder="Selecciona el año" width="80%">
        <Select.Item label="2023" value="2023" />
        <Select.Item label="2022" value="2022" />
        <Select.Item label="2021" value="2021" />
      </Select>
      <Button width="80%" bg="primary.500">
        <Text color="white" bold>Obtener Cotización</Text>
      </Button>
    </VStack>
  );
};

export default QuoteForm;
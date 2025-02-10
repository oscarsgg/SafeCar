import React from 'react';
import { Box, VStack, Text } from 'native-base';
import Header from '../components/Header';
import QuoteForm from '../components/QuoteForm';

const QuoteScreen = () => {
  return (
    <VStack>
      <Header />
      <Box p={4}>
        <Text fontSize="xl" fontWeight="bold" mb={4} mt={4}>
          Cotiza tu seguro en minutos
        </Text>
        <QuoteForm />
      </Box>
    </VStack>
  );
};

export default QuoteScreen;
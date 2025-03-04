import React from 'react';
import { TouchableOpacity } from 'react-native';
import { HStack, VStack, Box, Text, Icon, Heading, Progress } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ReportCard = ({ report, onPress }) => {
  const getReportIcon = (type) => {
    switch (type) {
      case 'tow':
        return 'tow-truck';
      case 'collision':
        return 'car-crash';
      case 'glass':
        return 'car-door';
      case 'theft':
        return 'shield-alert';
      default:
        return 'file-document-outline';
    }
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <Box 
        bg="white" 
        borderRadius="xl" 
        shadow={2}
        p={4}
        borderWidth={1}
        borderColor="blue.100"
      >
        <HStack space={3} alignItems="center">
          <Box 
            bg="blue.50" 
            p={3} 
            borderRadius="xl"
          >
            <Icon 
              as={MaterialCommunityIcons} 
              name={getReportIcon(report.type)} 
              size="lg" 
              color="#2196F3"
            />
          </Box>
          
          <VStack flex={1} space={2}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize="xs" color="gray.500">
                Reporte #{report.id}
              </Text>
              <Text fontSize="xs" color="blue.500" fontWeight="medium">
                En Progreso
              </Text>
            </HStack>
            
            <Text fontWeight="bold" color="gray.800">
              {report.title}
            </Text>
            
            <Progress 
              value={65} 
              size="xs"
              colorScheme="blue"
              bg="blue.100"
            />
            
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize="xs" color="gray.500">
                Actualizado hace 5 min
              </Text>
              <Text fontSize="xs" color="blue.500">
                Ver detalles →
              </Text>
            </HStack>
          </VStack>
        </HStack>
      </Box>
    </TouchableOpacity>
  );
};

export default ReportCard;

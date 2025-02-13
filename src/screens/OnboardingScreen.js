'use client';

import React, { useRef } from 'react';
import { Dimensions, Animated } from 'react-native';
import { Box, Text, Button, HStack, Pressable } from 'native-base';
import { useNavigation } from '@react-navigation/native';
import { Shield, Car, Clock } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: 1,
    title: "Protección Total",
    description: "Asegura tu vehículo con la mejor cobertura del mercado",
    icon: Shield,
    color: "blue.500"
  },
  {
    id: 2,
    title: "Cotización Instantánea",
    description: "Obtén tu cotización en segundos, sin complicaciones",
    icon: Car,
    color: "blue.600"
  },
  {
    id: 3,
    title: "Asistencia 24/7",
    description: "Estamos contigo cuando nos necesites, en cualquier momento",
    icon: Clock,
    color: "blue.700"
  }
];

const OnboardingScreen = () => {
  const navigation = useNavigation();
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleSkip = () => {
    navigation.navigate('Login');
  };

  const Slide = ({ item }) => {
    const Icon = item.icon;
    return (
      <Box width={width} height={height * 0.8} alignItems="center" justifyContent="center">
        <Box 
          bg={item.color} 
          p={8} 
          rounded="3xl" 
          mb={8}
        >
          <Icon size={100} color="white" />
        </Box>
        <Text fontSize="4xl" fontWeight="bold" mb={4} color={item.color}>
          {item.title}
        </Text>
        <Text 
          fontSize="md" 
          textAlign="center" 
          color="gray.600"
          px={10}
        >
          {item.description}
        </Text>
      </Box>
    );
  };

  return (
    <Box flex={1} bg="white">
      <Pressable 
        position="absolute" 
        top={12} 
        right={4} 
        zIndex={1}
        onPress={handleSkip}
      >
        <Text color="gray.500" fontSize="md">
          Saltar
        </Text>
      </Pressable>

      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
      >
        {slides.map((item) => (
          <Slide key={item.id} item={item} />
        ))}
      </Animated.ScrollView>

      <Box position="absolute" bottom={50} width="100%">
        <HStack space={2} justifyContent="center" mb={8}>
          {slides.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 16, 8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={{
                  height: 8,
                  width: dotWidth,
                  borderRadius: 4,
                  backgroundColor: '#2563eb',
                  opacity,
                  margin: 2,
                }}
              />
            );
          })}
        </HStack>
        <Button
          mx={10}
          size="lg"
          rounded="full"
          bg="blue.600"
          _pressed={{ bg: "blue.700" }}
          onPress={handleSkip}
        >
          Iniciar Sesión
        </Button>
      </Box>
    </Box>
  );
};

export default OnboardingScreen;
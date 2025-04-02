'use client';

import React, { useRef, useState } from 'react';
import { Dimensions, Animated, StyleSheet, View } from 'react-native';
import { Box, Text, Button, Image, Pressable } from 'native-base';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Car, Clock } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: 1,
    title: "Bienvenido a\nSafeCar",
    subtitle: "SEGURIDAD Y CONFIANZA",
    description: "Tu plataforma integral para proteger tu vehículo con los mejores seguros del mercado.",
    gradientColors: ['#1e40af', '#3b82f6'],
    image: require('../../img/logogod.png')
  },
  {
    id: 2,
    title: "Cotiza al\nInstante",
    subtitle: "PROCESO SIMPLE Y RÁPIDO",
    description: "Obtén una cotización personalizada en segundos. Sin complicaciones, sin esperas.",
    gradientColors: ['#4c1d95', '#6d28d9'],
    image: require('../../img/Car-insurance.png')
  },
  {
    id: 3,
    title: "Tu Viaje\nComienza Aquí",
    subtitle: "ASISTENCIA 24/7",
    description: "Protección completa para ti y tu vehículo, en cualquier momento y lugar.",
    gradientColors: ['#0f766e', '#0d9488'],
    image: require('../../img/green.jpg')
  }
];

const OnboardingScreen = () => {
  const navigation = useNavigation();
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: event => {
        const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentSlideIndex(slideIndex);
      },
    }
  );

  const Slide = ({ item }) => {
    return (
      <LinearGradient
        colors={item.gradientColors}
        style={styles.slideContainer}
      >
        <Box flex={1} px={6} justifyContent="center">
          <Box 
            bg="white" 
            rounded="3xl" 
            p={6}
            shadow={5}
            style={styles.card}
          >
            
            <Text fontSize="sm" color="gray.500" mb={2}>
              {item.subtitle}
            </Text>
            <Text fontSize="4xl" fontWeight="bold" color={item.gradientColors[1]} mb={4}>
              {item.title}
              
            </Text>
            <Text fontSize="md" color="gray.600" mb={6}>
              {item.description}
            </Text>
            <Image 
              source={item.image}
              alt="Insurance"
              size="2xl"
              resizeMode="contain"
              alignSelf="center"
            />
          </Box>
        </Box>
      </LinearGradient>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((item) => (
          <Slide key={item.id} item={item} />
        ))}
      </Animated.ScrollView>

      <Box position="absolute" bottom={10} width="100%" px={6}>
        <Box flexDirection="row" justifyContent="center" mb={6}>
          {slides.map((_, i) => (
            <Box
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === currentSlideIndex ? 'white' : 'rgba(255,255,255,0.5)' }
              ]}
            />
          ))}
        </Box>
        <Button
          size="lg"
          rounded="full"
          bg="white"
          _text={{ color: slides[currentSlideIndex].gradientColors[1] }}
          _pressed={{ bg: "gray.100" }}
          onPress={() => navigation.navigate('Login')}
          shadow={3}
        >
          Iniciar Sesión
        </Button>
      </Box>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slideContainer: {
    width,
    height,
  },
  card: {
    width: '100%',
    maxHeight: '100%',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});

export default OnboardingScreen;
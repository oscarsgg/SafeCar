import React from 'react';
import { ScrollView } from 'react-native';
import { VStack } from 'native-base';
import Header from '../components/Header';
import CarInsuranceCard from '../components/CarInsuranceCard';

const HomeScreen = () => {
  return (
    <ScrollView>
      <VStack space={4}>
        <Header />
        <CarInsuranceCard 
          title="Seguro Completo"
          description="Protección integral para tu vehículo contra todo tipo de riesgos."
          image={require('../../img/bannerIntegral.png')} // Imagen local
        />
        <CarInsuranceCard 
          title="Asistencia en Carretera"
          description="Ayuda 24/7 en cualquier lugar donde te encuentres."
          image="https://segurosypensionesparatodos.fundacionmapfre.org/media/blog/asistencia-carretera-1194x535-1.png" // URL remota
          //image="https://laopinion.com/wp-content/uploads/sites/3/2022/06/shutterstock_1751990603.jpg?resize=480,270&quality=80"
        />
        <CarInsuranceCard 
          title="Cobertura de Responsabilidad Civil"
          description="Protección financiera contra daños a terceros."
          image={require('../../img/banner.png')} // Imagen local
        />
      </VStack>
    </ScrollView>
  );
};

export default HomeScreen;
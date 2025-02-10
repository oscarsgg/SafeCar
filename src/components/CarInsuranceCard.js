import React from 'react';
import { Card, Title, Paragraph } from 'react-native-paper';
import { Box, Image } from 'native-base';

const CarInsuranceCard = ({ title, description, image }) => {
  // Función para determinar si la imagen es local o remota
  const getImageSource = (image) => {
    if (typeof image === 'number') {
      // Si es un número, asumimos que es un recurso local (require)
      return image;
    } else if (typeof image === 'string') {
      // Si es una cadena, asumimos que es una URL
      return { uri: image };
    }
    // Si no es ninguno de los anteriores, usamos una imagen por defecto
    return require('../../img/banner.png'); // Asegúrate de tener esta imagen en tu proyecto
  };

  return (
    <Card elevation={3} style={{ margin: 10, 
      backgroundColor: '#f7f7f7',
      //blue border
      borderColor: '#71a7c5',
      borderWidth: 2,
      borderRadius: 10,
     }}>
      <Card.Content>
        <Title>{title}</Title>
        <Paragraph>{description}</Paragraph>
      </Card.Content>
      <Box alignItems="center" mt={0}>
        <Image 
          source={getImageSource(image)}
          alt={title}
          width={300}
          height={180}
          resizeMode="cover"
          margin={5}
        />
      </Box>
    </Card>
  );
};

export default CarInsuranceCard;
import React from 'react';
import { Box, Image, Text } from 'native-base';
import { LinearGradient } from 'expo-linear-gradient';

const Header = () => {
  return (
    <LinearGradient
      colors={['#19dce6', '#007bff', '#4169e1']}
      start={[0, 0]}
      end={[1, 1]}
      style={{
        padding: 16,
        alignItems: 'center',
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        // borderTopLeftRadius: 15,
        // borderTopRightRadius: 15,
      }}
    >
      <Image 
        source={require('../../img/logogod.png')}
        alt="Logo"
        size="md"
        //sm, md, lg, xl ... 2xl
        style={{
          resizeMode: 'contain',
          }}
        mb={2}

      />
      <Text color="white" fontSize="2xl" fontWeight="bold">
        DiddyDrive
      </Text>
      <Text color="white" fontSize="sm">
        Protección profesional para tu vehículo
      </Text>
    </LinearGradient>
  );
};

export default Header;
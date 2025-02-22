import {React, useState, useEffect} from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../db/firebase';

const getUserDocId = async (email) => {
    try {
      const logRef = collection(db, 'log');
      const docsId = query(logRef, where('email', '==', email)); 
      //el query para buscar el id del docs en base al correo
      const querySnapshot = await getDocs(docsId);
  
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id; // 0 porqe es el primero y unico(deberia)
      } else {
        console.log('No se encontró el usuario en log/');
        return null;
      }
    } catch (error) {
      console.error('Error obteniendo ID del usuario:', error);
      return null;
    }
  };
  
const getCarCount = async (email) => {
    try {
        const userId = await getUserDocId(email);

        //console.log(`Buscando autos en log/${userId}/carrosUser`);
        const carrosRef = collection(db, `log/${userId}/carrosUser`);
        const querySnapshot = await getDocs(carrosRef);

        return querySnapshot.size;
    } catch (error) {
        console.error('Error obteniendo conteo de carros:', error);
        return 0;
    }
};

const formatPhoneNumber = (phoneNumber) => {
// Eliminar todos los caracteres que no son números
const cleaned = ('' + phoneNumber).replace(/\D/g, '');

// Formatear el número en el formato (xxx) xxx xxxx
const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);

    if (match) {
        return `(${match[1]}) ${match[2]} ${match[3]}`;
    }

    return phoneNumber; 
};

export { getUserDocId, getCarCount, formatPhoneNumber };
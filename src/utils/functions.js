import {React, useState, useEffect} from 'react';
import { doc, updateDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { signOut } from "firebase/auth";
import { db, auth } from '../../db/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveUserData = async (userData) => {
  try {
    await AsyncStorage.setItem('@user_data', JSON.stringify(userData));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

export const removeUserData = async () => {
  try {
    await AsyncStorage.removeItem('@user_data');
  } catch (error) {
    console.error('Error removing user data:', error);
  }
};

export const getUserData = async () => {
  try {
    const data = await AsyncStorage.getItem('@user_data');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return null;
  }
};

// Guardar cambios en Firebase
export const updateUserData = async (email, newData) => {
  try {
    const userId = await getUserDocId(email); // Buscar el ID del usuario basado en el email
    if (!userId) {
      console.error("No se encontró el usuario en Firebase.");
      return;
    }

    const userRef = doc(db, "log", userId); // Usamos el ID real del documento
    await updateDoc(userRef, newData);
    console.log("Usuario actualizado en Firebase");
  } catch (error) {
    console.error("Error al actualizar datos:", error);
  }
};

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

const getPolizaCount = async (email) => {
    try {
        const userId = await getUserDocId(email);

        //console.log(`Buscando autos en log/${userId}/carrosUser`);
        const polizaRef = collection(db, `log/${userId}/polizaUser`);
        const querySnapshot = await getDocs(polizaRef);

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

const handleLogout = async (setUser) => {
    try {
      await signOut(auth);
      setUser(null);
      //navigation.replace("Login");
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    }
};

const getUserCars = async (email) => {
  try {
      const userId = await getUserDocId(email);
      if (!userId) {
          console.error("No se encontró el ID del usuario.");
          return [];
      }

      const carrosRef = collection(db, `log/${userId}/carrosUser`);
      const querySnapshot = await getDocs(carrosRef);

      const cars = querySnapshot.docs.map(doc => ({
          id: doc.id,
          año: doc.data().año,
          fechaRegistro: doc.data().fechaRegistro,
          marca: doc.data().marca,
          modelo: doc.data().modelo,
          placas: doc.data().placas,
          transmision: doc.data().transmision,
          trim: doc.data().trim,
          vin: doc.data().vin
      }));

      return cars;
  } catch (error) {
      console.error('Error obteniendo los carros del usuario:', error);
      return [];
  }
};

export const saveReport = async (email, textReporte) => {
  try {
    const reportRef = collection(db, "Reportes");

    await addDoc(reportRef, {
      report: textReporte,
      usuario: email,
      fecha: new Date(), // Agrega la fecha y hora del reporte
    });

    console.log("Reporte guardado correctamente.");
  } catch (error) {
    console.error("Error guardando el reporte:", error);
  }
};

export { getUserDocId, getCarCount, formatPhoneNumber, handleLogout, getPolizaCount, getUserCars };
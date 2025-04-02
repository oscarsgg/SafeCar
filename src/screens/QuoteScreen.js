"use client"

import React, { useEffect, useState } from "react"
import { SafeAreaView } from "react-native"
import { Box, VStack, ScrollView } from "native-base"
import Header from "../components/Header"
import QuoteForm from "../components/QuoteForm"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useNavigation } from "@react-navigation/native"

const QuoteScreen = () => {
  const [userData, setUserData] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const navigation = useNavigation() // Añadimos el hook de navegación

  const onClose = () => setIsOpen(false)

  const cancelRef = React.useRef(null)

  useEffect(() => {
    getUserData()
  }, [])

  const getUserData = async () => {
    try {
      const data = await AsyncStorage.getItem("@user_data")
      if (data) {
        setUserData(JSON.parse(data))
      }
    } catch (error) {
      console.error("Error retrieving user data:", error)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <VStack flex={1}>
        <ScrollView>
          <Header />
          <Box p={4}>
            {/* Pasamos la navegación al QuoteForm */}
            <QuoteForm userData={userData} navigation={navigation} />
          </Box>
        </ScrollView>
      </VStack>
    </SafeAreaView>
  )
}

export default QuoteScreen
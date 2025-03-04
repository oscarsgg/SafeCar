"use client"

import { useState } from "react"
import { ScrollView, TouchableOpacity } from "react-native"
import { VStack, Box, Text, Heading, HStack, Icon, Divider, Badge } from "native-base"
import { MaterialCommunityIcons } from "@expo/vector-icons"

const TrackReportsScreen = ({ navigation }) => {
  // Sample reports data
  const [reports, setReports] = useState([
    {
      id: "042133248841",
      title: "Grúa en camino para entregar tu vehículo",
      description: "Grúa en camino para entregar",
      status: "en progreso",
      type: "tow",
      date: "15/03/2023",
      vehicle: "Toyota Corolla (ABC-123)",
    },
    {
      id: "042133245678",
      title: "Reparación de parabrisas",
      description: "Programada para el 20/03/2023",
      status: "programado",
      type: "glass",
      date: "10/03/2023",
      vehicle: "Honda Civic (XYZ-789)",
    },
    {
      id: "042133241234",
      title: "Reporte de colisión",
      description: "Completado",
      status: "completado",
      type: "collision",
      date: "01/03/2023",
      vehicle: "Toyota Corolla (ABC-123)",
    },
  ])

  const getStatusColor = (status) => {
    switch (status) {
      case "en progreso":
        return "info"
      case "programado":
        return "warning"
      case "completado":
        return "success"
      default:
        return "gray"
    }
  }

  const getReportIcon = (type) => {
    switch (type) {
      case "tow":
        return "tow-truck"
      case "collision":
        return "car-emergency"
      case "glass":
        return "car-door"
      case "theft":
        return "shield-alert"
      default:
        return "file-document-outline"
    }
  }

  const handleReportPress = (report) => {
    // Navigate to report details
    console.log(`View details for report ${report.id}`)
    // navigation.navigate('ReportDetails', { reportId: report.id });
  }

  return (
    <ScrollView>
      <VStack space={4} p={4}>

        <Box bg="white" p={4} borderRadius="lg" shadow={2}>
          <Heading size="md" mb={4}>
            Seguimiento de Reportes
          </Heading>

          {reports.length > 0 ? (
            <VStack space={3} divider={<Divider />}>
              {reports.map((report) => (
                <TouchableOpacity key={report.id} onPress={() => handleReportPress(report)}>
                  <HStack space={3} alignItems="center">
                    <Box bg="#f0e6f5" p={2} borderRadius="full">
                      <Icon as={MaterialCommunityIcons} name={getReportIcon(report.type)} size="md" color="#9c27b0" />
                    </Box>

                    <VStack flex={1}>
                      <HStack justifyContent="space-between" alignItems="center">
                        <Text fontWeight="bold">Reporte {report.id}</Text>
                        <Badge colorScheme={getStatusColor(report.status)} variant="subtle">
                          {report.status}
                        </Badge>
                      </HStack>

                      <Text fontWeight="medium">{report.title}</Text>

                      <Text fontSize="xs" color="gray.500">
                        {report.vehicle} • {report.date}
                      </Text>
                    </VStack>
                  </HStack>
                </TouchableOpacity>
              ))}
            </VStack>
          ) : (
            <Box p={4} alignItems="center">
              <Icon as={MaterialCommunityIcons} name="file-document-outline" size="4xl" color="gray.300" mb={2} />
              <Text color="gray.500" textAlign="center">
                No tienes reportes activos en este momento
              </Text>
            </Box>
          )}
        </Box>
      </VStack>
    </ScrollView>
  )
}

export default TrackReportsScreen
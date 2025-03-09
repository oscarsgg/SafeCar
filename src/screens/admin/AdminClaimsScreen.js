import React, { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Heading, 
  Icon, 
  Pressable,
  Input,
  Button,
  useColorModeValue,
  Divider,
  Badge,
  Spinner,
  FlatList,
  Select,
  Modal,
  Image,
  FormControl,
  useToast,
  TextArea
} from 'native-base';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/Header';
import { collection, getDocs, query, orderBy, doc, updateDoc, getDoc, where } from 'firebase/firestore';
import { db } from '../../../db/firebase';

// Mapeo de estados de reclamos
const CLAIM_STATUSES = {
  'Pendiente': {
    value: 'Pendiente',
    color: 'yellow',
    next: 'En Revisión'
  },
  'En Revisión': {
    value: 'En Revisión',
    color: 'blue',
    next: ['Aprobado', 'Rechazado']
  },
  'Aprobado': {
    value: 'Aprobado',
    color: 'green',
    next: 'Completado'
  },
  'Rechazado': {
    value: 'Rechazado',
    color: 'red',
    next: null
  },
  'Completado': {
    value: 'Completado',
    color: 'green',
    next: null
  }
};

// Lista de evaluadores disponibles
const EVALUADORES = [
  { id: 'agente_123', nombre: 'Carlos Gómez' },
  { id: 'agente_456', nombre: 'Laura Sánchez' },
  { id: 'agente_567', nombre: 'Miguel Rodríguez' },
  { id: 'agente_789', nombre: 'Ana Martínez' }
];

// Meses para el selector
const MESES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' }
];

const AdminClaimsScreen = () => {
  const [claims, setClaims] = useState([]);
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [resolutionData, setResolutionData] = useState({
    evaluadorAsignado: '',
    montoCompensacion: '',
    fechaResolucion: {
      dia: new Date().getDate().toString(),
      mes: (new Date().getMonth() + 1).toString(),
      anio: new Date().getFullYear().toString()
    },
    comentarios: ''
  });

  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBgColor = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    getUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      fetchAllClaims();
    }
  }, [userData]);

  useEffect(() => {
    let filtered = claims;
    
    // Filtrar por texto de búsqueda
    if (searchText) {
      filtered = filtered.filter(claim => 
        claim.userName?.toLowerCase().includes(searchText.toLowerCase()) ||
        claim.descripcion?.toLowerCase().includes(searchText.toLowerCase()) ||
        claim.vehiculoInfo?.marca?.toLowerCase().includes(searchText.toLowerCase()) ||
        claim.vehiculoInfo?.modelo?.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // Filtrar por estado
    if (statusFilter) {
      filtered = filtered.filter(claim => claim.estadoReclamo === statusFilter);
    }
    
    setFilteredClaims(filtered);
  }, [searchText, statusFilter, claims]);

  const getUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('@user_data');
      if (data) {
        setUserData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error retrieving user data:', error);
    }
  };

  const fetchAllClaims = async () => {
    try {
      setLoading(true);
      
      // Obtener todos los reclamos de todos los usuarios
      const usersRef = collection(db, "log");
      const usersSnapshot = await getDocs(usersRef);
      
      let allClaims = [];
      
      // Para cada usuario, obtener sus reclamos
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        
        // Obtener los reclamos del usuario
        const claimsRef = collection(db, "log", userId, "reclamosUser");
        const claimsSnapshot = await getDocs(claimsRef);
        
        // Procesar cada reclamo
        for (const claimDoc of claimsSnapshot.docs) {
          const claimData = claimDoc.data();
          
          // Obtener información del vehículo si existe
          let vehicleInfo = null;
          if (claimData.vehiculoId) {
            try {
              const vehicleRef = doc(db, "log", userId, "carrosUser", claimData.vehiculoId);
              const vehicleSnap = await getDoc(vehicleRef);
              if (vehicleSnap.exists()) {
                vehicleInfo = vehicleSnap.data();
              }
            } catch (error) {
              console.error('Error fetching vehicle info:', error);
            }
          }
          
          // Crear objeto de reclamo con toda la información necesaria
          const claim = {
            id: claimDoc.id,
            userId: userId,
            userName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            userEmail: userData.email,
            ...claimData,
            vehiculoInfo: vehicleInfo || claimData.vehiculoInfo,
            estadoReclamo: claimData.estadoReclamo || 'Pendiente'
          };
          
          allClaims.push(claim);
        }
      }
      
      // Ordenar por fecha de creación (más recientes primero)
      allClaims.sort((a, b) => {
        const dateA = a.fechaCreacion?.toDate ? a.fechaCreacion.toDate() : new Date(a.fechaCreacion || 0);
        const dateB = b.fechaCreacion?.toDate ? b.fechaCreacion.toDate() : new Date(b.fechaCreacion || 0);
        return dateB - dateA;
      });
      
      setClaims(allClaims);
      setFilteredClaims(allClaims);
    } catch (error) {
      console.error("Error fetching claims:", error);
      toast.show({
        description: "Error al obtener reclamos",
        status: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusInfo = CLAIM_STATUSES[status] || { color: 'gray' };
    return <Badge colorScheme={statusInfo.color}>{status}</Badge>;
  };

  const validateDate = () => {
    const { dia, mes, anio } = resolutionData.fechaResolucion;
    
    // Convertir a números
    const day = parseInt(dia, 10);
    const month = parseInt(mes, 10);
    const year = parseInt(anio, 10);
    
    // Validaciones básicas
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      return false;
    }
    
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2023 || year > 2100) {
      return false;
    }
    
    // Validar días según el mes
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) {
      return false;
    }
    
    return true;
  };

  const updateClaimStatus = async (claim, newStatus) => {
    try {
      // Si estamos aprobando y no hemos completado el formulario de resolución
      if (newStatus === 'Aprobado' && !showResolutionForm) {
        setShowResolutionForm(true);
        return;
      }
      
      // Si estamos en el formulario de resolución, validamos
      if (showResolutionForm && newStatus === 'Aprobado') {
        if (!resolutionData.evaluadorAsignado) {
          toast.show({
            description: "Debes asignar un evaluador",
            status: "warning"
          });
          return;
        }
        
        if (!resolutionData.montoCompensacion) {
          toast.show({
            description: "Debes ingresar un monto de compensación",
            status: "warning"
          });
          return;
        }
        
        if (!validateDate()) {
          toast.show({
            description: "La fecha de resolución no es válida",
            status: "warning"
          });
          return;
        }
      }
      
      // Actualizar en Firestore
      const claimRef = doc(db, "log", claim.userId, "reclamosUser", claim.id);
      
      const updateData = {
        estadoReclamo: newStatus
      };
      
      // Si estamos aprobando, añadimos los datos de resolución
      if (newStatus === 'Aprobado') {
        // Crear fecha de resolución
        const { dia, mes, anio } = resolutionData.fechaResolucion;
        const fechaResolucion = new Date(
          parseInt(anio, 10),
          parseInt(mes, 10) - 1, // Meses en JS son 0-11
          parseInt(dia, 10)
        );
        
        updateData.evaluadorAsignado = resolutionData.evaluadorAsignado;
        updateData.montoCompensacion = parseFloat(resolutionData.montoCompensacion);
        updateData.fechaResolucion = fechaResolucion;
        updateData.comentarios = resolutionData.comentarios;
      }
      
      await updateDoc(claimRef, updateData);
      
      // Actualizar estado local
      const updatedClaims = claims.map(c => 
        c.id === claim.id && c.userId === claim.userId 
          ? { ...c, estadoReclamo: newStatus, ...updateData } 
          : c
      );
      
      setClaims(updatedClaims);
      
      toast.show({
        description: `Reclamo ${newStatus.toLowerCase()} exitosamente`,
        status: "success"
      });
      
      // Cerrar modal y resetear formulario
      setShowResolutionForm(false);
      setResolutionData({
        evaluadorAsignado: '',
        montoCompensacion: '',
        fechaResolucion: {
          dia: new Date().getDate().toString(),
          mes: (new Date().getMonth() + 1).toString(),
          anio: new Date().getFullYear().toString()
        },
        comentarios: ''
      });
      setSelectedClaim(null);
      setShowModal(false);
    } catch (error) {
      console.error("Error updating claim status:", error);
      toast.show({
        description: "Error al actualizar el estado del reclamo",
        status: "error"
      });
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Fecha no disponible";
    
    const date = timestamp.toDate ? 
                timestamp.toDate() : 
                new Date(timestamp);
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderClaimItem = ({ item }) => (
    <Pressable onPress={() => {
      setSelectedClaim(item);
      setShowModal(true);
      setShowResolutionForm(false);
    }}>
      {({ isPressed }) => (
        <Box
          bg={cardBgColor}
          p={4}
          rounded="xl"
          shadow={2}
          mb={3}
          style={{
            transform: [{ scale: isPressed ? 0.98 : 1 }]
          }}
        >
          <VStack space={2}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize="md" fontWeight="bold" color={textColor}>
                {item.userName || 'Usuario desconocido'}
              </Text>
              {getStatusBadge(item.estadoReclamo)}
            </HStack>
            
            <Text fontSize="sm" color={secondaryTextColor}>
              Vehículo: {item.vehiculoInfo ? `${item.vehiculoInfo.marca} ${item.vehiculoInfo.modelo}` : 'No especificado'}
            </Text>
            
            <Text fontSize="sm" color={secondaryTextColor}>
              Fecha: {formatDate(item.fechaCreacion)}
            </Text>
            
            <Divider my={2} />
            
            <Text fontSize="sm" numberOfLines={2} color={textColor}>
              {item.descripcion || 'Sin descripción'}
            </Text>
          </VStack>
        </Box>
      )}
    </Pressable>
  );

  return (
    <Box flex={1} bg={bgColor}>
      {/* Aquí se coloca el Header fuera del Box con padding */}
      <Header />
  
      {/* Contenedor principal donde se va a mostrar la lista */}
      <Box flex={1} p={6}>
        <VStack space={4}>
          <Heading size="lg" color={textColor}>Gestión de Reclamos</Heading>
  
          <HStack space={2}>
            <Input
              placeholder="Buscar reclamo..."
              value={searchText}
              onChangeText={setSearchText}
              flex={1}
              borderRadius="full"
              py={2}
              px={3}
              InputLeftElement={
                <Icon as={Ionicons} name="search" size={5} ml={2} color="gray.400" />
              }
            />
  
            <Select
              selectedValue={statusFilter}
              minWidth={120}
              accessibilityLabel="Filtrar por estado"
              placeholder="Estado"
              onValueChange={value => setStatusFilter(value)}
              _selectedItem={{
                bg: "blue.100"
              }}
            >
              <Select.Item label="Todos" value="" />
              <Select.Item label="Pendiente" value="Pendiente" />
              <Select.Item label="En Revisión" value="En Revisión" />
              <Select.Item label="Aprobado" value="Aprobado" />
              <Select.Item label="Rechazado" value="Rechazado" />
              <Select.Item label="Completado" value="Completado" />
            </Select>
          </HStack>
  
          {loading ? (
            <Box flex={1} justifyContent="center" alignItems="center">
              <Spinner size="lg" color="blue.500" />
            </Box>
          ) : (
            <FlatList
              data={filteredClaims}
              renderItem={renderClaimItem}
              keyExtractor={item => `${item.userId}-${item.id}`}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Box flex={1} justifyContent="center" alignItems="center" py={10}>
                  <Icon as={Ionicons} name="document-text" size={12} color="gray.300" />
                  <Text color="gray.400" mt={2}>No se encontraron reclamos</Text>
                </Box>
              }
            />
          )}
        </VStack>
      </Box>
  
      {/* Modal de detalle de reclamo */}
      <Modal isOpen={showModal} onClose={() => {
        setShowModal(false);
        setShowResolutionForm(false);
      }} size="lg">
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Detalle del Reclamo</Modal.Header>
          <Modal.Body>
            {selectedClaim && !showResolutionForm && (
              <VStack space={4}>
                <HStack justifyContent="space-between">
                  <Text fontWeight="bold">Cliente:</Text>
                  <Text>{selectedClaim.userName || 'No especificado'}</Text>
                </HStack>
                
                <HStack justifyContent="space-between">
                  <Text fontWeight="bold">Email:</Text>
                  <Text>{selectedClaim.userEmail || 'No especificado'}</Text>
                </HStack>
                
                <HStack justifyContent="space-between">
                  <Text fontWeight="bold">Vehículo:</Text>
                  <Text>
                    {selectedClaim.vehiculoInfo 
                      ? `${selectedClaim.vehiculoInfo.marca} ${selectedClaim.vehiculoInfo.modelo} (${selectedClaim.vehiculoInfo.placa})` 
                      : 'No especificado'}
                  </Text>
                </HStack>
                
                <HStack justifyContent="space-between">
                  {/* <Text fontWeight="bold">Tipo de Siniestro:</Text> */}
                  {/* <Text>{selectedClaim.tipoSiniestro || 'No especificado'}</Text> */}
                </HStack>
                
                <HStack justifyContent="space-between">
                  <Text fontWeight="bold">Fecha:</Text>
                  <Text>{formatDate(selectedClaim.fechaCreacion)}</Text>
                </HStack>
                
                <HStack justifyContent="space-between">
                  <Text fontWeight="bold">Estado:</Text>
                  {getStatusBadge(selectedClaim.estadoReclamo)}
                </HStack>
                
                <VStack>
                  <Text fontWeight="bold">Ubicación:</Text>
                  <Text>{selectedClaim.ubicacion || 'No especificada'}</Text>
                </VStack>
                
                <VStack>
                  <Text fontWeight="bold">Descripción:</Text>
                  <Text>{selectedClaim.descripcion || 'Sin descripción'}</Text>
                </VStack>
                
                {selectedClaim.necesitaAsistencia && (
                  <Badge colorScheme="red" alignSelf="flex-start">
                    Requiere asistencia inmediata
                  </Badge>
                )}
                
                {selectedClaim.fotos && selectedClaim.fotos.length > 0 && (
                  <VStack space={2}>
                    <Text fontWeight="bold">Fotos:</Text>
                    <HStack space={2} flexWrap="wrap">
                      {selectedClaim.fotos.map((foto, index) => (
                        <Box key={index} size="100px" rounded="md" overflow="hidden">
                          <Image source={{ uri: foto }} alt="Imagen de reclamo" size="100px" />
                        </Box>
                      ))}
                    </HStack>
                  </VStack>
                )}
                
                {selectedClaim.evaluadorAsignado && (
                  <HStack justifyContent="space-between">
                    <Text fontWeight="bold">Evaluador:</Text>
                    <Text>
                      {EVALUADORES.find(e => e.id === selectedClaim.evaluadorAsignado)?.nombre || selectedClaim.evaluadorAsignado}
                    </Text>
                  </HStack>
                )}
                
                {selectedClaim.montoCompensacion && (
                  <HStack justifyContent="space-between">
                    <Text fontWeight="bold">Compensación:</Text>
                    <Text fontWeight="bold" color="green.500">
                      ${selectedClaim.montoCompensacion.toLocaleString()}
                    </Text>
                  </HStack>
                )}
                
                {selectedClaim.fechaResolucion && (
                  <HStack justifyContent="space-between">
                    <Text fontWeight="bold">Fecha de resolución:</Text>
                    <Text>{formatDate(selectedClaim.fechaResolucion)}</Text>
                  </HStack>
                )}
                
                {selectedClaim.comentarios && (
                  <VStack>
                    <Text fontWeight="bold">Comentarios:</Text>
                    <Text>{selectedClaim.comentarios}</Text>
                  </VStack>
                )}
              </VStack>
            )}
            
            {selectedClaim && showResolutionForm && (
              <VStack space={4}>
                <FormControl isRequired>
                  <FormControl.Label>Evaluador Asignado</FormControl.Label>
                  <Select
                    selectedValue={resolutionData.evaluadorAsignado}
                    minWidth="200"
                    accessibilityLabel="Selecciona un evaluador"
                    placeholder="Selecciona un evaluador"
                    _selectedItem={{
                      bg: "blue.100",
                    }}
                    onValueChange={(itemValue) => 
                      setResolutionData({...resolutionData, evaluadorAsignado: itemValue})
                    }
                  >
                    {EVALUADORES.map((evaluador) => (
                      <Select.Item 
                        key={evaluador.id} 
                        label={evaluador.nombre} 
                        value={evaluador.id} 
                      />
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl isRequired>
                  <FormControl.Label>Monto de Compensación (MXN)</FormControl.Label>
                  <Input
                    value={resolutionData.montoCompensacion}
                    onChangeText={(value) => {
                      // Solo permitir números
                      const numericValue = value.replace(/[^0-9]/g, '');
                      setResolutionData({...resolutionData, montoCompensacion: numericValue});
                    }}
                    keyboardType="numeric"
                    placeholder="0.00"
                    InputLeftElement={
                      <Text ml={2}>$</Text>
                    }
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormControl.Label>Fecha de Resolución</FormControl.Label>
                  <HStack space={2}>
                    <Input
                      flex={1}
                      placeholder="Día"
                      value={resolutionData.fechaResolucion.dia}
                      onChangeText={(value) => {
                        // Solo permitir números y limitar a 2 dígitos
                        const numericValue = value.replace(/[^0-9]/g, '').slice(0, 2);
                        setResolutionData({
                          ...resolutionData, 
                          fechaResolucion: {
                            ...resolutionData.fechaResolucion,
                            dia: numericValue
                          }
                        });
                      }}
                      keyboardType="numeric"
                    />
                    
                    <Select
                      flex={2}
                      selectedValue={resolutionData.fechaResolucion.mes}
                      accessibilityLabel="Mes"
                      placeholder="Mes"
                      onValueChange={(value) => 
                        setResolutionData({
                          ...resolutionData, 
                          fechaResolucion: {
                            ...resolutionData.fechaResolucion,
                            mes: value
                          }
                        })
                      }
                    >
                      {MESES.map((mes) => (
                        <Select.Item 
                          key={mes.value} 
                          label={mes.label} 
                          value={mes.value.toString()} 
                        />
                      ))}
                    </Select>
                    
                    <Input
                      flex={1.5}
                      placeholder="Año"
                      value={resolutionData.fechaResolucion.anio}
                      onChangeText={(value) => {
                        // Solo permitir números y limitar a 4 dígitos
                        const numericValue = value.replace(/[^0-9]/g, '').slice(0, 4);
                        setResolutionData({
                          ...resolutionData, 
                          fechaResolucion: {
                            ...resolutionData.fechaResolucion,
                            anio: numericValue
                          }
                        });
                      }}
                      keyboardType="numeric"
                    />
                  </HStack>
                  <FormControl.HelperText>
                    Formato: DD/MM/AAAA
                  </FormControl.HelperText>
                </FormControl>
                
                <FormControl>
                  <FormControl.Label>Comentarios</FormControl.Label>
                  <TextArea
                    h={20}
                    value={resolutionData.comentarios}
                    onChangeText={(value) => 
                      setResolutionData({...resolutionData, comentarios: value})
                    }
                    placeholder="Añade comentarios sobre la resolución"
                  />
                </FormControl>
              </VStack>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button 
                variant="ghost" 
                colorScheme="blueGray" 
                onPress={() => {
                  setShowModal(false);
                  setShowResolutionForm(false);
                }}
              >
                Cerrar
              </Button>
              
              {selectedClaim && !showResolutionForm && (
                <>
                  {selectedClaim.estadoReclamo === 'Pendiente' && (
                    <Button 
                      colorScheme="blue" 
                      onPress={() => updateClaimStatus(selectedClaim, 'En Revisión')}
                    >
                      Revisar
                    </Button>
                  )}
                  
                  {selectedClaim.estadoReclamo === 'En Revisión' && (
                    <>
                      <Button 
                        colorScheme="red" 
                        onPress={() => updateClaimStatus(selectedClaim, 'Rechazado')}
                      >
                        Rechazar
                      </Button>
                      <Button 
                        colorScheme="green" 
                        onPress={() => updateClaimStatus(selectedClaim, 'Aprobado')}
                      >
                        Aprobar
                      </Button>
                    </>
                  )}
                  
                  {selectedClaim.estadoReclamo === 'Aprobado' && (
                    <Button 
                      colorScheme="green" 
                      onPress={() => updateClaimStatus(selectedClaim, 'Completado')}
                    >
                      Completar
                    </Button>
                  )}
                </>
              )}
              
              {showResolutionForm && (
                <Button 
                  colorScheme="green" 
                  onPress={() => updateClaimStatus(selectedClaim, 'Aprobado')}
                >
                  Confirmar Aprobación
                </Button>
              )}
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </Box>
  );  
};

export default AdminClaimsScreen;
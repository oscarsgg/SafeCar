#include <Wire.h>
#include <TinyGPS++.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <HTTPClient.h>

#define RXD2 16
#define TXD2 17
#define BOTON 14
#define LED_PIN 13

// Configuración de Wi-Fi
const char* ssid = "4-D";
const char* password = "nachosconqueso";
const char* serverUrl = "http://192.168.0.121:3000/api/gps";

// Temporizadores
unsigned long ultimoEnvio = 0;
const unsigned long intervaloEnvio = 1000;  // 1 segundo para el servidor
unsigned long ultimaImpression = 0;
const unsigned long intervaloImpression = 1000;  // 1 segundo para el Serial

HardwareSerial neogps(1);
TinyGPSPlus gps;

bool gpsEncendido = false;
bool estadoBotonAnterior = HIGH;

// Pantalla OLED
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

void setup() {
  Serial.begin(115200);
  neogps.begin(115200, SERIAL_8N1, RXD2, TXD2);
  pinMode(BOTON, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("No se encontró la pantalla OLED");
    while (true);
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(10, 10);
  display.println("Iniciando GPS...");
  display.display();

  Serial.println("Iniciando GPS...");

  // Conectar a Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Conectando a Wi-Fi...");
  }
  Serial.println("Conectado a Wi-Fi");
}

void loop() {
  // Manejo del botón
  bool estadoBotonActual = digitalRead(BOTON);
  
  if (estadoBotonActual == LOW && estadoBotonAnterior == HIGH) {
    delay(50); // Debounce
    if (digitalRead(BOTON) == HIGH) return;
    
    gpsEncendido = !gpsEncendido;
    digitalWrite(LED_PIN, gpsEncendido ? HIGH : LOW);
    
    display.clearDisplay();
    display.setCursor(10, 10);
    display.println(gpsEncendido ? "GPS ENCENDIDO" : "GPS APAGADO");
    display.display();
    
    Serial.println(gpsEncendido ? "GPS ENCENDIDO" : "GPS APAGADO");
  }
  estadoBotonAnterior = estadoBotonActual;

  // Procesamiento GPS
  if (gpsEncendido) {
    procesarGPS();
  }
}

void procesarGPS() {
  while (neogps.available()) {
    char dato = neogps.read();
    gps.encode(dato); // Procesamos siempre los datos
    
    // Mostrar en Serial solo cada 1 segundo
    if (millis() - ultimaImpression >= intervaloImpression) {
      MostrarDatosGPS();
      ultimaImpression = millis();
    }
    
    // Enviar al servidor cada 5 segundos
    if (millis() - ultimoEnvio >= intervaloEnvio) {
      EnviarDatosAlServidor();
      ultimoEnvio = millis();
    }
  }
}

void MostrarDatosGPS() {
  if (gps.location.isValid()) {
    // Mostrar en el Serial Monitor
    Serial.println("\n🛰️ Datos GPS recibidos:");
    Serial.print("🌍 Latitud: "); Serial.println(gps.location.lat(), 6);
    Serial.print("🌍 Longitud: "); Serial.println(gps.location.lng(), 6);
    Serial.print("📡 Satélites: "); Serial.println(gps.satellites.value());
    Serial.print("📏 Altitud: "); Serial.println(gps.altitude.meters());
    Serial.print("⏳ Hora UTC: ");
    Serial.print(gps.time.hour()); Serial.print(":");
    Serial.print(gps.time.minute()); Serial.print(":");
    Serial.println(gps.time.second());
    Serial.println("---------------------------");

    // Mostrar en la pantalla OLED
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("Datos GPS:");

    display.print("Lat: "); display.println(gps.location.lat(), 6);
    display.print("Lng: "); display.println(gps.location.lng(), 6);
    display.print("Sat: "); display.println(gps.satellites.value());
    display.print("Alt: "); display.println(gps.altitude.meters());

    display.print("Hora: ");
    display.print(gps.time.hour()); display.print(":");
    display.print(gps.time.minute()); display.print(":");
    display.println(gps.time.second());

    display.display();
  } else {
    // Si no hay señal GPS
    Serial.println("⛔ Sin señal GPS");
    Serial.print("\n📡 Satélites: "); Serial.println(gps.satellites.value());

    // Mostrar en la pantalla OLED
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("Sin senal GPS");
    display.print("Sat: "); display.println(gps.satellites.value());
    display.display();
  }
}

void EnviarDatosAlServidor() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ Error: No hay conexión WiFi");
    return;
  }

  if (!gps.location.isValid()) {
    Serial.println("⚠️ Error: No hay datos GPS válidos para enviar");
    return;
  }

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000); // Timeout de 5 segundos

  // Crear el JSON con los datos del GPS
  String jsonData = "{\"latitud\":" + String(gps.location.lat(), 6) + 
                   ",\"longitud\":" + String(gps.location.lng(), 6) + 
                   ",\"altitud\":" + String(gps.altitude.meters()) + 
                   ",\"satelites\":" + String(gps.satellites.value()) + 
                   ",\"hora\":\"" + String(gps.time.hour()) + ":" + String(gps.time.minute()) + ":" + String(gps.time.second()) + "\"}";

  Serial.println("Enviando datos al servidor...");
  Serial.println(jsonData);

  int httpResponseCode = http.POST(jsonData);

  if (httpResponseCode > 0) {
    Serial.print("✅ Datos enviados correctamente. Código de respuesta: ");
    Serial.println(httpResponseCode);
  } else {
    Serial.print("❌ Error al enviar datos. Código: ");
    Serial.println(httpResponseCode);
    Serial.print("Mensaje de error: ");
    Serial.println(http.errorToString(httpResponseCode));
  }

  http.end();
}
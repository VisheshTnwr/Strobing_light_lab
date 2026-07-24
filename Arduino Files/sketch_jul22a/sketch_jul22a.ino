/*
 * Subject Stimulus Controller Firmware (Dual USB Serial + Standalone Wi-Fi AP Mode)
 * Hardware: ESP32 + Buck Converter (12V to 5V on VIN/GND) + IRLZ44N MOSFET + 12V 10W COB LED
 * Signal path: 
 *   - Mode 1: USB Serial (React/Electron) -> ESP32 -> MOSFET Gate (Pin 23)
 *   - Mode 2: Wi-Fi AP (StrobeLight_AP @ 192.168.4.1) -> WebServer API -> ESP32 -> MOSFET Gate (Pin 23)
 */

#include <WiFi.h>
#include <WebServer.h>

// --- Wi-Fi Access Point Configuration ---
const char* ap_ssid = "StrobeLight_AP";
const char* ap_password = "strobe1234"; // Minimum 8 characters. Set to "" for open Wi-Fi

// --- Web Server Instance ---
WebServer server(80);

// --- Hardware Pins & PWM Settings ---
const int mosfetPin = 23;      
const int pwmChannel = 0;      
const int pwmFreq = 5000;      // 5000 Hz carrier frequency for flicker-free dimming
const int pwmRes = 8;          // 8-bit resolution (0-255 brightness scale)

// --- State Variables ---
int currentIntensity = 0;      // 0 to 255
float currentFrequency = 0;    // 0 = Solid On. >0 = Strobe in Hz

// --- Timing Variables for Non-Blocking Strobe ---
unsigned long previousMillis = 0;
bool isLedHighPhase = false;

// --- Helper function for ESP32 Arduino Core v2.x vs v3.x compatibility ---
void writePwm(int duty) {
#if defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcWrite(mosfetPin, duty);
#else
  ledcWrite(pwmChannel, duty);
#endif
}

// --- Process Raw Command String ("Intensity,Frequency") ---
void processCommand(String incomingCommand) {
  incomingCommand.trim();
  int commaIndex = incomingCommand.indexOf(',');
  
  if (commaIndex > 0) {
    String intensityStr = incomingCommand.substring(0, commaIndex);
    String frequencyStr = incomingCommand.substring(commaIndex + 1);
    
    currentIntensity = intensityStr.toInt();
    currentFrequency = frequencyStr.toFloat();
    
    currentIntensity = constrain(currentIntensity, 0, 255);
    
    Serial.print("ACK: Intensity set to ");
    Serial.print(currentIntensity);
    Serial.print(", Frequency set to ");
    Serial.println(currentFrequency);
  }
}

// --- HTTP API Handlers ---
void handleRoot() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String html = "<html><head><title>Strobe Light Controller</title>"
                "<meta name='viewport' content='width=device-width, initial-scale=1'>"
                "<style>body{font-family:sans-serif;background:#0d1117;color:#fff;text-align:center;padding:20px;}"
                "h1{color:#58a6ff;} .card{background:#161b22;padding:20px;border-radius:12px;display:inline-block;max-width:400px;}</style>"
                "</head><body><div class='card'>"
                "<h1>Strobe Light Control</h1>"
                "<p>Wi-Fi Access Point Connected!</p>"
                "<p><b>Status:</b> Active</p>"
                "<p><b>Target IP:</b> 192.168.4.1</p>"
                "</div></body></html>";
  server.send(200, "text/html", html);
}

void handleCmd() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Headers", "*");
  
  if (server.hasArg("val")) {
    String cmd = server.arg("val");
    processCommand(cmd);
    String resp = "ACK: Intensity=" + String(currentIntensity) + ", Freq=" + String(currentFrequency);
    server.send(200, "text/plain", resp);
  } else {
    server.send(400, "text/plain", "ERROR: Missing 'val' parameter");
  }
}

void handleOptions() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "*");
  server.send(204);
}

void setup() {
  // 1. Start USB Serial for debugging or wired control
  Serial.begin(115200);
  
  // 2. Configure hardware PWM
#if defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcAttach(mosfetPin, pwmFreq, pwmRes);
#else
  ledcSetup(pwmChannel, pwmFreq, pwmRes);
  ledcAttachPin(mosfetPin, pwmChannel);
#endif
  
  // Safe default: Light OFF
  writePwm(0);
  
  // 3. Start Wi-Fi Access Point Mode (AP)
  WiFi.mode(WIFI_AP);
  WiFi.softAP(ap_ssid, ap_password);
  IPAddress apIP = WiFi.softAPIP();
  
  Serial.println("\n-------------------------------------------");
  Serial.println("System Ready!");
  Serial.print("Wi-Fi AP Name: ");
  Serial.println(ap_ssid);
  Serial.print("Wi-Fi Password: ");
  Serial.println(ap_password);
  Serial.print("ESP32 IP Address: ");
  Serial.println(apIP);
  Serial.println("-------------------------------------------");

  // 4. Configure HTTP Routes
  server.on("/", handleRoot);
  server.on("/cmd", HTTP_GET, handleCmd);
  server.on("/cmd", HTTP_OPTIONS, handleOptions);
  
  server.begin();
  Serial.println("HTTP Web Server Started on Port 80.");
}

void loop() {
  // ---------------------------------------------------------
  // TASK 1: Listen for Wi-Fi HTTP Commands
  // ---------------------------------------------------------
  server.handleClient();

  // ---------------------------------------------------------
  // TASK 2: Listen for USB Serial Commands (Dual Mode)
  // ---------------------------------------------------------
  if (Serial.available() > 0) {
    String incomingCommand = Serial.readStringUntil('\n');
    processCommand(incomingCommand);
  }

  // ---------------------------------------------------------
  // TASK 3: Execute Lighting Logic (Non-Blocking Strobe)
  // ---------------------------------------------------------
  if (currentFrequency == 0 || currentIntensity == 0) {
    writePwm(currentIntensity);
    isLedHighPhase = true;
  } 
  else {
    unsigned long currentMillis = millis();
    float phaseDuration = 1000.0 / (currentFrequency * 2.0);
    
    if (currentMillis - previousMillis >= phaseDuration) {
      previousMillis = currentMillis;
      isLedHighPhase = !isLedHighPhase;
      
      if (isLedHighPhase) {
        writePwm(currentIntensity);
      } else {
        writePwm(0);
      }
    }
  }
}
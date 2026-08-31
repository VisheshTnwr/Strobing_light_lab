/*
 * ============================================================================
 * Subject Stimulus Controller Firmware
 * Project: Strobing Light System
 * Hardware: ESP32 + IRLZ44N MOSFET + 12V 10W COB LED Panel + 12V-to-5V Buck
 * Signal Path:
 *   - Mode 1: USB Serial @ 115200 Baud (React / Electron / Desktop Chrome)
 *   - Mode 2: Standalone Wi-Fi AP @ 192.168.4.1 (Android / Mobile Web / iOS)
 * ============================================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <Ticker.h>

// --- Wi-Fi Access Point Configuration ---
const char* ap_ssid = "StrobeLight_AP";
const char* ap_password = "strobe1234"; // Minimum 8 characters. Set to "" for open Wi-Fi

// --- Web Server on Port 80 ---
WebServer server(80);

// --- Hardware Pins & LEDC PWM Settings ---
const int mosfetPin = 23;            // ESP32 GPIO 23 connected to MOSFET Gate
const int pwmChannel = 0;            // LEDC PWM channel (for ESP32 Core v2.x)
const int pwmCarrierFreq = 5000;     // 5000 Hz carrier frequency for flicker-free dimming
const int pwmRes = 8;                // 8-bit resolution (0-255 brightness duty cycle)

// --- Dynamic Control State ---
volatile int currentIntensity = 0;   // 0 (OFF) to 255 (Max Brightness)
volatile float currentFrequency = 0; // 0 = Solid ON / OFF, >0 = Strobing frequency in Hz
volatile bool isLedHighPhase = false;

// --- Hardware Timer for Jitter-Free Strobing ---
Ticker strobeTicker;

// --- Helper function for ESP32 Arduino Core v2.x vs v3.x compatibility ---
inline void writePwm(int duty) {
#if defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcWrite(mosfetPin, duty);
#else
  ledcWrite(pwmChannel, duty);
#endif
}

// --- ISR Timer Callback: Toggles LED output on/off at precise intervals ---
void IRAM_ATTR onStrobeTimer() {
  isLedHighPhase = !isLedHighPhase;
  int targetDuty = isLedHighPhase ? currentIntensity : 0;
  writePwm(targetDuty);
}

// --- Updates the Hardware Timer and PWM State ---
void updateStrobeState() {
  strobeTicker.detach();

  if (currentIntensity <= 0 || currentFrequency <= 0) {
    // Mode A: Solid continuous light (or completely off)
    isLedHighPhase = true;
    writePwm(currentIntensity);
  } else {
    // Mode B: Active high-precision strobing
    // Calculate half-period in seconds for 50% duty cycle flash
    float halfPeriodSec = 1.0f / (currentFrequency * 2.0f);
    
    // Start with LED in HIGH phase immediately
    isLedHighPhase = true;
    writePwm(currentIntensity);
    
    // Attach hardware timer ISR
    strobeTicker.attach(halfPeriodSec, onStrobeTimer);
  }
}

// --- Process Raw Command String ("Intensity,Frequency") ---
void processCommand(String incomingCommand) {
  incomingCommand.trim();
  int commaIndex = incomingCommand.indexOf(',');

  if (commaIndex > 0) {
    String intensityStr = incomingCommand.substring(0, commaIndex);
    String frequencyStr = incomingCommand.substring(commaIndex + 1);

    currentIntensity = constrain(intensityStr.toInt(), 0, 255);
    currentFrequency = max(0.0f, frequencyStr.toFloat());

    updateStrobeState();

    Serial.print("ACK: Intensity set to ");
    Serial.print(currentIntensity);
    Serial.print(", Frequency set to ");
    Serial.println(currentFrequency);
  }
}

// --- HTTP API: Root Status Page ---
void handleRoot() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Headers", "*");
  String html = "<!DOCTYPE html><html><head><title>Strobe Light Controller</title>"
                "<meta name='viewport' content='width=device-width, initial-scale=1'>"
                "<style>"
                "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #fff; text-align: center; padding: 30px; }"
                ".card { background: #161b22; border: 1px solid #30363d; padding: 24px; border-radius: 12px; display: inline-block; max-width: 440px; text-align: left; }"
                "h1 { color: #58a6ff; font-size: 1.4rem; margin-top: 0; }"
                ".badge { background: #238636; color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; display: inline-block; margin-bottom: 12px; }"
                ".info { color: #8b949e; font-size: 0.9rem; line-height: 1.6; }"
                ".code { background: #070b14; padding: 3px 8px; border-radius: 4px; font-family: monospace; color: #f0883e; }"
                "</style></head><body><div class='card'>"
                "<span class='badge'>ESP32 AP ONLINE</span>"
                "<h1>Strobe Light Controller</h1>"
                "<div class='info'>"
                "<p><b>SSID:</b> <span class='code'>StrobeLight_AP</span></p>"
                "<p><b>IP Address:</b> <span class='code'>192.168.4.1</span></p>"
                "<p><b>Current Intensity:</b> " + String(currentIntensity) + "/255</p>"
                "<p><b>Current Frequency:</b> " + String(currentFrequency) + " Hz</p>"
                "<hr style='border-color: #30363d; margin: 16px 0;'>"
                "<p style='font-size: 0.8rem;'>System is actively listening for serial and Wi-Fi HTTP commands.</p>"
                "</div></div></body></html>";
  server.send(200, "text/html", html);
}

// --- HTTP API: Command Endpoint (/cmd?val=Intensity,Frequency) ---
void handleCmd() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Headers", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (server.hasArg("val")) {
    String cmd = server.arg("val");
    processCommand(cmd);
    String resp = "ACK: Intensity=" + String(currentIntensity) + ", Freq=" + String(currentFrequency);
    server.send(200, "text/plain", resp);
  } else {
    server.send(400, "text/plain", "ERROR: Missing 'val' query parameter");
  }
}

// --- HTTP API: CORS Preflight Handler ---
void handleOptions() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "*");
  server.send(204);
}

// --- HTTP API: Not Found Handler ---
void handleNotFound() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Headers", "*");
  if (server.method() == HTTP_OPTIONS) {
    server.send(204);
  } else {
    server.send(404, "text/plain", "Not Found");
  }
}

void setup() {
  // 1. Initialize USB CDC Serial
  Serial.begin(115200);
  delay(100);

  // 2. Configure LEDC Hardware PWM Carrier (5 kHz, 8-bit)
#if defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcAttach(mosfetPin, pwmCarrierFreq, pwmRes);
#else
  ledcSetup(pwmChannel, pwmCarrierFreq, pwmRes);
  ledcAttachPin(mosfetPin, pwmChannel);
#endif

  // 3. Ensure Light is safely OFF on startup
  writePwm(0);
  updateStrobeState();

  // 4. Start Wi-Fi Access Point Mode (SoftAP)
  WiFi.mode(WIFI_AP);
  WiFi.softAP(ap_ssid, ap_password);
  IPAddress apIP = WiFi.softAPIP();

  // 5. Configure Web Server Routes with CORS
  server.on("/", HTTP_GET, handleRoot);
  server.on("/cmd", HTTP_GET, handleCmd);
  server.on("/cmd", HTTP_OPTIONS, handleOptions);
  server.onNotFound(handleNotFound);

  server.begin();

  // 6. Print System Diagnostic Info
  Serial.println("\n===========================================");
  Serial.println("  ESP32 STROBE LIGHT CONTROLLER FIRMWARE   ");
  Serial.println("===========================================");
  Serial.print("Wi-Fi SoftAP SSID: ");
  Serial.println(ap_ssid);
  Serial.print("Wi-Fi Password:    ");
  Serial.println(ap_password);
  Serial.print("ESP32 IP Address:  ");
  Serial.println(apIP);
  Serial.println("HTTP WebServer:    Listening on Port 80");
  Serial.println("PWM Carrier:       5000 Hz (LEDC 8-bit)");
  Serial.println("MOSFET Pin:        GPIO 23");
  Serial.println("-------------------------------------------");
  Serial.println("System Ready. Awaiting commands (Format: Intensity,Frequency)");
  Serial.println("===========================================\n");
}

void loop() {
  // 1. Process Wi-Fi HTTP API Requests
  server.handleClient();

  // 2. Process USB Serial Commands
  if (Serial.available() > 0) {
    String incomingCommand = Serial.readStringUntil('\n');
    processCommand(incomingCommand);
  }
}
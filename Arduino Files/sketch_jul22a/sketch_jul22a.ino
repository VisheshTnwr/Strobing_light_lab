/*
 * Subject Stimulus Controller Firmware
 * Hardware: ESP32 + IRLZ44N MOSFET + 12V 10W COB LED
 * Signal path: USB Serial (React/Electron) -> ESP32 -> MOSFET Gate (Pin 23)
 */

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

void setup() {
  // 1. Start USB Serial communication at high speed
  Serial.begin(115200);
  
  // 2. Configure hardware PWM (Compatible with ESP32 core v2.x and v3.x+)
#if defined(ESP_ARDUINO_VERSION_MAJOR) && ESP_ARDUINO_VERSION_MAJOR >= 3
  ledcAttach(mosfetPin, pwmFreq, pwmRes);
#else
  ledcSetup(pwmChannel, pwmFreq, pwmRes);
  ledcAttachPin(mosfetPin, pwmChannel);
#endif
  
  // 3. Ensure light is safely OFF on boot
  writePwm(0);
  
  Serial.println("System Ready. Awaiting commands (Format: Intensity,Frequency)");
}

void loop() {
  // ---------------------------------------------------------
  // TASK 1: Listen for incoming commands from the React App
  // ---------------------------------------------------------
  if (Serial.available() > 0) {
    // Read the incoming string until the newline character
    String incomingCommand = Serial.readStringUntil('\n');
    incomingCommand.trim(); // Clean up any invisible carriage returns
    
    // Find the comma separating the two values
    int commaIndex = incomingCommand.indexOf(',');
    
    if (commaIndex > 0) {
      // Parse the two numbers
      String intensityStr = incomingCommand.substring(0, commaIndex);
      String frequencyStr = incomingCommand.substring(commaIndex + 1);
      
      currentIntensity = intensityStr.toInt();
      currentFrequency = frequencyStr.toFloat();
      
      // Keep intensity safely within 8-bit bounds
      currentIntensity = constrain(currentIntensity, 0, 255);
      
      Serial.print("ACK: Intensity set to ");
      Serial.print(currentIntensity);
      Serial.print(", Frequency set to ");
      Serial.println(currentFrequency);
    }
  }

  // ---------------------------------------------------------
  // TASK 2: Execute the Lighting Logic (Without Blocking)
  // ---------------------------------------------------------
  if (currentFrequency == 0 || currentIntensity == 0) {
    // MODE A: Solid Light (or completely OFF)
    writePwm(currentIntensity);
    isLedHighPhase = true; // Reset phase tracker
  } 
  else {
    // MODE B: Active Strobing
    unsigned long currentMillis = millis();
    
    // Calculate how long each ON and OFF phase should last (in milliseconds)
    // 1000ms / Frequency = Full Wave. Divide by 2 for the half-wave phase.
    float phaseDuration = 1000.0 / (currentFrequency * 2.0);
    
    // Check if it is time to flip the state
    if (currentMillis - previousMillis >= phaseDuration) {
      previousMillis = currentMillis;       // Save the last time it flipped
      isLedHighPhase = !isLedHighPhase;     // Toggle the phase
      
      if (isLedHighPhase) {
        writePwm(currentIntensity); // Apply the PWM carrier
      } else {
        writePwm(0);                // Pull to absolute zero
      }
    }
  }
}
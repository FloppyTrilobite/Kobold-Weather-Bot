//Wifi
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <Adafruit_Sensor.h>
//DHT
#include "DHT.h"
#define DHTTYPE DHT11
#define dht_dpin 14
DHT dht (dht_dpin, DHTTYPE);
//BME
#include <Wire.h>
#include <SPI.h>
#include <Adafruit_BMP280.h>
#define BMP_SCK 13
#define BMP_MISO 12
#define BMP_MOSI 11 
#define BMP_CS 10
Adafruit_BMP280 bme; 

// Update these with values suitable for your network.

const char* ssid = "internet"; // internet 
const char* password = "senha"; //senha
const char* mqtt_server = "broker.mqtt-dashboard.com";

long now = millis();
long lastMeasure = 0;
int sensorValue = 0;

WiFiClient espClient;
PubSubClient client(espClient);
long lastMsg = 0;
char msg[50];
int value = 0;
char msg1[150];

void setup_wifi() {

  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  randomSeed(micros());

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  String messageTemp;
  
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
    messageTemp += (char)payload[i];
  }
  Serial.println();

  if ((char)payload[0] == '1') {   
    digitalWrite(BUILTIN_LED, LOW);               
  } else {                                                          
    digitalWrite(BUILTIN_LED, HIGH);                                    
  }
  
  Serial.println("messageTemp-"+messageTemp);
   
  Serial.println();
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    if (client.connect("client")) { //client
      Serial.println("connected");
      client.subscribe("pubtopic"); //pub
      
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  pinMode(BUILTIN_LED, OUTPUT);                                        
  Serial.begin(9600);                                      
  setup_wifi();                                  
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);  
  dht.begin();
  if (!bme.begin(0x76)) { 
    Serial.println("Could not find a valid BMP280 sensor, check wiring!");
  while (1);
  }
}

void loop() {

  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  float dhtH = dht.readHumidity();
  delay(100);
  float bmeT = bme.readTemperature();
  int bmeP = bme.readPressure()/100;

  Serial.print("\n\n");
  
  Serial.print("Temperatura =");
  Serial.print(bmeT);
  Serial.println("*C\n");
  sprintf(msg, "%.2f",bmeT);
  client.publish("subtopic/Temp",msg); //temp

  Serial.print("Umidade =");
  Serial.print(dhtH);
  Serial.println("%\n");
  sprintf(msg, "%.2f",dhtH);
  client.publish("subtopic/Umid",msg); //umid

  Serial.print("Pressão =");
  Serial.print(bmeP);
  Serial.println("hPa\n");
  sprintf(msg, "%d",bmeP);
  client.publish("subtopic/Pres",msg); //pres

  Serial.print("-----------------------------------\n\n");

  delay(180000);
}

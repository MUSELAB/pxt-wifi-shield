namespace MuseIoT {
  let flag = true;
  let httpReturnArray: string[] = []
  let inbound1 = ""
  let inbound2 = ""
  let outbound1 = ""
  let outbound2 = ""
  let b_MQTTon = false;
  let str_MQTTinbound = "";
  let b_MQTTConnectStatus = true;
  let b_CheckRecivied = false;
  let MuseDataMQTTID=""

  export enum arcgisFunction {
    //% block="Add"
    add,
    //% block="Update"
    update
  }

  export enum ArcgisSensorSelect {
    //% block="Wind direction"
    wind_direction,
    //% block="Wind speed"
    winf_speed,
    //% block="Rain fall"
    rain_fall,
    //% block="PM 2.5"
    pm_2_5,
    //% block="Temperature sensor"
    temperature_sensor,
    //% block="Analog input"
    analog_input,
    //% block="Digital input"
    digital_input
  }

  export enum httpMethod {
    //% block="GET"
    GET,
    //% block="POST"
    POST,
    //% block="PUT"
    PUT,
    //% block="DELETE"
    DELETE
  }

  export enum bound_no {
    //% block="1"
    bound1,
    //% block="2"
    bound2
  }

  // -------------- 1. Initialization ----------------
  //%blockId=muselab_initialize_wifi
  //%block="Initialize Muselab WiFi Booster and OLED"
  //% weight=90	
  //% blockGap=7
  //% group="Booster"
  export function initializeWifi(): void {
    serial.redirect(SerialPin.P16, SerialPin.P8, BaudRate.BaudRate115200);
    MuseOLED.init()

    serial.onDataReceived(serial.delimiters(Delimiters.NewLine), () => {
      let temp = serial.readLine();
      let tempDeleteFirstCharacter = "";


      if (b_MQTTon) {
        if (temp.charAt(0) == "#") {
          if (parseInt(temp.charAt(2)) <= 4) {
            let temp_pin = 100 + (temp.charAt(2) == "3" ? 12 : parseInt(temp.charAt(2)));
            switch (parseInt(temp.charAt(1))) {
              case 0:
                pins.digitalWritePin(temp_pin, parseInt(temp.charAt(6)));
                break;
              case 1:
                pins.analogWritePin(temp_pin, parseInt(temp.substr(3, 4)));
                break;
              case 2:
                pins.servoWritePin(temp_pin, parseInt(temp.substr(4, 3)));
                break;
              case 3:
                pins.servoWritePin(temp_pin, parseInt(temp.substr(4, 3)) * 180 / 200);
                break;
              case 4:
                MuseRover.motorOn(parseInt(temp.charAt(2)), parseInt(temp.charAt(3)), pins.map(parseInt(temp.substr(4, 4)), 0, 1023, 0, 100))
                break;
              case 5:
                MuseRover.motorOn(0, parseInt(temp.charAt(2)), pins.map(parseInt(temp.substr(3, 4)), 0, 1023, 0, 100));
                MuseRover.motorOn(1, parseInt(temp.charAt(7)), pins.map(parseInt(temp.substr(8, 4)), 0, 1023, 0, 100));
                break;
              case 6:
                {
                  let temp_mode = parseInt(temp.substr(2, 1));
                  let temp_speed = pins.map(parseInt(temp.substr(3, 4)), 0, 1023, 0, 100);
                  if (temp_mode == 0) {
                    MuseRover.motorOn(0, 0, temp_speed)
                    MuseRover.motorOn(1, 0, temp_speed)
                  } else if (temp_mode == 1) {
                    MuseRover.motorOn(0, 1, temp_speed)
                    MuseRover.motorOn(1, 1, temp_speed)
                  } else if (temp_mode == 2) {
                    MuseRover.motorOn(0, 1, temp_speed)
                    MuseRover.motorOn(1, 0, 0)
                  } else if (temp_mode == 3) {
                    MuseRover.motorOn(0, 0, 0)
                    MuseRover.motorOn(1, 1, temp_speed)
                  } else if (temp_mode == 4) {
                    MuseRover.motorOn(0, 0, temp_speed)
                    MuseRover.motorOn(1, 0, temp_speed)
                  }
                }
                break;
            }
          } else if (parseInt(temp.charAt(2)) > 4) {
            switch (temp.charAt(1)) {
              case "0":
                serial.writeLine("(AT+digital?pin=" + temp.charAt(2) + "&intensity=" + temp.charAt(6) + ")");
                break;
              case "1":
                serial.writeLine("(AT+pwm?pin=" + temp.charAt(2) + "&intensity=" + temp.substr(3, 4) + ")");
                break;
              case "2":
                serial.writeLine("(AT+servo_180?pin=" + temp.charAt(2) + "&degree=" + temp.substr(4, 3) + ")");
                break;
              case "3":
                {
                  let temp_case3 = 0
                  if (parseInt(temp.substr(4, 3)) > 100) {
                    temp_case3 = pins.map(parseInt(temp.substr(4, 3)), 100, 200, -9, 71)
                  } else if (parseInt(temp.substr(4, 3)) <= 100) {
                    temp_case3 = pins.map(parseInt(temp.substr(4, 3)), 100, 0, -20, -100)
                  }

                  if (temp_case3 > 0) {
                    serial.writeLine("(AT+servo_360?pin=" + temp.charAt(2) + "&direction=anticlockwise&speed=" + temp_case3 + ")");
                  } else {
                    serial.writeLine("(AT+servo_360?pin=" + temp.charAt(2) + "&direction=clockwise&speed=" + (-temp_case3) + ")");
                  }
                }
                break;
            }
          }
        } else {
          str_MQTTinbound = temp;
        }

        b_MQTTon = false;
      } else if (temp.compare("Publish OK") >= 0) {
        b_CheckRecivied = true;
      } else if (temp.charAt(0).compare("#") == 0) {
        tempDeleteFirstCharacter = temp.substr(1, 20)
        httpReturnArray.push(tempDeleteFirstCharacter)
      } else if (temp.charAt(0).compare("*") == 0) {

        // For digital, pwm, servo
        let mode = temp.substr(1, 1)
        let intensity = 0
        let pin = 0

        // For motor and car
        let motor = 0
        let direction = 0

        // For control 2 motor same time mode
        let direction1 = 0
        let direction2 = 0
        let intensity1 = 0
        let intensity2 = 0

        if (mode == "0") {	//digital
          pin = parseInt(temp.substr(3, 2)) - 7
          intensity = parseInt(temp.substr(2, 1))
          switch (pin) {
            case 0:
              pins.digitalWritePin(DigitalPin.P0, intensity);
              break
            case 1:
              pins.digitalWritePin(DigitalPin.P1, intensity);
              break
            case 2:
              pins.digitalWritePin(DigitalPin.P2, intensity);
              break
            case 12:
              pins.digitalWritePin(DigitalPin.P12, intensity);
              break
          }


        } else if (mode == "1") { //pwm
          pin = parseInt(temp.substr(5, 2)) - 7
          intensity = pins.map(parseInt(temp.substr(2, 3)), 100, 900, 0, 1023)
          switch (pin) {
            case 0:
              pins.analogWritePin(AnalogPin.P0, intensity);
              break
            case 1:
              pins.analogWritePin(AnalogPin.P1, intensity);
              break
            case 2:
              pins.analogWritePin(AnalogPin.P2, intensity);
              break
            case 12:
              pins.analogWritePin(AnalogPin.P12, intensity);
              break
          }

        } else if (mode == "2") { //servo
          pin = parseInt(temp.substr(5, 2)) - 7
          intensity = pins.map(parseInt(temp.substr(2, 3)), 100, 900, 0, 180)
          switch (pin) {
            case 0:
              pins.servoWritePin(AnalogPin.P0, intensity);
              break
            case 1:
              pins.servoWritePin(AnalogPin.P1, intensity);
              break
            case 2:
              pins.servoWritePin(AnalogPin.P2, intensity);
              break
            case 12:
              pins.servoWritePin(AnalogPin.P12, intensity);
              break
          }

        } else if (mode == "3") { //motor
          motor = parseInt(temp.substr(6, 1))
          direction = parseInt(temp.substr(5, 1))
          intensity = pins.map(parseInt(temp.substr(2, 3)), 100, 900, 0, 100)

          MuseRover.motorOn(motor, direction, intensity)
        } else if (mode == "4") { //car
          direction = parseInt(temp.substr(5, 1))
          intensity = pins.map(parseInt(temp.substr(2, 3)), 100, 900, 0, 100)

          if (direction == 0) {
            MuseRover.motorOn(0, 0, intensity)
            MuseRover.motorOn(1, 0, intensity)
          } else if (direction == 1) {
            MuseRover.motorOn(0, 1, intensity)
            MuseRover.motorOn(1, 1, intensity)
          } else if (direction == 2) {
            MuseRover.motorOn(0, 1, intensity)
            MuseRover.motorOn(1, 0, 0)
          } else if (direction == 3) {
            MuseRover.motorOn(0, 0, 0)
            MuseRover.motorOn(1, 1, intensity)
          } else if (direction == 4) {
            MuseRover.motorOn(0, 0, intensity)
            MuseRover.motorOn(1, 0, intensity)
          }
        } else if (mode == "5") { //motor_2
          direction1 = parseInt(temp.substr(5, 1))
          intensity1 = pins.map(parseInt(temp.substr(2, 3)), 100, 900, 0, 100)
          direction2 = parseInt(temp.substr(9, 1))
          intensity2 = pins.map(parseInt(temp.substr(6, 3)), 100, 900, 0, 100)

          MuseRover.motorOn(0, direction1, intensity1)
          MuseRover.motorOn(1, direction2, intensity2)

        }

        //basic.showNumber(pin)
        //basic.showNumber(intensity)

      } else if (temp.charAt(0).compare("$") == 0) {
        let no = parseInt(temp.substr(1, 1))
        let string_word = temp.substr(2, 20)

        if (no == 1) {
          inbound1 = string_word
        } else if (no == 2) {
          inbound2 = string_word
        }

      } else if (temp.substr(0, 12) == "Got MQTT Msg") {
        b_MQTTon = true;
      } else {
        MuseOLED.writeStringNewLine(temp)
      }
    })

    basic.pause(5000);
  }

  // -------------- 2. WiFi ----------------
  //% blockId=muselab_set_wifi
  //% block="Set wifi to ssid %ssid| pwd %pwd"   
  //% weight=80
  //% group="WIFI"
  export function setWifi(ssid: string, pwd: string): void {
    serial.writeLine("(AT+wifi?ssid=" + ssid + "&pwd=" + pwd + ")");
  }

  // -------------- 3. Cloud ----------------
  //% blockId=muselab_set_thingspeak
  //% block="Send Thingspeak key* %key|field1 %field1|field2 %field2|field3 %field3"
  //% weight=70	
  //% blockGap=7
  //% group="Cloud"
  export function sendThingspeak(key: string, field1: number, field2: number, field3: number): void {
    serial.writeLine("(AT+thingspeak?key=" + key + "&field1=" + field1 + "&field2=" + field2 + "&field3=" + field3 + ")");
  }

  //% blockId=muselab_set_musespeak
  //% block="Send data.muselab.cc key* %key|field1 %field1|field2 %field2|field3 %field3|field4 %field4|field5 %field5|field6 %field6"
  //% weight=65	
  //% blockGap=7
  //% group="Cloud"
  export function sendMusespeak(key: string, field1: number, field2: number, field3: number, field4: number, field5: number, field6: number): void {
    serial.writeLine("(AT+http?method=GET&url=18.162.61.31:8080/update?key=" + key + "&field1=" + field1 + "&field2=" + field2 + "&field3=" + field3 + "&field4=" + field4 + "&field5=" + field5 + "&field6=" + field6 + "&field7=0" + "&header=&body=)");
  }

  //% blockId=muselab_set_ifttt
  //% block="Send IFTTT key* %key|event_name* %event|value1 %value1|value2 %value2|value3 %value3"
  //% weight=60
  //% blockGap=7
  //% group="Cloud"
  export function sendIFTTT(key: string, eventname: string, value1: number, value2: number, value3: number): void {
    serial.writeLine("(AT+ifttt?key=" + key + "&event=" + eventname + "&value1=" + value1 + "&value2=" + value2 + "&value3=" + value3 + ")");
  }

  //% blockId=muselab_set_arcgis
  //% block="Send ArcGIS Online feature function %arcgisfunction|Server name* %servername|Service ID* %featureserviceid|Layer Name* %layername|Location X* %x|Location Y* %y|sensor_type %sensortype|sensor_id %sensorid|sensor_reading %reading|objectid(For update only) %objectid"
  //% weight=59
  //% group="Cloud"
  export function sendArcgis(arcgisfunction: arcgisFunction, servername: string, featureserviceid: string, layername: string, x: string, y: string, sensortype: string, sensorid: string, reading: number, objectid: number): void {
    switch (arcgisfunction) {
      case arcgisFunction.add:
        serial.writeLine("(AT+arcgis?arcgisfunction=add&servername=" + servername + "&featureserviceid=" + featureserviceid + "&layername=" + layername + "&reading=" + reading + "&sensortype=" + sensortype + "&sensorid=" + sensorid + "&x=" + x + "&y=" + y + ")");
        break
      case arcgisFunction.update:
        serial.writeLine("(AT+arcgis?arcgisfunction=update&servername=" + servername + "&featureserviceid=" + featureserviceid + "&layername=" + layername + "&objectid=" + objectid + "&reading=" + reading + "&sensortype=" + sensortype + "&sensorid=" + sensorid + "&x=" + x + "&y=" + y + ")");
        break
    }
  }

  // -------------- 4. Others ----------------
  //% blockId=muselab_set_wifi_hotspot
  //% block="Set hotspot to ssid %ssid| pwd %pwd"   
  //% weight=58	
  //% blockGap=7
  //% group="WIFI"
  export function setWifiHotspot(ssid: string, pwd: string): void {
    serial.writeLine("(AT+wifi_hotspot?ssid=" + ssid + "&pwd=" + pwd + ")");
  }

  //%blockId=muselab_start_server
  //%block="Start WiFi remote control"
  //% weight=55
  //% blockGap=7
  //% group="HTTP"
  export function startWebServer(): void {
    flag = false
    serial.writeLine("(AT+startWebServer)")
    while (flag) {
      serial.writeLine("(AT+write_sensor_data?p0=" + pins.analogReadPin(AnalogPin.P0) + "&p1=" + pins.analogReadPin(AnalogPin.P1) + "&p2=" + pins.analogReadPin(AnalogPin.P2) + "&outbound1=" + outbound1 + "&outbound2=" + outbound2 + ")")
      basic.pause(500)
      if (!flag)
        break;
    }

  }

  //%blockId=muselab_initialize_wifi_normal
  //%block="Initialize Muselab WiFi Booster"
  //% weight=54
  //% group="Booster"
  export function initializeWifiNormal(): void {
    serial.redirect(SerialPin.P16, SerialPin.P8, BaudRate.BaudRate115200);
  }

  // -------------- 5. Advanced Wifi ----------------

  //%subcategory=More
  //%blockId=muselab_generic_http
  //% block="Send generic HTTP method %method| http://%url| header %header| body %body"
  //% weight=50
  //% blockGap=7
  //% group="HTTP"
  export function sendGenericHttp(method: httpMethod, url: string, header: string, body: string): void {
    httpReturnArray = []
    let temp = ""
    switch (method) {
      case httpMethod.GET:
        temp = "GET"
        break
      case httpMethod.POST:
        temp = "POST"
        break
      case httpMethod.PUT:
        temp = "PUT"
        break
      case httpMethod.DELETE:
        temp = "DELETE"
        break
    }
    serial.writeLine("(AT+http?method=" + temp + "&url=" + url + "&header=" + header + "&body=" + body + ")");
  }

  //%subcategory=More
  //% blockId="muselab_generic_http_return" 
  //% block="HTTP response (string array)"
  //% weight=49
  //% blockGap=7	
  //% group="HTTP"
  export function getGenericHttpReturn(): Array<string> {
    return httpReturnArray;
  }

  //%subcategory=More
  //% blockId="muselab_http_inbound" 
  //% block="HTTP inbound %no"
  //% weight=48
  //% blockGap=7	
  //% group="HTTP"
  export function getInbound(no: bound_no): string {
    let temp = ""
    switch (no) {
      case bound_no.bound1:
        temp = inbound1;
        break
      case bound_no.bound2:
        temp = inbound2;
        break
    }
    return temp;
  }

  //%subcategory=More
  //%blockId=muselab_http_outbound1
  //%block="Set HTTP outbound %no| %wordinds"
  //% weight=47	
  //% blockGap=7
  //% group="HTTP"
  export function setOutbound(no: bound_no, wordinds: string): void {

    switch (no) {
      case bound_no.bound1:
        outbound1 = wordinds;
        break
      case bound_no.bound2:
        outbound2 = wordinds;
        break
    }
  }

  //%subcategory=More
  //%blockId=muselab_muse_mqtt
  //%block="Connect to Muse MQTT server"
  //% weight=44
  //% blockGap=7
  //% group="MQTT"
  export function connectMuseMQTT(): void {
    serial.writeLine("(AT+startMQTT?host=13.58.53.42&port=1883&clientId=100&username=omlxmgsy&password=AoGUfQNPkeSH)");
    while (true) {
      serial.writeLine("(AT+write_sensor_data?p0=" + pins.analogReadPin(AnalogPin.P0) + "&p1=" + pins.analogReadPin(AnalogPin.P1) + "&p2=" + pins.analogReadPin(AnalogPin.P2) + ")")
      basic.pause(500)
    }
  }

  //%subcategory=More
  //%blockId=muselab_check_mqtt
  //%block="Check MQTT status by send to topic %temp_topic with message %temp_payload "
  //% weight=44
  //% blockGap=7
  //% group="MQTT"
  export function checkMQTT(temp_topic: string, temp_payload: string): boolean {
    b_CheckRecivied = false;
    serial.writeLine("(AT+mqttPub?topic=" + temp_topic + "&payload=" + temp_payload + ")");
    basic.pause(1000);
    b_MQTTConnectStatus = b_CheckRecivied;
    return b_MQTTConnectStatus;
  }

  //%subcategory=More
  //% blockId=muselab_general_mqtt
  //% block="Connect MQTT server %host| port %port| client id %clientId| username %username| password %pwd"
  //% weight=43
  //% blockGap=7
  //% group="MQTT"
  export function connectgeneralMQTT(host: string, port: string, clientId: string, username: string, pwd: string): void {
    serial.writeLine("(AT+startMQTT?host=" + host + "&port=" + port + "&clientId=" + clientId + "&username=" + username + "&password=" + pwd + ")");
  }

  //%subcategory=More
  //%blockId=muselab_mqtt_publish
  //% block="MQTT publish topic %topic| payload %payload"
  //% weight=42	
  //% blockGap=7
  //% group="MQTT"
  export function mqttPublish(topic: string, payload: string): void {
    serial.writeLine("(AT+mqttPub?topic=" + topic + "&payload=" + payload + ")");
  }

  //%subcategory=More
  //%blockId=muselab_mqtt_subscribe
  //% block="MQTT subscribe topic %topic"
  //% weight=41	
  //% blockGap=7
  //% group="MQTT"
  export function mqttSubscribe(topic: string): void {
    serial.writeLine("(AT+mqttSub?topic=" + topic + ")");
  }

  //%subcategory=More
  //%blockId=muselab_mqtt_inbound
  //% block="MQTT inbound"
  //% weight=40
  //% blockGap=7
  //% group="MQTT"
  export function mqttInbound(): string {
    return str_MQTTinbound;
  }

  //%subcategory=More
  //%blockId=muselab_mqtt_send_digital
  //% block="MQTT send digital output command to |Topic %temp_topic Pin %temp_pin Output %temp_output"
  //% weight=39
  //% blockGap=7
  //% group="MQTT"
  export function mqttSendDigital(temp_topic: string, temp_pin: Muse21.Servo, temp_output: Muse21.digitalonoff) {
    serial.writeLine("(AT+mqttPub?topic=" + temp_topic + "&payload=" + "#0" + temp_pin + "000" + temp_output + ")");
  }



  //%subcategory=More
  //%blockId=muselab_mqtt_send_analog
  //% block="MQTT send analog output command to |Topic %temp_topic Pin %temp_pin Output %temp_output"
  //% temp_output.min=0 temp_output.max=1023
  //% weight=38
  //% group="MQTT"
  export function mqttSendAnalog(temp_topic: string, temp_pin: Muse21.Servo, temp_output: number) {

    serial.writeLine("(AT+mqttPub?topic=" + temp_topic + "&payload=" + "#1" + temp_pin +
      (temp_output < 10 ?
        "000" + temp_output.toString()
        :
        (temp_output < 100 ?
          "00" + temp_output.toString()
          :
          (temp_output < 1000 ?
            "0" + temp_output.toString()
            :
            temp_output.toString()
          )
        )
      )
      + ")");
  }

  //%subcategory=More
  //%blockId=muselab_mqtt_send_180servo
  //% block="MQTT send 180 servo output command to |Topic %temp_topic Pin %temp_pin Degree %temp_output"
  //% temp_output.min=0 temp_output.max=180
  //% weight=37
  //% group="MQTT"
  export function mqttSend180Servo(temp_topic: string, temp_pin: Muse21.Servo, temp_output: number) {
    serial.writeLine("(AT+mqttPub?topic=" + temp_topic + "&payload=" + "#2" + temp_pin +
      (temp_output < 10 ?
        "000" + temp_output.toString()
        :
        (temp_output < 100 ?
          "00" + temp_output.toString()
          :
          "0" + temp_output.toString()
        )
      )
      + ")");
  }

export enum methodDirection {

    //% block="NULL"
    NULL,
    //% block="switch ON"
    switch_ON,
    //% block="switch OFF"
    switch_OFF,
    //% block="turn UP"
    action_UP,
    //% block="turn DOWN"
    action_DOWN,
    //% block="turn STOP"
    action_STOP,
}

export enum deviceDescription {
  //% block="NULL"
  NULL,
  //% block="CO2"
  CO2,
  //% block="VOC"
  VOC,
  //% block="Dust"
  Dust,
  //% block="CO"
  CO,
  //% block="Temp"
  Temp,
  //% block="Humi"
  Humi,
  //% block="Gas"
  Gas
}

  //% blockId=Connect to Muse Data MQTT broker
  //% block="Connect to Muse Data MQTT broker UserID %temp_ID"   
  //% weight=80	
  //% group="MQTT"
  export function ConnectMuseDataMQTTbroker(temp_ID: string):  void{
    b_MQTTConnectStatus = b_CheckRecivied;
    if(b_MQTTConnectStatus=false)
    {
      serial.writeLine("(AT+startMQTT?host=" + "18.163.126.160" + "&port=" + "1883" + "&clientId=" + "muselab_hkt" + "&username=" + "siot" + "&password=" + "dfrobot" + ")");
      serial.writeLine("(AT+mqttSub?topic=" + temp_ID + ")");
    }
    MuseDataMQTTID = temp_ID;
  }


  //%subcategory=More
  //%blockId=HKT
  //% block="HKT MegaSensor DB %temp_db Deviceid %temp_deviceid Description %temp_Description methord %temp_methord"
  //% weight=43
  //% group="MQTT"
  export function HKTIAQ(temp_db: string,temp_deviceid: string,temp_Description: deviceDescription, temp_methord: methodDirection) : string {
 
    let switchDescription
    let switchmethord
    b_CheckRecivied = false;
    b_MQTTConnectStatus = b_CheckRecivied;

    switch (temp_Description) {
      case deviceDescription.NULL:
        switchDescription = "NULL"
        break
      case deviceDescription.CO2:
        switchDescription = "CO2"
        break
      case deviceDescription.VOC:
        switchDescription = "VOC"
        break
      case deviceDescription.Dust:
        switchDescription = "Dust"
        break
      case deviceDescription.CO:
        switchDescription = "CO"
        break
      case deviceDescription.Temp:
        switchDescription = "Temp"
        break  
      case deviceDescription.Humi:
        switchDescription = "Humi"
        break  
      case deviceDescription.Gas:
        switchDescription = "Gas"
        break  
    }

    switch (temp_methord) {
      case methodDirection.NULL:
        switchmethord = "NULL"
        break
      case methodDirection.switch_ON:
        switchmethord = "switch_ON"
        break
      case methodDirection.switch_OFF:
        switchmethord = "switch_OFF"
        break
      case methodDirection.action_UP:
        switchmethord = "action_UP"
        break
      case methodDirection.action_DOWN:
        switchmethord = "action_DOWN"
        break
      case methodDirection.action_STOP:
        switchmethord = "action_STOP"
        break
    }
    if(b_MQTTConnectStatus=false)
    {
      serial.writeLine("(AT+startMQTT?host=" + "18.163.126.160" + "&port=" + "1883" + "&clientId=" + "muselab_hkt" + "&username=" + "siot" + "&password=" + "dfrobot" + ")");
      serial.writeLine("(AT+mqttSub?topic=" + MuseDataMQTTID + ")");
    }

    let payload = "{\"UserID\":" +"\""+ MuseDataMQTTID+"\","+ "\"DeviceId\":" +"\""+ temp_deviceid+"\","+ "\"device\":" + "\""+switchDescription+"\","+"\"method\":" +"\""+switchmethord+"\","+"\"db\":" +"\""+temp_db+"\"}"
   
    serial.writeLine("(AT+mqttPub?topic=" + "HKT/MQTT" + "&payload=" + payload + ")");
   
    return str_MQTTinbound;
  }



  //%subcategory=More
  //%blockId=muselab_mqtt_send_360servo
  //% block="MQTT send 360 servo output command to |Topic %temp_topic Pin %temp_pin Direction %temp_direction Speed %temp_output"
  //% temp_output.min=0 temp_output.max=100
  //% weight=36
  //% group="MQTT"
  export function mqttSend360Servo(temp_topic: string, temp_pin: Muse21.Servo, temp_direction: Muse21.ServoDirection, temp_output: number) {
    if (temp_direction == Muse21.ServoDirection.clockwise) {
      temp_output += 100;
    } else {
      temp_output = -temp_output + 100;
    }
    serial.writeLine("(AT+mqttPub?topic=" + temp_topic + "&payload=" + "#3" + temp_pin +
      (temp_output < 10 ?
        "000" + temp_output.toString()
        :
        (temp_output < 100 ?
          "00" + temp_output.toString()
          :
          "0" + temp_output.toString()
        )
      )
      + ")");
  }

  //%subcategory=More
  //%blockId=muselab_mqtt_send_Motor
  //% block="MQTT send Motor command to |Topic %temp_topic %temp_motor Direction %temp_direction Speed %temp_output"
  //% temp_output.min=0 temp_output.max=1023
  //% weight=35
  //% group="MQTT"
  export function mqttSendMotor(temp_topic: string, temp_motor: MuseRover.Motors, temp_direction: Muse21.ServoDirection, temp_output: number) {
    serial.writeLine("(AT+mqttPub?topic=" + temp_topic + "&payload=" + "#4" + (temp_motor).toString() + (temp_direction).toString() +
      (temp_output < 10 ?
        "000" + temp_output.toString()
        :
        (temp_output < 100 ?
          "00" + temp_output.toString()
          :
          (temp_output < 1000 ?
            "0" + temp_output.toString()
            :
            temp_output.toString()
          )
        )
      )
      + ")");
  }

  //%subcategory=More
  //%blockId=muselab_mqtt_send_bothMotor
  //% block="MQTT send Motor command to |Topic %temp_topic Direction1 %temp_direction1 Speed1 %temp_output1 Direction2 %temp_direction2 Speed2 %temp_output2"
  //% temp_output1.min=0 temp_output1.max=1023 temp_output2.min=0 temp_output2.max=1023
  //% weight=34
  //% group="MQTT"
  export function mqttSendMotor_2(temp_topic: string, temp_direction1: Muse21.ServoDirection, temp_output1: number, temp_direction2: Muse21.ServoDirection, temp_output2: number) {
    serial.writeLine("(AT+mqttPub?topic=" + temp_topic + "&payload=" + "#5" + (temp_direction1).toString() +
      (temp_output1 < 10 ?
        "000" + temp_output1.toString()
        :
        (temp_output1 < 100 ?
          "00" + temp_output1.toString()
          :
          (temp_output1 < 1000 ?
            "0" + temp_output1.toString()
            :
            temp_output1.toString()
          )
        )
      )
      + (temp_direction2).toString() +
      (temp_output2 < 10 ?
        "000" + temp_output2.toString()
        :
        (temp_output2 < 100 ?
          "00" + temp_output2.toString()
          :
          (temp_output2 < 1000 ?
            "0" + temp_output2.toString()
            :
            temp_output2.toString()
          )
        )
      )
      + ")");
  }






  // -------------- 6. General ----------------		

  //%subcategory=More
  //%blockId=muselab_battery
  //%block="Get battery level"
  //% blockGap=7		
  //% group="Booster"
  export function sendBattery(): void {
    serial.writeLine("(AT+battery)");
  }

  //%subcategory=More
  //%blockId=muselab_version
  //%block="Get firmware version"
  //% blockGap=7
  //% group="Booster"
  export function sendVersion(): void {
    serial.writeLine("(AT+version)");
  }

  //%subcategory=More
  //%blockId=muselab_at
  //%block="Send AT command %command"
  //% blockGap=7
  //% group="Booster"		
  export function sendAT(command: string): void {
    serial.writeLine(command);
    flag = false
  }

  //%subcategory=More
  //%blockId=muselab_test
  //%block="Send AT test"
  //% blockGap=7
  //% group="Booster"
  export function sendTest(): void {
    serial.writeLine("(AT+testing)");
  }

  //%subcategory=More
  //%blockId=muselab_deep_sleep
  //%block="Set deep sleep %second| second"
  //% blockGap=7
  //% group="Booster"
  export function setDeepSleep(second: number): void {
    serial.writeLine("(AT+deepsleep?time=" + second + ")");
  }

  //%subcategory=More
  //%blockId=muselab_forever_sleep
  //%block="Soft trun off"
  //% group="Booster"
  export function setTurnOff(): void {
    serial.writeLine("(AT+deepsleep?time=0)");
  }

}
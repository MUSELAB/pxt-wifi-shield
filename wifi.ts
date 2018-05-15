namespace MuseIoT {
	let flag = true;
	let httpReturnArray: string[] = []
	
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
	
	// -------------- 1. Initialization ----------------
    //%blockId=muselab_initialize_wifi
    //%block="Initialize WiFi IoT Shield and OLED"
	//% weight=90	
	//% blockGap=7	
    export function initializeWifi(): void {
        serial.redirect(SerialPin.P16, SerialPin.P8, BaudRate.BaudRate115200);
        MuseOLED.init(32, 128)
        
        serial.onDataReceived(serial.delimiters(Delimiters.NewLine), () => {
            let temp = serial.readLine()
            let tempDeleteFirstCharacter = ""

            if (temp.charAt(0).compare("#") == 0) {
                tempDeleteFirstCharacter = temp.substr(1, 20)
                httpReturnArray.push(tempDeleteFirstCharacter)
            }else if (temp.charAt(0).compare("*") == 0) {
				
				let mode = temp.substr(1, 1)
				let intensity = 0
				let pin = 0

				if (mode == "0"){	//digital
					pin = parseInt(temp.substr(3, 2))
					intensity = parseInt(temp.substr(2, 1))					
					pins.digitalWritePin(pin, intensity)
				}else if (mode == "1"){ //pwm
					pin = parseInt(temp.substr(5, 2))
					intensity = pins.map(parseInt(temp.substr(2, 3)),100,900,0,1023) 
					pins.analogWritePin(pin, intensity)					
				}else if (mode == "2"){ //servo
					pin = parseInt(temp.substr(5, 2))
					intensity = pins.map(parseInt(temp.substr(2, 3)),100,900,0,180) 
					pins.servoWritePin(pin, intensity)
				}
				
				//basic.showNumber(pin)
				//basic.showNumber(intensity)
				                
            }else{
                MuseOLED.showString(temp)
            }
        })
    }
	
	// -------------- 2. WiFi ----------------
    //% blockId=muselab_set_wifi
	//% block="Set wifi to ssid %ssid| pwd %pwd"   
	//% weight=80	
    export function setWifi(ssid: string, pwd: string): void {
        serial.writeLine("(AT+wifi?ssid="+ssid+"&pwd="+pwd+")"); 
    }

	// -------------- 3. Cloud ----------------
    //% blockId=muselab_set_thingspeak
	//% block="Send ThingSpeak key* %key|field1 %field1|field2 %field2|field3 %field3"
	//% weight=70	
	//% blockGap=7	
    export function sendThingspeak(key: string, field1: number, field2: number, field3: number): void {
        serial.writeLine("(AT+thingspeak?key=" + key+"&field1="+field1+"&field2="+field2+"&field3="+field3+")"); 
    }
	
    //% blockId=muselab_set_ifttt
	//% block="Send IFTTT key* %key|event_name* %event|value1 %value1|value2 %value2|value3 %value3"
	//% weight=60
	//% blockGap=7		
    export function sendIFTTT(key: string, eventname: string, value1: number, value2: number, value3: number): void {
        serial.writeLine("(AT+ifttt?key=" + key+"&event="+eventname+"&value1="+value1+"&value2="+value2+"&value3="+value3+")"); 
    }

    //% blockId=muselab_set_arcgis
	//% block="Send ArcGIS Online feature function %arcgisfunction|Server name* %servername|Service ID* %featureserviceid|Layer Name* %layername|Location X* %x|Location Y* %y|sensor_type %sensortype|sensor_id %sensorid|sensor_reading %reading|objectid(For update only) %objectid"
	//% weight=59	
    export function sendArcgis(arcgisfunction: arcgisFunction, servername: string, featureserviceid: string, layername: string, x: string, y: string, sensortype: string, sensorid: string, reading: number, objectid: number): void {
		switch(arcgisfunction){
			case arcgisFunction.add:
                serial.writeLine("(AT+arcgis?arcgisfunction=add&servername="+servername+"&featureserviceid="+featureserviceid+"&layername="+layername+"&reading="+reading+"&sensortype="+sensortype+"&sensorid="+sensorid+"&x="+x+"&y="+y+")"); 
                break
            case arcgisFunction.update:
                serial.writeLine("(AT+arcgis?arcgisfunction=update&servername="+servername+"&featureserviceid="+featureserviceid+"&layername="+layername+"&objectid=" + objectid +"&reading="+reading+"&sensortype="+sensortype+"&sensorid="+sensorid+"&x="+x+"&y="+y+")"); 
                break
		}
    }
	
	// -------------- 4. Others ----------------
	//% blockId=muselab_set_wifi_hotspot
	//% block="Set hotspot to ssid %ssid| pwd %pwd"   
	//% weight=58	
	//% blockGap=7	
    export function setWifiHotspot(ssid: string, pwd: string): void {
        serial.writeLine("(AT+wifi_hotspot?ssid="+ssid+"&pwd="+pwd+")"); 
    }
	
    //%blockId=muselab_start_server
    //%block="Start WiFi remote control"
	//% weight=55
	//% blockGap=7		
    export function startWebServer(): void {
		flag = true
		serial.writeLine("(AT+startWebServer)")
		while(flag) {
			serial.writeLine("(AT+write_sensor_data?p0=" + pins.analogReadPin(AnalogPin.P0) + "&p1=" + pins.analogReadPin(AnalogPin.P1) + "&p2=" + pins.analogReadPin(AnalogPin.P2) + ")")
			basic.pause(500)
			if(!flag)
				break;
		}
		
    }
	
    //%blockId=muselab_initialize_wifi_normal
    //%block="Initialize WiFi IoT Shield"
	//% weight=54	
    export function initializeWifiNormal(): void {
        serial.redirect(SerialPin.P16,SerialPin.P8,BaudRate.BaudRate115200);
    }
	
	// -------------- 5. Advanced Wifi ----------------
	
	//%subcategory=More
    //%blockId=muselab_generic_http
    //% block="Send generic HTTP method %method| http://%url| header %header| body %body"
    //% weight=46   
	//% blockGap=7	
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
    //% weight=45
    
    export function getGenericHttpReturn(): Array<string> {
        return httpReturnArray;
    }
	
	//%subcategory=More
    //%blockId=muselab_muse_mqtt
    //%block="Connect to Muse MQTT server"
	//% weight=44
	//% blockGap=7	
    export function connectMuseMQTT(): void {
        serial.writeLine("(AT+startMQTT?host=13.58.53.42&port=1883&clientId=100&username=omlxmgsy&password=AoGUfQNPkeSH)");
		while(true) {
			serial.writeLine("(AT+write_sensor_data?p0=" + pins.analogReadPin(AnalogPin.P0) + "&p1=" + pins.analogReadPin(AnalogPin.P1) + "&p2=" + pins.analogReadPin(AnalogPin.P2) + ")")
			basic.pause(500)
		}
    }
	
	//%subcategory=More
	//% blockId=muselab_general_mqtt
	//% block="Connect MQTT server %host| port %port| client id %clientId| username %username| password %pwd"
	//% weight=43
	//% blockGap=7	
    export function connectgeneralMQTT(host: string, port: string, clientId: string, username: string, pwd: string): void {
        serial.writeLine("(AT+startMQTT?host="+host+"&port="+port+"&clientId="+clientId+"&username="+username+"&password="+pwd+")");
    }
	
	//%subcategory=More
    //%blockId=muselab_mqtt_publish
    //% block="MQTT publish topic %topic| payload %payload"
	//% weight=42	
	//% blockGap=7	
    export function mqttPublish(topic: string, payload: string): void {
        serial.writeLine("(AT+mqttPub?topic="+topic+"&payload="+payload+")");
    }	
	
	//%subcategory=More
    //%blockId=muselab_mqtt_subscribe
    //% block="MQTT subscribe topic %topic"
	//% weight=41	
    export function mqttSubscribe(topic: string): void {
        serial.writeLine("(AT+mqttSub?topic="+topic+")");
    }	
	
	// -------------- 6. General ----------------		

	//%subcategory=More
    //%blockId=muselab_battery
    //%block="Get battery level"
	//% weight=40
	//% blockGap=7		
	
    export function sendBattery(): void {
        serial.writeLine("(AT+battery)");
    }	
	
	//%subcategory=More
    //%blockId=muselab_version
    //%block="Get firmware version"
	//% weight=39	
	//% blockGap=7		
    export function sendVersion(): void {
        serial.writeLine("(AT+version)");
    }
	
	//%subcategory=More
    //%blockId=muselab_at
    //%block="Send AT command %command"
	//% weight=30	
	//% blockGap=7		
    export function sendAT(command: string): void {
        serial.writeLine(command);
		flag = false
    }
	
	//%subcategory=More
    //%blockId=muselab_test
    //%block="Send AT test"
	//% weight=20	
	//% blockGap=7		
    export function sendTest(): void {
        serial.writeLine("(AT+testing)");
    }
	
	//%subcategory=More
    //%blockId=muselab_deep_sleep
    //%block="Set deep sleep %second| second"
	//% weight=15	
	//% blockGap=7	
    export function setDeepSleep(second: number): void {
        serial.writeLine("(AT+deepsleep?time="+second+")");
    }	
	
	//%subcategory=More
    //%blockId=muselab_forever_sleep
    //%block="Soft trun off"
	//% weight=14	
    export function setTurnOff(): void {
        serial.writeLine("(AT+deepsleep?time=0)");
    }	

}
# Muselab IOT Shield

A PXT library for Muse IOT Shield

## Blocks

### 1. Initialize WiFi IoT Shield

Sets up the Muselab WiFi IoT Shield used for the micro:bit.

```blocks
MuseIoT.initializeWifi()
```

### 2. Set WiFi

Connect the Muselab WiFi IoT Shield to the WiFi (Home router)

```blocks
MuseIoT.setWifi("muselab", "12345678")
```

Here we take "muselab" as router SSID and "12345678" as router password.


### 3. Set WiFi hotspot

Configure the Muselab WiFi IoT Shield as a hotspot.

```blocks
MuseIoT.setWifiHotspot("muselab", "12345678")
```

For the hotspot, here we take "muselab" as SSID and "12345678" as password.


### 4. Connect to ThingSpeak

Upload data to ThingSpeak

```blocks
MuseIoT.sendThingspeak("asdasdasdasdasdasd", 0, 0)
```

Here we take "asdasdasdasdasdasd" as the ThingSpeak key, 0 as field1 value and 0 as field2 value.


### 5. Connect to IFTTT

Trigger the IFTTT cloud event such as email, sms and so on.

```blocks
    MuseIoT.sendIFTTT(
    "asdasdasdasdasdasd",
    "email",
    0,
    0
    )
```

Here we take "asdasdasdasdasdasd" as IFTTT key, email as event name, 0 as value1 and 0 as value2.

## License

MIT

## Supported targets

* for PXT/calliope
* for PXT/microbit

(The metadata above is needed for package search.)


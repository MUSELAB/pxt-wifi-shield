serial.onDataReceived(serial.delimiters(Delimiters.NewLine), () => {
    MuseOLED.writeString(serial.readLine())
})
input.onButtonPressed(Button.AB, () => {
    MuseIOT.setWifi("muselab", "12345678")
})
input.onButtonPressed(Button.A, () => {
    MuseIOT.sendThingspeak("XXXXXXXXXXXXXX", 80, 0)
})
input.onButtonPressed(Button.B, () => {
    MuseIOT.sendIFTTT(
    "XXXXXXXXXXXXXXXXXX",
    "email",
    0,
    0
    )
})
input.onPinPressed(TouchPin.P0, () => {
    MuseIOT.sendBattery()
})
input.onPinPressed(TouchPin.P1, () => {
    MuseIOT.sendTest()
})
input.onPinPressed(TouchPin.P2, () => {
    MuseIOT.controlServo(5, 100)
})
basic.showIcon(IconNames.Angry)
MuseOLED.init()
MuseIOT.initializeWifi()
basic.forever(() => {
	
})
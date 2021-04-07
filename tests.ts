serial.onDataReceived(serial.delimiters(Delimiters.NewLine), () => {
    MuseOLED.writeString(serial.readLine())
})
input.onButtonPressed(Button.AB, () => {
    MuseIoT.setWifi("muselab", "12345678")
})
input.onButtonPressed(Button.A, () => {
    MuseIoT.sendThingspeak("XXXXXXXXXXXXXX", 80, 0, 0)
})
input.onButtonPressed(Button.B, () => {
    MuseIoT.sendIFTTT(
        "XXXXXXXXXXXXXXXXXX",
        "email",
        0,
        0,
        0
    )
})
input.onPinPressed(TouchPin.P0, () => {
    MuseIoT.sendBattery()
})
input.onPinPressed(TouchPin.P1, () => {
    MuseIoT.sendTest()
})
// input.onPinPressed(TouchPin.P2, () => {
//     MuseIoT.controlServo(5, 100)
// })
basic.showIcon(IconNames.Angry)
MuseOLED.init()
MuseIoT.initializeWifi()
basic.forever(() => {

})
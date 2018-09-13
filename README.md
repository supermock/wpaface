# WPAFace

## How to use?

```js
const wpaFace = new WPAFace('wlan0', error => {
  if (!error) {
    wpaFace.scan((err, networks) => {
       // Network
      // {
      //     "BSSID": "5a:c3:0e:04:39:61",
      //     "Freq": 2437,
      //     "RSSI": -17,
      //     "Flags": "[WPA2-PSK-CCMP][ESS]",
      //     "SSID": "My SSID"
      // }
      console.log(err, JSON.stringify(networks, null, ' '));
    });
  } else {
    console.error('Failed on start WPAFace: %s', error);
  }
});
```

## Available methods

- ### scan((err, networks) => {})

### License

MIT
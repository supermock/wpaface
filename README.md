# WPAFace

## How to use?

```js
const wpaFace = new WPAFace('wlan0', error => {
  if (!error) {
    wpaFace.scan((err, networks) => {
      console.log(err, JSON.stringify(networks, null, ' '));
    });
  } else {
    console.error('Failed on start WPAFace: %s', error);
  }
});
```

### License

MIT
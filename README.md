# open-traffic-lights-store
Triplestore for traffic light data

run:
```bash
  node index.js | node timeseries-server/bin/timeseries-server.js -c timeseries-server/config.json
```

This implementation makes use of the [timeseries server](https://github.com/linkedtimeseries/timeseries-server).

TODO:
  * Pub sub signal group
  * Client site aanpassen

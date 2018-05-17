# open-traffic-lights-store
Triplestore for traffic light data

run:
```bash
  node index.js | node timeseries-server/bin/timeseries-server.js -c timeseries-server/config.json
```

Now you are able to fetch fragments using:

```
http://localhost:8080/RawData/latest?sg=1

http://localhost:8080/RawData/fragments?time=2018-05-16T18:21:09.005Z&sg=1
```
This implementation makes use of the [timeseries server](https://github.com/linkedtimeseries/timeseries-server).



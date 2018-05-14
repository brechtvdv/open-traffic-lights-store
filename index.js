let data = {
  "@context": {
    "generatedAt": {
      "@id": "http://www.w3.org/ns/prov#generatedAtTime",
      "@type": "http://www.w3.org/2001/XMLSchema#date"
    },
    "ex": "http://example.org#",
    "eventState": {
      "@id": "ex:eventstate",
      "@type": "@id"
    },
    "EventState": "http://example.org/eventstate/",
    "minEndTime": {
      "@id": "ex:minendtime",
      "@type": "http://www.w3.org/2001/XMLSchema#date"
    },
    "maxEndTime": {
      "@id": "ex:maxendtime",
      "@type": "http://www.w3.org/2001/XMLSchema#date"
    },
    "fragmentGroup": "ex:fragmentGroup"
  },
  "@id": "http://example.org/signalgroups/1?time=2012-04-09T...",
  "generatedAt": "2012-04-09",
  "fragmentGroup": "http://example.org/signalgroups/1",
  "@graph": [
    {
      "@id": "http://example.org/signalgroups/1",
      "@type": "ex:signalgroup",
      "eventState": "EventState:stop-And-Remain",
      "minEndTime": "2012-04-09",
      "maxEndTime": "2012-04-09"
    } 
  ]
}

let interval = setInterval(function(){
  console.log(JSON.stringify(data));
}, 1000);

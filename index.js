let data = [{
  "@context": {
    "generatedAt": {
      "@id": "http://www.w3.org/ns/prov#generatedAtTime",
      "@type": "http://www.w3.org/2001/XMLSchema#date"
    },
    "ex": "http://example.org#",
    "EventState": "http://example.org/eventstate/",
    "eventState": {
      "@id": "ex:eventstate",
      "@type": "EventState"
    },
    "minEndTime": {
      "@id": "ex:minendtime",
      "@type": "http://www.w3.org/2001/XMLSchema#date"
    },
    "maxEndTime": {
      "@id": "ex:maxendtime",
      "@type": "http://www.w3.org/2001/XMLSchema#date"
    },
    "fragmentGroup": "ex:fragmentGroup",
    "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
  },
  "@id": "http://example.org/signalgroup/1?time=2018-05-16T18:21:09.005Z",
  "generatedAt": "2018-05-16T18:21:09.005Z",
  "@graph": [{
    "@id": "http://example.org/signalgroup/1",
    "@type": "ex:signalgroup",
    "eventState": {
      "@id": "http://example.org/eventstate/stop-And-Remain",
      "@type": "EventState",
      "rdfs:label": "stop-And-Remain"
    },
    "minEndTime": "2018-05-16T18:21:26.605Z",
    "maxEndTime": "2018-05-16T18:21:26.605Z"
  }]
},
{
  "@context": {
    "generatedAt": {
      "@id": "http://www.w3.org/ns/prov#generatedAtTime",
      "@type": "http://www.w3.org/2001/XMLSchema#date"
    },
    "ex": "http://example.org#",
    "EventState": "http://example.org/eventstate/",
    "eventState": {
      "@id": "ex:eventstate",
      "@type": "EventState"
    },
    "minEndTime": {
      "@id": "ex:minendtime",
      "@type": "http://www.w3.org/2001/XMLSchema#date"
    },
    "maxEndTime": {
      "@id": "ex:maxendtime",
      "@type": "http://www.w3.org/2001/XMLSchema#date"
    },
    "fragmentGroup": "ex:fragmentGroup",
    "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
  },
  "@id": "http://example.org/signalgroup/2?time=2018-05-16T18:21:09.005Z",
  "generatedAt": "2018-05-16T18:21:09.005Z",
  "@graph": [{
    "@id": "http://example.org/signalgroup/2",
    "@type": "ex:signalgroup",
    "eventState": {
      "@id": "http://example.org/eventstate/stop-And-Remain",
      "@type": "EventState",
      "rdfs:label": "stop-And-Remain"
    },
    "minEndTime": "2018-05-16T18:21:26.605Z",
    "maxEndTime": "2018-05-16T18:21:26.605Z"
  }]
}];

let next = 0
let interval = setInterval(function(){
  console.log(JSON.stringify(data[next++ % data.length]));
}, 1000);

const CommunicationManager = require('../lib/CommunicationManager');
const Configuration = require('../lib/Configuration');
const DataEventManager = require('../lib/DataEventManager');

try {
  // Read config file
  let config = Configuration.getConfig(process.argv);
  // Init Communication Manager module
  let commManager = new CommunicationManager(config);

  // Load multidimensional interfaces
  loadInterfaceModules(config.interfaces, commManager);

  //Listen for data on standard input
  let stdin = process.openStdin();
  stdin.on('data', chunk => {
    let split = chunk.toString().split('\n');
    for (var i = 0; i < split.length - 1; i++) {
          //console.log("start" + split[i] + "einde")
      // Launch data event towards predifined interfaces through Data Event Manager module
      DataEventManager.push('data', split[i]);
    }
  });

  // Launch Web server for polling interfaces
  let app = commManager.app;
  let router = commManager.router;
  app.use(router.routes()).use(router.allowedMethods());
  app.listen(config.httpPort);

} catch (e) {
  console.error(e);
  process.exit(1);
}

function loadInterfaceModules(interfaces, commManager) {
  for (let i in interfaces) {
    let Interface = require(interfaces[i].path); new Interface(interfaces[i], commManager);
  }
}

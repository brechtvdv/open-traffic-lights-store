const MultidimensionalInterface = require('../../lib/MultidimensionalInterface');
const Utils = require('../../lib/Utils');
const md5 = require('md5');
const jsonld = require('jsonld');
const fs = require('fs');

class RawData extends MultidimensionalInterface {

  constructor(config, commMan) {
    super(commMan);
    this._serverUrl = super.commMan.config.serverUrl;
    this._name = config.name;
    this._websocket = config.websocket;
    this._fragmentsPath = config.fragmentsPath;
    this._fragmentMaxSize = config.maxFileSize;
    this._staticTriples = config.staticTriples != '' ? this.fetchStaticTriples(config.staticTriples) : '';
    //this._lastFragment = null;
    this._maxMinutesPerFile = config.maxMinutes;
    this._lastGat = null;
    this._fragment_map = {};

    // Load HTTP interfaces for this interface
    this.setupPollInterfaces();

    // Load Websocket interface
    if (this.websocket) {
      super.setupPubsupInterface(this.name, config.wsPort);
    }

    // Init storage folder
    Utils.createFolder(this._fragmentsPath);
  }

  async onData(data) {
    try {
      let jsonld_data = JSON.parse(data)
      // The data comes in as stringified jsonld, so we have to parse it and we can use the jsonld
      // library to convert this to N-Quads.
      this.latestData =  await jsonld.toRDF(jsonld_data);
      this.lastGat = await Utils.getGeneratedAtTimeValue(this.latestData);  

      // Store data in files according to config to keep historic data
      this.storeData(jsonld_data["@id"].split("\/").splice(-1)[0].split("?")[0]);
    } catch (e) {
      console.log(e);
    }
  }

  setupPollInterfaces() {
    let self = this;

    // HTTP interface to get the latest data update
    super.commMan.router.get('/' + this.name + '/latest', async (ctx, next) => {
      ctx.response.set({ 'Access-Control-Allow-Origin': '*' });
      let signal_group = ctx.query.sg;

      if (!(signal_group in self._fragment_map)) {
        ctx.response.status = 404;
        ctx.response.body = "No data found";
      } else {
        let signal_group_fragment = this._fragment_map[signal_group];
        let etag = 'W/"' + md5(signal_group_fragment.lastGat) + '"';
        let ifNoneMatchHeader = ctx.request.header['if-none-match'];
        let last_modified = signal_group_fragment.lastGat;
        // First we search for all fragments of this signal group
        let fragments = Utils.getAllFragments(this._fragmentsPath).filter((file) => { return file.startsWith("signalgroup_" + signal_group); }).sort();
        // Take index +1 of the last fragment to have a previous link
        let index = fragments.length;
        let metaData = await this.createMetadata(last_modified, signal_group, index, fragments);
        //let maxage = self.ldfs.calculateMaxAge();
        //let expires = self.ldfs.calculateExpires();

        if (ifNoneMatchHeader && ifNoneMatchHeader === etag) {
          ctx.response.status = 304;
        } else {
          ctx.response.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Access-Control-Allow-Origin': '*',
            'ETag': etag,
            'Content-Type': 'application/trig'
          });
          let dataTriples = await Utils.nQuadsToTrig(signal_group_fragment.latestData);
          ctx.response.body = this._staticTriples.concat('\n' + dataTriples, '\n' + metaData);
        }
      }
    });

    // HTTP interface to get a specific fragment of data (historic data)
    super.commMan.router.get('/' + this.name + '/fragments', async (ctx, next) => {
      let queryTime = ctx.query.time ? new Date(ctx.query.time) : new Date(this._lastGat);
      let signal_group = ctx.query.sg;
      if (!(signal_group)) {
        ctx.response.status = 404;
        ctx.response.body = "No data found";
      } else {
        // First we search for all fragments of this signal group
        let fragments = Utils.getAllFragments(this._fragmentsPath).filter((file) => { return file.startsWith("signalgroup_" + signal_group); }).sort();
        // Then we search in which file the requested time falls 
        let target_file = null;
        let index = 0;
        let time = 0;
        for(let file = fragments.length - 1; file >= 0; file--){
          time = new Date(fragments[file].split("signalgroup_" + signal_group + "-")[1].split(".trig")[0]);
          if(time <= queryTime){
            target_file = fragments[file];
            index = file;
            break;
          }
        }

        let staticTriples = this._staticTriples;
        let dataTriples = await fs.readFileSync(this._fragmentsPath + "/" + target_file);
        let metaData = await this.createMetadata(time, signal_group, index, fragments);
        let maxage = 120;
        let etag = 'W/"' + md5(fragments) + '"';
        ctx.response.body = staticTriples.concat('\n' + dataTriples, '\n' + metaData);

        ctx.response.set({
          
          'Cache-Control': 'public, s-maxage=' + (maxage - 1) + ', max-age=' + maxage,
          // ', must-revalidate',
          // 'Expires': expires,
          'ETag': etag,
          'Content-Type': 'application/trig',
          'Access-Control-Allow-Origin': '*' 
        });
      }
    });
  }

  async storeData(signal_group) {
    // Create a mapping for new groups
    if(!(signal_group in this._fragment_map))
      this._fragment_map[signal_group] = { lastFragment: null, startTime: null, lastGat: null, latestData: null};
    
    let signal_group_fragment = this._fragment_map[signal_group]

    // Create a new file if needed
    if (signal_group_fragment.startTime === null || (((this.lastGat - signal_group_fragment.startTime) % 86400000) % 3600000) / 60000 > this._maxMinutesPerFile) {
      // Create new fragment
      signal_group_fragment.lastFragment = this.fragmentsPath + '/signalgroup\_' 
        + signal_group + '-' + this.lastGat.toISOString() + '.trig';
      signal_group_fragment.startTime = this.lastGat;
    }
    //console.log(this.latestData)
    await Utils.appendToFile(signal_group_fragment.lastFragment, this.latestData);
    signal_group_fragment.lastGat = this.lastGat;
    signal_group_fragment.latestData = this.latestData;
  }

  async createMetadata(time, signal_group, index, fragments) {
    let baseUri = this.serverUrl + this.name + '/fragments';
    let subject = baseUri + '?time=' + time.toISOString() + '&sg=' + signal_group;
    let quads = [];

    if (index > 0) {
      // Adding hydra:previous link
      let previous = fragments[index - 1];

      quads.push({
        subject: subject,
        predicate: 'http://www.w3.org/ns/hydra/core#previous',
        object: baseUri + '?time=' + previous.split("signalgroup_" + signal_group + "-")[1].split(".trig")[0] + '&sg=' + signal_group,
        graph: '#Metadata'
      });
    }

    // Add license
    quads.push({
        subject: subject,
        predicate: 'http://creativecommons.org/ns#license',
        object: 'https://creativecommons.org/publicdomain/zero/1.0/',
        graph: '#Metadata'
      });

    return await Utils.formatTriples('application/trig', quads);
  }

  async fetchStaticTriples(path) {
    return await Utils.getTriplesFromFile(path);
  }

  get serverUrl() {
    return this._serverUrl;
  }

  get name() {
    return this._name;
  }

  get websocket() {
    return this._websocket;
  }

  get fragmentsPath() {
    return this._fragmentsPath;
  }

  get fragmentMaxSize() {
    return this._fragmentMaxSize;
  }

  get staticTriples() {
    return this._staticTriples;
  }

  get lastFragment() {
    return this._lastFragment;
  }

  set lastFragment(frg) {
    this._lastFragment = frg;
  }

  get lastGat() {
    return this._lastGat;
  }

  set lastGat(gat) {
    this._lastGat = gat;
  }
}

module.exports = RawData;

const fs = require('fs');
const n3 = require('n3');
const nquad_parser = n3.Parser({format: 'application/n-quads'});
// const writer = n3.Writer(process.stdout, {prefixes: {}});
const util = require('util');
const n3Util = n3.Util
const { DataFactory } = n3
const { namedNode, literal, defaultGraph, quad } = DataFactory;
const constructor_map = {
  "NamedNode": namedNode,
  "Literal": literal,
  "DefaultGraph": defaultGraph,
  "Quad": quad
}

const readfile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const appendFile = util.promisify(fs.appendFile);

const jsonld = require('jsonld');

module.exports = new class Utils {

  exists(path) {
    return fs.existsSync(path);
  }

  createFolder(path) {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
  }

  async getFileContent(path) {
    return await readfile(path);
  }

  async overwriteFile(path, data) {
    return await writeFile(path, data);
  }

  async nQuadsToTrig(n_quads){
    let writer = n3.Writer({ prefixes: {} });
    console.log(n_quads);

    for(let triple of n_quads){
      writer.addQuad(
        constructor_map[triple.subject.termType](triple.subject.value),
        constructor_map[triple.predicate.termType](triple.predicate.value),
        constructor_map[triple.object.termType](triple.object.value),
        constructor_map[triple.graph.termType](triple.graph.value)
      );
    }

    return new Promise(resolve => {
      writer.end((error, result) => {
        console.log(result);
        resolve(result);
      })});
  }

  async appendToFile(path, data) {
    let trig_string =  await this.nQuadsToTrig(data);
    return await appendFile(path, JSON.stringify(trig_string));
  }

  getGeneratedAtTimeValue(rdf) {
    for(let triple of rdf){
      if(triple.predicate.value === "http://www.w3.org/ns/prov#generatedAtTime")
        return triple.object.value;
        //return new Date(n3Util.getLiteralValue(triple.object.value));
    }
  }

  getSignalGroup(rdf){
    for(let triple of rdf){
      console.log(triple.predicate);
      if(triple.predicate.value === "http://example.org#fragmentGroup")
        return triple.object.value.split("\/").slice(-1)[0];
        //return new Date(n3Util.getLiteralValue(triple.object.value));
    }
  }

  getAllFragments(path) {
    return fs.readdirSync(path);
  }

  dateBinarySearch(target, fragments) {
    let min = 0;
    let max = fragments.length - 1;
    let index = null;

    // Checking that target date is contained in the list of fragments.
    if (target <= fragments[min]) {
      index = min;
    } else if (target >= fragments[max]) {
      index = max;
    } else {
      // Perform binary search to find the fragment that contains the target date.
      while (index === null) {
        // Divide the array in half
        let mid = Math.floor((min + max) / 2);
        // Target date is in the right half
        if (target > fragments[mid]) {
          if (target < fragments[mid + 1]) {
            index = mid;
          } else if (target === fragments[mid + 1]) {
            index = mid + 1;
          } else {
            // Not found yet proceed to divide further this half in 2.
            min = mid;
          }
          // Target date is exactly equals to the middle fragment
        } else if (target === fragments[mid]) {
          index = mid;
          // Target date is on the left half
        } else {
          if (target >= fragments[mid - 1]) {
            index = mid - 1;
          } else {
            max = mid;
          }
        }
      }
    }

    return [new Date(fragments[index]), index];
  }

  getTriplesFromFile(path) {
    return new Promise(async (resolve, reject) => {
      let parser = n3.Parser();
      let triples = [];

      parser.parse((await readfile(path)).toString(), (err, triple, prefixes) => {
        if(triple) {
          triples.push(triple);
        } else {
          resolve([prefixes, triples]);
        }
      });
    });
  }

  getTriplesFromString(text) {
    return new Promise(async (resolve, reject) => {
      let parser = n3.Parser();
      let triples = [];

      parser.parse(text, (err, triple, prefixes) => {
        if(triple) {
          triples.push(triple);
        } else {
          resolve([prefixes, triples]);
        }
      });
    });
  }

  formatTriples(format, triples, prefixes) {
    return new Promise((resolve, reject) => {
      let writer = n3.Writer({
        prefixes: prefixes,
        format: format
      });

      writer.addQuad(triples);

      writer.end((err, res) => {
        if(err) reject(err);
        resolve(res);
      });
    });
  }

  getFragmentsCount(path) {
    return fs.readdirSync(path).length;
  }

  getLiteralValue(literal) {
    return n3.Util.getLiteralValue(literal);
  }

  getTriplesBySPOG(array, s, p, o, g) {
    let temp = array;

    if(s) {
      temp = temp.filter(t => t.subject === s);
    }

    if(p) {
      temp = temp.filter(t => t.predicate === p);
    }

    if(o) {
      temp = temp.filter(t => t.object === o);
    }

    if(g) {
      temp = temp.filter(t => t.graph === g);
    }

    return temp;
  }
}

const NODE_PATH = './node_modules/';
const ARLAS_WEB_COMPONENT_PACKAGEJSON = `${NODE_PATH}/arlas-web-components/package.json`;
const MAPBOX_TYPE_LIB_PATH = `${NODE_PATH}/@types/mapbox-gl`;
const MAPBOX_LIB_PATH = `${NODE_PATH}/mapbox-gl`;
const MAPLIBRE_LIB_PATH = `${NODE_PATH}/maplibre-gl`;
const ENV_FIL_PATH = `./src/environments/`;
const PROD_ENV_FILE = `${ENV_FIL_PATH}environment.prod.ts`;


const cliProgress = require('cli-progress');
const bar1 = new cliProgress.SingleBar({format: 'progress [{bar}] {percentage}%  | Step: {step}', linewrap: true,}, cliProgress.Presets.shades_classic);
bar1.start(100, 0,{step: ''})

const fs =  require("fs");
const mapProvider = process.argv[2].split("=")[1];

bar1.update(10, {step: `Provider selected :${mapProvider}`});


if(mapProvider !== "mapbox" && mapProvider !== "maplibre") {
  throw  new Error('wrong provider: ' + mapProvider)
}
let file
try {
  file = fs.readFileSync(ARLAS_WEB_COMPONENT_PACKAGEJSON);
  bar1.update(30, {step: 'opening arlas package json'})
} catch (e){
  console.error('arlas-web-components not found');
}
bar1.update(40, {step: 'parsing package json'})
const packageJson = JSON.parse(file.toString());

if(mapProvider === "maplibre") {
  const libDeleted = testIfMapBoxLibDeleted();
  const canWriteEnvVariable= !packageJson.dependencies.hasOwnProperty('mapbox-gl') && libDeleted;
  if(canWriteEnvVariable) {
    writeToAngularEnvFileProd(mapProvider)
  } else {
    bar1.stop();
    throw Error('@type/mapbox-gl and mapbox-gl packages should noy exist');
  }
}

if(mapProvider === "mapbox") {
  const libDeleted = testIfMaplibreLibDeleted();
  const canWriteEnvVariable= libDeleted && !packageJson.dependencies.hasOwnProperty('maplibre-gl');
  if(canWriteEnvVariable){
    writeToAngularEnvFileProd(mapProvider)
  } else {
    bar1.stop();
    throw Error('maplibre-gl package should noy exist')
  }
}

function testIfMapBoxLibDeleted() {
  let typeLibDeleted = false;
  try {
    fs.statSync(MAPBOX_TYPE_LIB_PATH);
  } catch (e) {
    typeLibDeleted = !typeLibDeleted;
  }
  let libDeleted = false
  try {
   fs.statSync(MAPBOX_LIB_PATH);
  } catch (e) {
    libDeleted = !libDeleted;
  }
  return typeLibDeleted && libDeleted;
}

function testIfMaplibreLibDeleted() {
  let libDeleted = false;
  try {
    fs.statSync(MAPLIBRE_LIB_PATH);
  } catch (e) {
    libDeleted = !libDeleted;
  }
  return libDeleted;
}

function writeToAngularEnvFileProd(mapProvider){
  bar1.update(45, {step: 'reading env file'})
  const file = fs.readFileSync(PROD_ENV_FILE);
  const expression = file.toString().split('=')[0];
  const values =  file.toString().split('=')[1];
   const newValues = formatString(values);
  bar1.update(60, {step: 'update map provider value'})
  const keysValues = updateMapProviderValue(newValues, mapProvider);
  bar1.update(90, {step: 'write new env file'})
  const finaleValue = recreateEnvVariable(keysValues);
  writeToProdEnvFile(expression, finaleValue)
  bar1.update(100, {step: 'write to env file end'})
  bar1.stop();
}

function formatString(values){
  let x  = values.replace(';', '')
  x  = x.replaceAll(/\s/img, '').trim();
  return x.substring(1, x.length -1);
}

function recreateEnvVariable(keysValues){
  if(!keysValues) {
    throw  new Error(' Environment variable empty')
  }
  return  keysValues.reduce((k, curr, i, table) => {
    if(i === 0 || (i % 2) === 0){
      k += `\n ${curr} :`;
    } else {
      const endOfLine = (i === table.length - 1)? '' : ',';
      k+= `${curr}${endOfLine}`;
    }
    if((i % 2) !== 0) {
    //  console.log('writing value :', k)
    }
    return k
  }, '');
}

function updateMapProviderValue(values, mapProvider){
  let keysValues = values;
  if(values.includes(',')) {
    keysValues = keysValues.split(',').reduce((agg, keyvlaue ) => agg.concat(keyvlaue.split(':')), []);
  } else {
    keysValues = values.split(':');
  }

  const index = keysValues.indexOf('mapProvider');
  if(index !== -1){
    keysValues[index + 1] = `'${mapProvider}'`;
  } else {
    keysValues.push('mapProvider', `'${mapProvider}'`);
  }
  return keysValues;
}

function writeToProdEnvFile(expression, envVariable){
  if(!expression) {
    throw  new Error('Expression is empty')
  }
  if(!envVariable) {
    throw  new Error('No environment variable to write')
  }
  const writeToFile = `${expression} = {\n ${envVariable.toString()}\n};`;
  fs.writeFileSync(PROD_ENV_FILE, writeToFile);
}

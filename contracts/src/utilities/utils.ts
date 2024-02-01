// import fs from 'fs/promises';
// import { AccountUpdate, Mina, PrivateKey } from 'o1js';
// import { Config } from 'prettier';
// Error.stackTraceLimit = 1000;

import { Field,CircuitString, PublicKey, Struct } from "o1js";

// let configJson: any = JSON.parse(await fs.readFile('config.json', 'utf8'));
// let config = configJson.deployAliases['default'];

// const Network = Mina.Network(config.url);
// const fee = Number(config.fee) * 1e9; // in nanomina (1 billion = 1.0 mina)
// Mina.setActiveInstance(Network);

// var new_private = PrivateKey.random();

  export default  class  ElementData extends Struct({
    address: PublicKey,
    points: Field,
  }) {};
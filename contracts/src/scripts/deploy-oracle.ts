/**
 * This script can be used to interact with the Add contract, after deploying it.
 *
 * We call the update() method on the contract, create a proof and send it to the chain.
 * The endpoint that we interact with is read from your config.json.
 *
 * This simulates a user interacting with the zkApp from a browser, except that here, sending the transaction happens
 * from the script and we're using your pre-funded zkApp account to pay the transaction fee. In a real web app, the user's wallet
 * would send the transaction and pay the fee.
 *
 * To run locally:
 * Build the project: `$ npm run build`
 * Run with node:     `$ node build/src/interact.js <deployAlias>`.
 */
import fs from 'fs/promises';
import { Cache, AccountUpdate, Field, Mina, PrivateKey, fetchAccount } from 'o1js';
import { Oracle } from '../Oracle.js';
import { Transaction } from 'o1js/dist/node/lib/mina.js';

// check command line arg

let deployAlias: string = process.argv[2];
if (!deployAlias)
     throw("missing deploy alias");

Error.stackTraceLimit = 1000;

// check command line arg
let operationType: string = process.argv[3];
if (!operationType)
throw("missing operation type");



// parse config and private key from file
type Config = {
  deployAliases: Record<
    string,
    {
      url: string;
      keyPath: string;
      fee: string;
      feepayerKeyPath: string;
      feepayerAlias: string;
    }
  >;
};

const deploy = false;


let configJson: Config = JSON.parse(await fs.readFile('config.json', 'utf8'));
let config = configJson.deployAliases[deployAlias];

let feepayerKeysBase58: { privateKey: string; publicKey: string } = JSON.parse(
  await fs.readFile(config.feepayerKeyPath, 'utf8')
);

let zkAppKeysBase58: { privateKey: string; publicKey: string } = JSON.parse(
  await fs.readFile(config.keyPath, 'utf8')
);

let feepayerKey = PrivateKey.fromBase58(feepayerKeysBase58.privateKey);
let zkAppKey = PrivateKey.fromBase58(zkAppKeysBase58.privateKey);

// set up Mina instance and contract we interact with
const Network = Mina.Network(config.url);
const fee = Number(config.fee) * 1e9; // in nanomina (1 billion = 1.0 mina)
Mina.setActiveInstance(Network);
let feepayerAddress = feepayerKey.toPublicKey();
let zkAppAddress = zkAppKey.toPublicKey();

var account = await fetchAccount(zkAppAddress.toJSON());
let zkApp = new Oracle(zkAppAddress);

let sentTx;
// compile the contract to create prover keys
console.log('compile the contract...');
const cache: Cache = Cache.FileSystem("../ui/public/assets/cache/onlyoracle");
var verification_key = await Oracle.compile({ cache });

try {

  // call update() and send transaction
  console.log('build transaction and create proof to deploy...');
  var deployTxn: Transaction;

  if (account.account == undefined || account.account.publicKey.isOdd.toBoolean() == (true)) {

    console.log('create account and deploy...');
    deployTxn = await Mina.transaction({ sender: feepayerAddress, fee: fee }, () => {
      AccountUpdate.fundNewAccount(feepayerAddress);
      zkApp.deploy();
    });
    sentTx = await deployTxn.sign([feepayerKey, zkAppKey]).send();
  }
  else {
    console.log('send transaction deploy...');
    deployTxn = await Mina.transaction(feepayerAddress, () => {
      zkApp.deploy();
    });
    sentTx = await deployTxn.sign([feepayerKey, zkAppKey]).send();
  }

  if (sentTx?.hash() !== undefined) {
    console.log(`
      Success! Update transaction sent.
      
      Your smart contract state will be updated
      as soon as the transaction is included in a block:
      ${getTxnUrl(config.url, sentTx.hash())}
      `);
  }

} catch (err) {
  console.log(err);
}
if (sentTx?.hash() !== undefined) {
  console.log(`
Success! Update transaction sent.

Your smart contract state will be updated
as soon as the transaction is included in a block:
${getTxnUrl(config.url, sentTx.hash())}
`);

}

function getTxnUrl(graphQlUrl: string, txnHash: string | undefined) {
  const txnBroadcastServiceName = new URL(graphQlUrl).hostname
    .split('.')
    .filter((item) => item === 'minascan' || item === 'minaexplorer')?.[0];
  const networkName = new URL(graphQlUrl).hostname
    .split('.')
    .filter((item) => item === 'berkeley' || item === 'testworld')?.[0];
  if (txnBroadcastServiceName && networkName) {
    return `https://minascan.io/${networkName}/tx/${txnHash}?type=zk-tx`;
  }
  return `Transaction hash: ${txnHash}`;
}

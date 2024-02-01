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
import { Cache, AccountUpdate, Field, Mina, PrivateKey, fetchAccount, PublicKey } from 'o1js';
import { MyTreeContract } from '../MyTreeContract.js';
import { Transaction } from 'o1js/dist/node/lib/mina.js';
import { readValueFromTree } from '../utilities/tree-utils.js';
import { OffChainStorage } from 'experimental-offchain-zkapp-storage';
import { XMLHttpRequest as XMLHttpRequestInp } from 'xmlhttprequest-ts';
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
const NodeXMLHttpRequest = XMLHttpRequestInp as any as typeof XMLHttpRequest;
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
let zkApp = new MyTreeContract(zkAppAddress);

var treeHeight = 8;
let sentTx;
// compile the contract to create prover keys
console.log('compile the contract...');
const cache: Cache = Cache.FileSystem("../ui/public/assets/cache/onlytree");
var verification_key = await MyTreeContract.compile({ cache });

var storageServerAddress = 'http://localhost:3001';
var serverPublicKey = await OffChainStorage.getPublicKey(
    storageServerAddress,
    NodeXMLHttpRequest
    );
  

try {
  var deployTxn: Transaction;


  if (operationType  == 'update-key') {

  var publicKeyServer = PublicKey.fromBase58('B62qrm4f5Uzio1KWc4JfZTxs1fvutKU5EEHBY9CJ1hfhDtYcffpYHoW');

  deployTxn = await Mina.transaction({sender:feepayerAddress, fee: fee }, () => {
    zkApp.initState(publicKeyServer);
  });

 await  deployTxn.prove();
  sentTx = await deployTxn.sign([feepayerKey]).send();

  }
  else if (operationType  == 'deploy') {
  // call update() and send transaction
  console.log('build transaction and create proof to deploy...');

  if (account.account == undefined || account.account.publicKey.isOdd.toBoolean() == (true)) {

    console.log('create account and deploy...');
    deployTxn = await Mina.transaction({ sender: feepayerAddress, fee: fee }, () => {
      AccountUpdate.fundNewAccount(feepayerAddress);
      zkApp.deploy({});
    });
    sentTx = await deployTxn.sign([feepayerKey, zkAppKey]).send();
  }
  else {
    console.log('send transaction deploy...');
    deployTxn = await Mina.transaction(feepayerAddress, () => {
      zkApp.deploy({});
    });
    sentTx = await deployTxn.sign([feepayerKey, zkAppKey]).send();
  }
}
  else if (operationType == 'retrieve-value') {


  var publicKeyServer = PublicKey.fromBase58('B62qrm4f5Uzio1KWc4JfZTxs1fvutKU5EEHBY9CJ1hfhDtYcffpYHoW');

  console.log("account find" + account.account?.publicKey.toBase58());

  var account = await fetchAccount({publicKey: zkAppAddress});

  var rr = await readValueFromTree(
    BigInt(2),
    zkApp,
    storageServerAddress,
    publicKeyServer,
    treeHeight
  );

  console.log("data read:" + rr?.toString());
 }
 else if (operationType == 'update-version'){

  console.log('send update version...');
  deployTxn = await Mina.transaction({ sender: feepayerAddress, fee: fee }, () => {
    zkApp.account.verificationKey.set(verification_key.verificationKey);
  });
  sentTx = await deployTxn.sign([feepayerKey, zkAppKey]).send();
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

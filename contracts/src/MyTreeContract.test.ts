import { MerkleWitness8, OffChainStorage,Update } from 'experimental-offchain-zkapp-storage';
import { Permissions,CircuitString,Field, SmartContract, state, State, method, Struct, PublicKey, VerificationKey, Signature, DeployArgs, MerkleTree, Bool, PrivateKey, Mina, fetchAccount } from 'o1js';
import { MyTreeContract } from './MyTreeContract';
import fs from 'fs/promises';
import { XMLHttpRequest as XMLHttpRequestInp } from 'xmlhttprequest-ts';
import { Witness } from 'o1js/dist/node/lib/merkle_tree';
import { doUpdateTree, updateTree } from './utilities/tree-utils';


describe('Describe Three test', () => {
  const NodeXMLHttpRequest = XMLHttpRequestInp as any as typeof XMLHttpRequest;
  const treeHeight  = 8;
    let 
      feePayer: PrivateKey,
      feeAddress:PublicKey,
      zkTreePrivateKey: PrivateKey,
      zkTreePublickKey: PublicKey,
      serverPublicKey: PublicKey,
      zkTreeInstance: MyTreeContract,
      storageServerAddress: string,
      txn,
      fee:number;

      //npm i experimental-offchain-zkapp-storage installare questa!!
      //https://github.com/es92/zkApp-offchain-storage
      //https://docs.minaprotocol.com/zkapps/tutorials/offchain-storage
      beforeAll(async()=>{
        await  MyTreeContract.compile();
      });


      var prepareOnBerkery = async ()=> {

      var deployAlias='tree';
      let configJson: any = JSON.parse(await fs.readFile('config.json', 'utf8'));
      let config = configJson.deployAliases[deployAlias];

      let feepayerKeysBase58: { privateKey: string; publicKey: string } = JSON.parse(
        await fs.readFile(config.feepayerKeyPath, 'utf8')
      );

      let zkAppKeysBase58: { privateKey: string; publicKey: string } = JSON.parse(
        await fs.readFile(config.keyPath, 'utf8')
      );

      feePayer = PrivateKey.fromBase58(feepayerKeysBase58.privateKey);
      zkTreePrivateKey = PrivateKey.fromBase58(zkAppKeysBase58.privateKey);
      const Network = Mina.Network(config.url);
      fee = Number(config.fee) * 1e9; // in nanomina (1 billion = 1.0 mina)
      Mina.setActiveInstance(Network);
      feeAddress = feePayer.toPublicKey();
      zkTreePublickKey = zkTreePrivateKey.toPublicKey();

      await  fetchAccount({publicKey:feeAddress});
      await  fetchAccount({publicKey:zkTreePublickKey});
    
      //  await  fetchAccount{{publicKey:feeAddress}};


    zkTreeInstance = new  MyTreeContract(zkTreePublickKey);

    storageServerAddress = 'http://localhost:3001';
    serverPublicKey = await OffChainStorage.getPublicKey(
        storageServerAddress,
        NodeXMLHttpRequest
        );
      }

      it('Update Node on Merkle tree', async () => {

        await prepareOnBerkery();

        const  {
            priorLeafIsEmpty, 
            priorLeafNumber, 
            newLeafNumber,
            leafWitness,
            storedNewStorageNumber,
            storedNewStorageSignature}= await  updateTree(
        1101,
        BigInt(7),
        zkTreeInstance, 
        serverPublicKey,
        storageServerAddress,
        treeHeight
       );


       await doUpdateTree(
          priorLeafIsEmpty,
          priorLeafNumber,
          newLeafNumber,
          leafWitness,
          storedNewStorageNumber,
          storedNewStorageSignature,
          feePayer, fee, zkTreeInstance
       );
      } );     
     } );
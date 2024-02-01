import { MerkleWitness8, OffChainStorage,Update } from 'experimental-offchain-zkapp-storage';
//npm i experimental-offchain-zkapp-storage installare questa!!
//https://github.com/es92/zkApp-offchain-storage
//https://docs.minaprotocol.com/zkapps/tutorials/offchain-storage
import { Permissions,CircuitString,Field, SmartContract, state, State, method, Struct, PublicKey, VerificationKey, Signature, DeployArgs, MerkleTree, Bool, PrivateKey, Mina, } from 'o1js';
import { MyTreeContract } from '../MyTreeContract';
import fs from 'fs/promises';
import XMLHttpRequestTs from 'xmlhttprequest-ts';
import { Witness } from 'o1js/dist/node/lib/merkle_tree';
const NodeXMLHttpRequest = XMLHttpRequestTs.XMLHttpRequest as any as typeof XMLHttpRequest;


export const  doUpdateTree = async (
   //linkt to tree
    priorLeafIsEmpty:boolean, 
    priorLeafNumber:Field, 
    newLeafNumber: Field,
    leafWitness:MerkleWitness8,
    //linked to transaction
    storedNewStorageNumber: Field,
    storedNewStorageSignature: Signature,
    feePayerPrivateKey:PrivateKey,
    transactionFee:number,
    zkTreeInstance:MyTreeContract
    ) => {
    

    let transaction = await Mina.transaction(
        { feePayerKey: feePayerPrivateKey, fee: transactionFee },
        () => {
            zkTreeInstance.updateChangeThree(
                Bool(priorLeafIsEmpty),
                priorLeafNumber,
                newLeafNumber,
                leafWitness,
                storedNewStorageNumber,
                storedNewStorageSignature
            );
        }
      );

     await transaction.prove();
     var res = await transaction.sign([feePayerPrivateKey]).send();

      const hash = res.hash(); // This will change in a future version of o1js
      if (hash == null) {
        console.log('error sending transaction (see above)');
      } else {
        console.log(
          'See transaction at',
          'https://berkeley.minaexplorer.com/transaction/' + hash
        );

  }
}

export async function updateTree(x:number, index:bigint,
  zkTreeInstance:MyTreeContract,
  zkTreePublickKey: PublicKey,
  storageServerAddress: string,
  treeHeight: number,
  ) {

  // const index = BigInt(Math.floor(Math.random()*4));
  
  // recover tree root
  const treeRoot = await zkTreeInstance.storageTreeRoot.get();

  // field of three
  const idxfields = await OffChainStorage.get(
      storageServerAddress,
      zkTreePublickKey,
      treeHeight,
      treeRoot,
      NodeXMLHttpRequest
  );
  
  // map on Tree of idxfields
  const tree = OffChainStorage.mapToTree(treeHeight, idxfields);

  //calculate the witness for specific index
  const leafWitness = new MerkleWitness8(tree.getWitness(BigInt(index)));

  const priorLeafIsEmpty  = !idxfields.has(index);
  let priorLeafNumber: Field;
  let newLeafNumber: Field;

  if (!priorLeafIsEmpty) {
      priorLeafNumber = idxfields.get(index)![0];
      newLeafNumber = Field(x);
    } else {
      priorLeafNumber = Field(0);
      newLeafNumber = Field(x);
    }


    idxfields.set(index, [newLeafNumber]);

    const [storedNewStorageNumber, storedNewStorageSignature] = 
    await OffChainStorage.requestStore(
      storageServerAddress,
      zkTreePublickKey,
      treeHeight,
      idxfields,
      NodeXMLHttpRequest
    );

    console.log(
      'changing index',
      index,
      'from',
      priorLeafNumber.toString(),
      'to',
      newLeafNumber.toString()
    );

    return {
      priorLeafIsEmpty, 
      priorLeafNumber, 
      newLeafNumber,
      leafWitness,
      storedNewStorageNumber,
      storedNewStorageSignature};
}


export async function readValueFromTree(index:bigint,
     zkTreeInstance:MyTreeContract,
     storageServerAddress: string,
     zkTreePublickKey: PublicKey,
     treeHeight: number,
  ) {

  // recover tree root
  const treeRoot = await zkTreeInstance.storageTreeRoot.get();

  console.log("D: " + treeRoot.toString());
  // field of three
  const idxfields = await OffChainStorage.get(
      storageServerAddress,
      zkTreePublickKey,
      treeHeight,
      treeRoot,
      NodeXMLHttpRequest
  );

  var r = idxfields.get(index);

  if (r && r.length>0) {

    return r[0].toString();
  } else {
    return null;
  }

}



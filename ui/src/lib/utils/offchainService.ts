
import {
  Permissions, CircuitString, Field,
  SmartContract, state, State, method, Struct, PublicKey,
  VerificationKey, Signature, DeployArgs, MerkleTree, Bool,
  PrivateKey, Mina, fetchAccount,
} from 'o1js';
import type { } from "o1js";
import { MerkleWitness8, OffChainStorage, Update } from 'experimental-offchain-zkapp-storage';
import { MyTreeContract } from '../../../../contracts/build/src/MyTreeContract.js';


//  XMLHttpRequest

//npm i experimental-offchain-zkapp-storage 
//https://github.com/es92/zkApp-offchain-storage
//https://docs.minaprotocol.com/zkapps/tutorials/offchain-storage

export const doUpdateTree = async (
  //linkt to tree
  priorLeafIsEmpty: boolean,
  priorLeafNumber: Field,
  newLeafNumber: Field,
  leafWitness: MerkleWitness8,
  //linked to transaction
  storedNewStorageNumber: Field,
  storedNewStorageSignature: Signature,
  // feePayerPubliceKey:PublicKey,
  // transactionFee:number,
  zkTreeInstance: MyTreeContract
  //mina
): Promise<Mina.Transaction> => {


  let transaction = await Mina.transaction(
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

  return transaction;
}


export const updateTree = async (
  x: number,
  index: bigint,
  zkTreeInstance: MyTreeContract,
  zkTreePublickKey: PublicKey,
  storageServerAddress: string,
  treeHeight: number) => {

  // const index = BigInt(Math.floor(Math.random()*4));

  // recover tree root
  const treeRoot = await zkTreeInstance.storageTreeRoot.get();

  // field of three
  const idxfields = await OffChainStorage.get(
    storageServerAddress,
    zkTreePublickKey,
    treeHeight,
    treeRoot,
    window.XMLHttpRequest
  );

  // map on Tree of idxfields
  const tree = OffChainStorage.mapToTree(treeHeight, idxfields);

  //calculate the witness for specific index
  const leafWitness = new MerkleWitness8(tree.getWitness(BigInt(index)));

  const priorLeafIsEmpty = !idxfields.has(index);
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
      window.XMLHttpRequest
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
    storedNewStorageSignature
  };
}


export async function readValueFromTree(index: bigint | null,
  zkTreeInstance: MyTreeContract,
  storageServerAddress: string,
  zkTreePublickKey: PublicKey,
  treeHeight: number,
) {


  await fetchAccount({ publicKey: zkTreeInstance.address });
  // recover tree root
  const treeRoot = await zkTreeInstance.storageTreeRoot.get();

  //console.log("D: " + treeRoot.toString());
  // console.log("Publick key: " + PublicKey.fromFields([treeRoot]).toBase58());
  // field of three
  const idxfields = await OffChainStorage.get(
    storageServerAddress,
    zkTreePublickKey,
    treeHeight,
    treeRoot,
    window.XMLHttpRequest
  );

  if (index) {
    var r = idxfields.get(index);

    if (r && r.length > 0) {

      return r[0].toString();
    } else {
      return null;
    }
  } else {

    return idxfields;
  }

}



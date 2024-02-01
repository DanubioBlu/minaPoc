import { Cache, Field, Mina, PublicKey, Signature, UInt32, fetchAccount } from 'o1js';

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

// ---------------------------------------------------------------------------------------

import { Change } from '../../../../contracts/build/src/Change.js';
import { Oracle } from '../../../../contracts/build/src/Oracle.js';
import { minaEvent } from '../struct/base.js';
import { MyTreeContract } from '../../../../contracts/build/src/MyTreeContract.js';
import { doUpdateTree, updateTree, readValueFromTree } from './offchainService';
import { log } from 'console';

export const state = {
  zkAppClass: null as null | typeof Change,
  zkapp: null as null | Change,
  transaction: null as null | Transaction,
  Oracle: null as Oracle | null,
  OracleClass: null as null | typeof Oracle,
  MyTree: null as null | MyTreeContract,
  TreeClass: null as null | typeof MyTreeContract,
  publicTreeAdd: PublicKey.fromBase58(process.env.NEXT_PUBLIC_TREE_APP as string) as PublicKey,
  publicTreeUrl: process.env.NEXT_PUBLIC_TREE_URL as string,
  height: 8 as number
};

type SendTransactionResult = {
  hash: string;
};

interface ProviderError extends Error {
  message: string;
  code: number;
  data?: unknown;
}

interface SendTransactionArgs {
  readonly transaction: string | object;
  readonly feePayer?: {
    readonly fee?: number;
    readonly memo?: string;
  };
}

var files: { [key: string]: string; }[] = [];

async function fetchFiles(type: 'main' | 'oracle' | 'offchain') {

  var new_manifest = await fetch(`/api/manifest?type=${type}`);
  var data: { "manifest": { name: string; type: string }[] }
    = await new_manifest.json();
  files = data.manifest;

  var folder = '/assets/cache';
  if (type == 'oracle')
      folder = '/assets/cache/onlyoracle';
  if (type == 'offchain')
     folder = '/assets/cache/onlytree';

  return Promise.all(files.map((file) => {
    return Promise.all([
      fetch(`${folder}/${file.name}.header`).then(res => res.text()),
      fetch(`${folder}/${file.name}`).then(res => res.text())
    ]).then(([header, data]) => ({ file, header, data }));
  }))
    .then((cacheList) => cacheList.reduce((acc: { [key: string]: { file: any; header: string, data: string } }, { file, header, data }) => {
      acc[file.name] = { file, header, data };

      return acc;
    }, {}));
}
function sleep(ms: any) {
  const start = new Date().getTime();
  let currentTime = start;
  while (currentTime - start < ms) {
    currentTime = new Date().getTime();
  }
}

const FileSystem = (files: any): Cache => ({
  read({ persistentId, uniqueId, dataType }: any) {
    // read current uniqueId, return data if it matches
    if (!files[persistentId]) {
      console.log('Cachenot found!');
      console.log({ persistentId, uniqueId, dataType });

      /// sleep(1000);
      return undefined;
    }

    const currentId = files[persistentId].header;

    if (currentId !== uniqueId) {
      console.log('current id did not match persistent id');
      // sleep(1000);
      return undefined;
    }

    if (dataType === 'string') {
      console.log('found in cache', { persistentId, uniqueId, dataType });

      return new TextEncoder().encode(files[persistentId].data);
    }
    // else {
    //   let buffer = readFileSync(resolve(cacheDirectory, persistentId));
    //   return new Uint8Array(buffer.buffer);
    // }
   //  sleep(1000);
   console.log('cache fallback case');
    return undefined;
  },
  write({ persistentId, uniqueId, dataType }: any, data: any) {
    console.log('write');
    console.log({ persistentId, uniqueId, dataType });
  },
  canWrite: false,
  debug: true,
});


// ---------------------------------------------------------------------------------------

export const functions = {
  setActiveInstanceToBerkeley: async (args: {}) => {
    const Berkeley = Mina.Network({
      mina: process.env.NEXT_PUBLIC_MINA_ENDPOINT as string,
      archive: process.env.NEXT_PUBLIC_MINA_ARCHIVE as string
    }
      //'https://proxy.berkeley.minaexplorer.com/graphql'
    );//https://api.minascan.io/archive/berkeley/v1/graphql
    console.log('Berkeley Instance Created');
    Mina.setActiveInstance(Berkeley);
  },
  loadContract: async (args: {}) => {
    const { Change } = await import('../../../../contracts/build/src/Change.js');
    const { Oracle } = await import('../../../../contracts/build/src/Oracle.js');
    const { MyTreeContract } = await import('../../../../contracts/build/src/MyTreeContract.js');
    // state.zkapp = Change;
    state.zkAppClass = Change;
    state.OracleClass = Oracle;
    state.TreeClass = MyTreeContract;
  },
  compileContract: async (args: {}) => {
    try {

    console.log("start fetching oracle file");
    const cacheOracleFiles = await fetchFiles('oracle');
    const fileOracleChangesystem = FileSystem(cacheOracleFiles)

    console.log("start Oracle   file");
    await state.OracleClass!.compile({ cache: fileOracleChangesystem });

    console.log("start fetching offchain file");
    const cacheTreeFiles = await fetchFiles('offchain');
    const fileTreeChangesystem = FileSystem(cacheTreeFiles)

    console.log("start Offcahin  file");
    await state.TreeClass!.compile({ cache: fileTreeChangesystem });

    console.log("start fetching main file");
    const cacheFiles = await fetchFiles('main');
    const fileChangesystem = FileSystem(cacheFiles)

    console.log("start compolig main  file");
      await state.zkAppClass!.compile({ cache: fileChangesystem });
      console.log("END compiling");
      
    } catch (error) {
      console.log(error);
      alert(JSON.stringify(error));
    }

  },
  fetchAccount: async (args: { publicKey58: string }) => {
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    return await fetchAccount({ publicKey });
  },
  initZkappInstance: async (args: { publicKey58: string }) => {
    console.log("change address" + args.publicKey58);
    // const res2 = await fetchAccount(
    //   {publicKey:  args.publicKey58});

    const publicKey = PublicKey.fromBase58(args.publicKey58);
    state.zkapp = new state.zkAppClass!(publicKey);

    const re4 = await fetchAccount(
      { publicKey: args.publicKey58 });

    var addressOracle = state.zkapp.oracleAddress.get();
    console.log("oracle address" + addressOracle.toBase58());
    state.Oracle = new state.OracleClass!(addressOracle);

    var addressTree = state.zkapp.treeAddress.get();
    console.log("tree address" + addressTree.toBase58());
    state.MyTree = new state.TreeClass!(addressTree);
  },
  getNum: async (field: 'record_a' | 'record_b') => {
    if (state.zkapp == null) return null;
    const currentNum = await state.zkapp[field].get();
    return JSON.stringify(currentNum.toJSON());
  },

  getAddressOracle: async () => {
    if (state.zkapp == null) return null;
    const currentNum = await state.zkapp.oracleAddress.get();
    return currentNum;
  },
  getAddressTree: async () => {
    if (state.zkapp == null) return null;
    const currentNum = await state.zkapp.treeAddress.get();
    return currentNum;
  },
  initAddress: async (senderAddress: PublicKey) => {

    const res = await fetchAccount(
      { publicKey: senderAddress });

    const res2 = await fetchAccount(
      { publicKey: state.zkapp!.address });

    const res3 = await fetchAccount(
      { publicKey: state.Oracle!.address });


    const res4 = await fetchAccount(
      { publicKey: state.MyTree!.address });


    console.log("change " + res.account?.publicKey.toBase58());
    console.log("oracle " + res3.account?.publicKey.toBase58());
    console.log("tree " + res4.account?.publicKey.toBase58());
    console.log("sender " + senderAddress.toBase58());

  }
  ,
  createTreeSaveTransaction: async (x: number, senderAddress: PublicKey | null) => {
    state.transaction = null;

    console.log("start create save tree txt");
    if (senderAddress == null) {
      alert("missing account");
      return;
    }

    var ids = await functions.recoverPrintableTreeAllTree();

    // to improve in decentralized way!!

    var m = 1;

    if (ids.length > 0) {
      m = Math.max(...ids.map(
        (i) => { return Number(i.key.toString(10)); }
      )) + 1 % 8;
    }
    var {
      priorLeafIsEmpty,
      priorLeafNumber,
      newLeafNumber,
      leafWitness,
      storedNewStorageNumber,
      storedNewStorageSignature } = await updateTree(x,
        BigInt(m),
        state.MyTree!,
        state.publicTreeAdd,
        state.publicTreeUrl,
        state.height
      );

    state.transaction = await doUpdateTree(
      priorLeafIsEmpty,
      priorLeafNumber,
      newLeafNumber,
      leafWitness,
      storedNewStorageNumber,
      storedNewStorageSignature,
      state.MyTree!
    )

    console.log("end  save tree txt");
  },

  createUpdateTransaction: async (x: number, senderAddress: PublicKey | null) => {

    state.transaction = null;

    if (senderAddress == null) {
      alert("missing account");
      return;
    }
    const response = await fetch(
      '/api/oracle',
    );

    const data = await response.json();

    const id = Field(data.data.id);
    const creditScore = Field(data.data.creditScore);
    const signature = Signature.fromBase58(data.signature);

    //await state.zkAppClass?.compile();

    console.log("publick key" + state.Oracle?.oraclePublicKey.get().toBase58());
    // var oo = await state.OracleClass?.compile();

    var input_value = Field(x);

    const transaction = await Mina.transaction(senderAddress,() => {
      state.zkapp?.updateWithOracle(input_value, id, creditScore, signature);
      // state.zkapp?.saveWithTree(input_value, id, creditScore, signature);
    });

    state.transaction = transaction;
  },
  proveUpdateTransaction: async (args: {}) => {
    // if(state.zkAppClass?._provers == undefined)
    //   await state.zkAppClass?.compile();  
    await state.transaction!.prove();
  },
  getTransactionJSON: async (args: {}) => {
    return state.transaction!.toJSON();
  },
  recoverHistory: async (): Promise<minaEvent[] | undefined> => {

    var events =  (await state.zkapp?.fetchEvents(UInt32.from(0)));
    if (!events) return []

    return events.sort( (one, two) => (one.blockHeight > two.blockHeight ? -1 : 1)).slice(0, 10);

  },
  sendTransaction: async (mina: any) => {
    const updateResult: SendTransactionResult | ProviderError = await mina.sendTransaction({
      transaction: state.transaction!.toJSON(), // this is zk commond, create by zkApp.
      feePayer: { // option.
        // fee: fee,
        // memo: ''
      },
    });

    console.log(updateResult);

    return updateResult;
  },
  recoverPrintableTreeAllTree: async () => {

    var tree = await readValueFromTree(
      null,
      state.MyTree!,
      state.publicTreeUrl,
      state.publicTreeAdd,
      state.height
    );
    if (tree == null) return [];

    var t = tree as any as Map<bigint, Field[]>;

    var result: { "key": bigint, "values": any[] }[] = [];
    t.forEach((fields, key) => {

      result.push({ "key": key, "values": fields.map(i => i.toJSON()) });
    });

    return result;
  }

};

// ---------------------------------------------------------------------------------------

export type WorkerFunctions = keyof typeof functions;

export type ZkappWorkerRequest = {
  id: number;
  fn: WorkerFunctions;
  args: any;
};

export type ZkappWorkerReponse = {
  id: number;
  data: any;
};

console.log('Web Worker Successfully Initialized.');
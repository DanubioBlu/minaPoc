import { ProvablePure, PublicKey, UInt32 } from "o1js";
import ZkappWorkerClient from "../utils/zkappWorkerClient";



export interface baseState{
    zkappWorkerClient: null | ZkappWorkerClient,
    mina: any,
    hasWallet:null | boolean,
    compiledContract:boolean,
    hasBeenSetup: boolean,
    accountExists: boolean,
    value_a: null | string,
    value_b:  null | string,
    OracleKey: null| string,
    TreeKey: null | string,
    publicUserKey:  null | PublicKey,
    zkappPublicKey: null | PublicKey,
    creatingTransaction: boolean
  }

export interface minaEvent {
  type: string;
  event: {
      data: ProvablePure<any>;
      transactionInfo: {
          transactionHash: string;
          transactionStatus: string;
          transactionMemo: string;
      };
  };
  blockHeight: UInt32;
  blockHash: string;
  parentBlockHash: string;
  globalSlot: UInt32;
  chainStatus: string;
}
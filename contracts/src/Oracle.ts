import {Field, Signature, SmartContract, method, state,PublicKey, State } from  'o1js';


const ORACLE_PUBLIC_KEY =
  'B62qoAE4rBRuTgC42vqvEyUqCGhaZsW58SKVW4Ht8aYqP9UTvxFWBgy';

export class Oracle extends SmartContract {
    @state(PublicKey) oraclePublicKey = State<PublicKey>();

init(){
    super.init();
    this.oraclePublicKey.set(PublicKey.fromBase58(ORACLE_PUBLIC_KEY));
    this.requireSignature();
}

@method verifyPocOracle(id: Field, creditScore: Field, signature:Signature){

const oraclePublicKey = this.oraclePublicKey.get();
this.oraclePublicKey.requireEquals(oraclePublicKey);

const valid = signature.verify(oraclePublicKey, [id, creditScore]);
valid.assertTrue();
}}
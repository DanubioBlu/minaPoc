import { CircuitString,Field, SmartContract, state, State, method, Struct, PublicKey, VerificationKey, Signature,Bool, Circuit, Provable, FlexibleProvable } from 'o1js';
import ElementData from './utilities/utils.js';
import { Oracle } from './Oracle.js';
import { MyTreeContract } from './MyTreeContract.js';
import { MerkleWitness8 } from 'experimental-offchain-zkapp-storage';



/**
 * Basic Example
 * See https://docs.minaprotocol.com/zkapps for more info.
 *
 * The Add contract initializes the state variable 'num' to be a Field(1) value by default when deployed.
 * When the 'update' method is called, the Add contract adds Field(2) to its 'num' contract state.
 *
 * This file is safe to delete and replace with your own contract.
 */
export  class Change extends SmartContract {
  events = {
    "updated-record-a": ElementData,
    "updated-record-b": ElementData,
    "updated-reset": ElementData,
  };

  @state(Field) record_a = State<Field>();
  @state(Field) record_b = State<Field>();
  @state(Field) version = State<Field>();
  @state(PublicKey) oracleAddress = State<PublicKey>();
  @state(PublicKey) treeAddress = State<PublicKey>();

  init() {
    super.init();
    this.record_a.set(Field(50));
    this.record_b.set(Field(50));
    this.version.set(Field(2));
  }

  @method updateContract(verificationKey:VerificationKey){

    this.account.verificationKey.set(verificationKey);
    this.requireSignature();
  }

  @method updateOracleContract(oracleAddress:PublicKey){
     this.oracleAddress.set(oracleAddress);
    // this.requireSignature();
  }

  @method update(a:Field, save:Field) {
    
    const currentState_a = this.record_a.getAndRequireEquals();
    const currentState_b = this.record_b.getAndRequireEquals();
  
    var new_value_a = Provable.if(currentState_a.greaterThan(a), 
    currentState_a, a);

    new_value_a = Provable.if(new_value_a.equals(200), 
    Field(100), new_value_a);
    
    var new_value_b = Provable.if(currentState_b.greaterThan(a), 
    a, currentState_b);

    new_value_b = Provable.if(new_value_b.equals(0), 
    Field(100), new_value_b);

    this.record_a.set(new_value_a);
    this.record_b.set(new_value_b);

    this.emitEvent("updated-record-a", new ElementData({address: this.sender, points: save}));

}

@method updateWithOracle(a:Field, id: Field, creditScore: Field, signature:Signature){
    
   var oracle = new Oracle(this.oracleAddress.get());
    oracle.verifyPocOracle(id, creditScore, signature);
    this.update(a, creditScore);
}


@method updateTreeContract(treeAddress:PublicKey){
  this.treeAddress.set(treeAddress);
}

@method saveWithTree(
  a:Field, 
  leaftIsEmpty: Bool,
  oldNum: Field,
  num: Field,
  path: MerkleWitness8,
  storedNewRootNumber: Field,
  storedNewRootSignature: Signature) {

  var treeAdd =  this.treeAddress.getAndRequireEquals();
  var tree = new MyTreeContract(treeAdd);
  tree.updateChangeThree(leaftIsEmpty, oldNum,
     num, path,
     storedNewRootNumber, storedNewRootSignature );
}

}

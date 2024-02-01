import { MerkleWitness8, OffChainStorage,Update } from 'experimental-offchain-zkapp-storage';
//npm i experimental-offchain-zkapp-storage installare questa!!
//https://github.com/es92/zkApp-offchain-storage
//https://docs.minaprotocol.com/zkapps/tutorials/offchain-storage
import { Permissions,CircuitString,Field, SmartContract, state, State, method, Struct, PublicKey, VerificationKey, Signature, DeployArgs, MerkleTree, Bool, } from 'o1js';



export class MyTreeContract extends SmartContract {

  @state(PublicKey) storageServerPublicKey = State<PublicKey>();
  @state(Field) storageNumber = State<Field>();
  @state(Field) storageTreeRoot = State<Field>();

  
  deploy(args: DeployArgs) {
     super.deploy(args);
     this.account.permissions.set(
      {
        ...Permissions.default(),
        editState: Permissions.proofOrSignature(),
      });
  }

  @method initState(storageServerPublickKey: PublicKey) {
    this.storageServerPublicKey.set(storageServerPublickKey);
    this.storageNumber.set(Field(0));

    const emptyTreeRoot = new MerkleTree(8).getRoot();
    this.storageTreeRoot.set(emptyTreeRoot);
  }

  @method updateChangeThree(
    leaftIsEmpty: Bool,
    oldNum: Field,
    num: Field,
    path: MerkleWitness8,
    storedNewRootNumber: Field,
    storedNewRootSignature: Signature
  ){

    const storedRoot = this.storageTreeRoot.get();
    this.storageTreeRoot.requireEquals(storedRoot);

    let storedNumber = this.storageNumber.get();
    this.storageNumber.requireEquals(storedNumber);

    let storageServerPublicKey = this.storageServerPublicKey.getAndRequireEquals();

    let leaf = [oldNum];
    let newLeaf = [num];

    newLeaf[0].assertGreaterThan(leaf[0]);

    const updates:Update[] =[{
      leaf,
      leafIsEmpty:leaftIsEmpty,
      newLeaf,
      newLeafIsEmpty: Bool(false),
      leafWitness: path
    }];

  
    const storedNewRoot = OffChainStorage.assertRootUpdateValid(
      storageServerPublicKey,
      storedNumber,
      storedRoot,
      updates,
      storedNewRootNumber,
      storedNewRootSignature
    );

      this.storageTreeRoot.set(storedNewRoot)
      this.storageNumber.set(storedNewRootNumber);
  }

  @method updateContract(verificationKey:VerificationKey){
    this.account.verificationKey.set(verificationKey);
    this.requireSignature();
  }

}
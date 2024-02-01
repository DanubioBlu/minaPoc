import { AccountUpdate,PublicKey,Cache,Field, Mina, PrivateKey, Signature, fetchAccount } from "o1js";
import { Oracle } from "./Oracle";
import fs from 'fs/promises';

describe('Add Oracle test', () => {
    let feePayer: PrivateKey,
      zkAppAddress: PublicKey,
      feeAddress:PublicKey,
      zkAppPrivateKey: PrivateKey,
      zkAppInstance: Oracle,
      currentState: Field,
      senderKey: PrivateKey,
      txn;

  
    beforeAll(async () => {
        await Oracle.compile();

    });

    var prepare = async ()=> {
        let Local = Mina.LocalBlockchain();
        Mina.setActiveInstance(Local);
  
        feePayer = Local.testAccounts[0].privateKey;
        var feeAddress = feePayer.toPublicKey();
    
        senderKey = Local.testAccounts[1].privateKey;
        // zkapp account
        zkAppPrivateKey = PrivateKey.random();
        zkAppAddress = zkAppPrivateKey.toPublicKey();
  
        //const cache: Cache = Cache.FileSystem("../testing/cache");
        // await Oracle.compile();
  
        zkAppInstance = new Oracle(zkAppAddress);
    
        // deploy zkapp
        txn = await Mina.transaction(feeAddress, () => {
          AccountUpdate.fundNewAccount(feeAddress);
          zkAppInstance.deploy({ zkappKey: zkAppPrivateKey });
        });
  
        await txn.sign([feePayer, zkAppPrivateKey]).send();
    }


    var prepareBerkley = async ()=> {


      var oracleAddress= PublicKey.fromBase58('B62qm6yCKRdkXFL2gU2GwHUime4iGRXh8vnzMk1vtT3CizM1bfW952Z')

      var deployAlias='oracle2';
      let configJson: any = JSON.parse(await fs.readFile('config.json', 'utf8'));
      let config = configJson.deployAliases[deployAlias];

      let feepayerKeysBase58: { privateKey: string; publicKey: string } = JSON.parse(
        await fs.readFile(config.feepayerKeyPath, 'utf8')
      );

      let zkAppKeysBase58: { privateKey: string; publicKey: string } = JSON.parse(
        await fs.readFile(config.keyPath, 'utf8')
      );

      senderKey = PrivateKey.fromBase58(feepayerKeysBase58.privateKey);
      zkAppPrivateKey = PrivateKey.fromBase58(zkAppKeysBase58.privateKey);

      // set up Mina instance and contract we interact with
      const Network = Mina.Network(config.url);
      const fee = Number(config.fee) * 1e9; // in nanomina (1 billion = 1.0 mina)
      Mina.setActiveInstance(Network);
      feeAddress = senderKey.toPublicKey();
      zkAppAddress = zkAppPrivateKey.toPublicKey();
      //const cache: Cache = Cache.FileSystem("../testing/cache");
      // await Oracle.compile();
      console.log("compiling...");
      zkAppInstance = new Oracle(zkAppAddress);
      // zkChangeInstance = new Change(zkChangePrivateKey.toPublicKey());
      // await fetchAccount({ publicKey: zkOracleAddress });
      await fetchAccount({ publicKey: feeAddress });
      await fetchAccount({ publicKey: oracleAddress })

  }

  
    it('Test Verify', async () => {
      await  prepareBerkley();
      const response = await fetch(
        'https://07-oracles.vercel.app/api/credit-score?user=2'
      );
      const data = await response.json();

      const id = Field(data.data.id);
      const creditScore = Field(data.data.creditScore);
      const signature = Signature.fromBase58(data.signature);

      const txnv = await Mina.transaction(senderKey.toPublicKey(), () => {
        zkAppInstance.verifyPocOracle(id, creditScore, signature);
      });
      
      await txnv.prove();
      var tx_id = await txnv.sign([senderKey]).send();
      
      await tx_id.wait();
      expect(tx_id.isSuccess);
      
    });
  
  });

describe.skip('Add Oracle test',()=>{

})
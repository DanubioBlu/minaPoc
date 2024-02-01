import { AccountUpdate,PublicKey,Cache,Field, Mina, PrivateKey, Signature, fetchAccount } from "o1js";
import { Oracle } from "./Oracle";
import { Change } from "./Change";
import fs from 'fs/promises';
import { Config } from "prettier";

describe('Add Change test', () => {
    let feePayer: PrivateKey,
      zkOracleAddress: PublicKey,
      feeAddress:PublicKey,
      zkOraclePrivateKey: PrivateKey,
      zkChangePrivateKey: PrivateKey,
      zkOrackeInstance: Oracle,
      zkChangeInstance: Change,
      currentState: Field,
      senderKey: PrivateKey,
      txn;

  
    beforeAll(async () => {
        await Oracle.compile();
        await Change.compile();
    //   // setup local blockchain
    //   let Local = Mina.LocalBlockchain();
    //   Mina.setActiveInstance(Local);

    //   feePayer = Local.testAccounts[0].privateKey;
    //   var feeAddress = feePayer.toPublicKey();
  
    //   // zkapp account
    //   zkAppPrivateKey = PrivateKey.random();
    //   zkAppAddress = zkAppPrivateKey.toPublicKey();

    //   const cache: Cache = Cache.FileSystem("../testing/cache");
    //   await Oracle.compile();

    //   zkAppInstance = new Oracle(zkAppAddress);
  
    //   // deploy zkapp
    //   txn = await Mina.transaction(feeAddress, () => {
    //     AccountUpdate.fundNewAccount(feeAddress);
    //     zkAppInstance.deploy({ zkappKey: zkAppPrivateKey });
    //   });

    //   await txn.sign([feePayer, zkAppPrivateKey]).send();
    });

    var prepare = async ()=> {
        let Local = Mina.LocalBlockchain({ proofsEnabled: true});
        Mina.setActiveInstance(Local);
  
        feePayer = Local.testAccounts[0].privateKey;
        var feeAddress = feePayer.toPublicKey();
    
        senderKey = Local.testAccounts[1].privateKey;
        // zkapp account
        zkOraclePrivateKey = PrivateKey.random();
        zkOracleAddress = zkOraclePrivateKey.toPublicKey();
  
        zkChangePrivateKey = PrivateKey.random();


        //const cache: Cache = Cache.FileSystem("../testing/cache");
        // await Oracle.compile();
        console.log("compiling...");
        zkOrackeInstance = new Oracle(zkOracleAddress);
        zkChangeInstance = new Change(zkChangePrivateKey.toPublicKey());

        console.log("start... oracle contract");
        // deploy zkapp
        txn = await Mina.transaction(feeAddress, () => {
          AccountUpdate.fundNewAccount(feeAddress);
          zkOrackeInstance.deploy({ zkappKey: zkOraclePrivateKey });
        });

       var ttx = await txn.sign([feePayer, zkOraclePrivateKey]).send();

       await ttx.wait();

       console.log("start... change contract");
        txn = await Mina.transaction(feeAddress, () => {
            AccountUpdate.fundNewAccount(feeAddress);
            zkChangeInstance.deploy({ zkappKey: zkChangePrivateKey });
          });

          await txn.prove();
          var ttx = await txn.sign([feePayer, zkChangePrivateKey]).send();
          await ttx.wait();
          console.log("deploied change contract");


         console.log("set oracle address");
        txn = await Mina.transaction(feeAddress, () => {
              zkChangeInstance.updateOracleContract(zkOraclePrivateKey.toPublicKey());
        });
  
        await txn.prove();
        
        var ttx = await txn.sign([feePayer, zkChangePrivateKey]).send();
        await ttx.wait();
        console.log("deploied change contract");

         

       // await txn.sign([feePayer, zkOraclePrivateKey]).send();
    }

    var prepareOnBerkery = async ()=> {


      var oracleAddress= PublicKey.fromBase58('B62qnyPhXELHaQJnvuVUuS8pHAizCoEd73JxxC7KHqR8jz4asrmCvzn')

      var deployAlias='change';
      let configJson: any = JSON.parse(await fs.readFile('config.json', 'utf8'));
      let config = configJson.deployAliases[deployAlias];

      let feepayerKeysBase58: { privateKey: string; publicKey: string } = JSON.parse(
        await fs.readFile(config.feepayerKeyPath, 'utf8')
      );

      let zkAppKeysBase58: { privateKey: string; publicKey: string } = JSON.parse(
        await fs.readFile(config.keyPath, 'utf8')
      );

      senderKey = PrivateKey.fromBase58(feepayerKeysBase58.privateKey);
      zkChangePrivateKey = PrivateKey.fromBase58(zkAppKeysBase58.privateKey);

      // set up Mina instance and contract we interact with
      const Network = Mina.Network(config.url);
      const fee = Number(config.fee) * 1e9; // in nanomina (1 billion = 1.0 mina)
      Mina.setActiveInstance(Network);
      feeAddress = senderKey.toPublicKey();
      zkOracleAddress = zkChangePrivateKey.toPublicKey();
      //const cache: Cache = Cache.FileSystem("../testing/cache");
      // await Oracle.compile();
      console.log("compiling...");
      zkOrackeInstance = new Oracle(zkOracleAddress);
      zkChangeInstance = new Change(zkChangePrivateKey.toPublicKey());
      await fetchAccount({ publicKey: zkOracleAddress });
      await fetchAccount({ publicKey: feeAddress });
      await fetchAccount({ publicKey: oracleAddress })
      console.log("end... oracle prep");
      // deploy zkapp       
     // await txn.sign([feePayer, zkOraclePrivateKey]).send();
  }
  
    it('Test Verify', async () => {


      console.log("start preparation");
      await  prepareOnBerkery();
      console.log("finish preparation");
      const response = await fetch(
        'https://07-oracles.vercel.app/api/credit-score?user=2'
      );
      const data = await response.json();

      const id = Field(data.data.id);
      const creditScore = Field(data.data.creditScore);
      const signature = Signature.fromBase58(data.signature);

      console.log("Start update oracle");
      console.log("fee publick: "+senderKey.toPublicKey().toBase58());
      const txnv = await Mina.transaction({sender:senderKey.toPublicKey(),fee:0.6*1e9}, () => {
        zkChangeInstance.updateWithOracle(Field(61), id, creditScore, signature);
      });
      
      await txnv.prove();
      console.log("fee private: "+senderKey.toBase58());
      var tx_id = await txnv.sign([senderKey]).send();
      
      await tx_id.wait();
      console.log("finish test");
      expect(tx_id.isSuccess);
      
    });
  
  });
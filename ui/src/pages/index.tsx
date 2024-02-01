
import Head from 'next/head';
import Image from 'next/image';
import { InputHTMLAttributes, useEffect, useRef, useState } from 'react';
import GradientBG from '../components/GradientBG.js';
import styles from '../styles/Home.module.css';
import heroMinaLogo from '../../public/assets/hero-mina-logo.svg';
import arrowRightSmall from '../../public/assets/arrow-right-small.svg';
import { Change } from '../../../contracts/build/src/Change.js';
import ZkappWorkerClient from '../lib/utils/zkappWorkerClient';
import { baseState, minaEvent } from '../lib/struct/base';

import { functions as coreUtils, state as coreState } from '../lib/utils/zkappWorker'
import { DAppActions } from '@aurowallet/mina-provider';
import { Field, Mina, PublicKey, fetchAccount } from 'o1js';
import HistoryGrid from '../components/HistoryGrid';
import TreeGrid from '@/components/TreeGrid';


const ZKAPP_ADDRESS = process.env.NEXT_PUBLIC_MAIN_ZKAPP;

export default function Home() {

  const [state, setState] = useState<baseState>({
    zkappWorkerClient: null as null | ZkappWorkerClient,
    mina: null as any,
    hasWallet: null as null | boolean,
    compiledContract: false as boolean,
    hasBeenSetup: false,
    accountExists: false,
    value_a: null as null | string,
    value_b: null as null | string,
    OracleKey: null as null | string,
    TreeKey: null as null | string,
    publicUserKey: null as null | PublicKey,
    zkappPublicKey: null as null | PublicKey,
    creatingTransaction: false
  });
  const [displayText, setDisplayText] = useState('Welcome!');
  const [transactionlink, setTransactionLink] = useState('');

  const [minaEvents, setMinaEvents] = useState<minaEvent[]>([]);
  const [inputValue, setInputValue] = useState('');

  const myInputRef = useRef<HTMLInputElement>(null);

  // const [displayText, setDisplayText] = useState('');
  // const [transactionlink, setTransactionLink] = useState('');

  // const [zkApp, setzkApp] =  useState<Change>();
  // const [value_a, setValueA] =  useState<string>();
  // const [value_b, setValueB] =  useState<string>();

  async function timeout(seconds: number): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, seconds * 1000);
    });
  }


  useEffect(() => {
    (
      async () => {
        const { Mina, PublicKey } = await import('o1js');

        // const zkappWorkerClient = new ZkappWorkerClient();
        await timeout(1);

        // setDisplayText('Done loading web worker');
        console.log('Done loading web worker');


        const mina = (window as any).mina

        if (mina == null) {
          console.log('Dont have wallet');

          setDisplayText('Mina AuroWallet not found please install Auro Wallet');
          setState({ ...state, hasWallet: false });
          return;
        }
        console.log(' have wallet??');


        try {
          coreUtils.setActiveInstanceToBerkeley({});
          // await zkappWorkerClient.setActiveInstanceToBerkeley();
        } catch (error) {

          console.log(error)
        }

        const publicKeyBase58: string = (await mina.requestAccounts())[0];
        const publicUserKey = PublicKey.fromBase58(publicKeyBase58);

        console.log(`Using key:${publicUserKey.toBase58()}`);
    

        setDisplayText('Checking if fee payer account exists...');
        console.log('Checking if fee payer account exists...');




        await coreUtils.loadContract({});


        const zkappPublicKey = PublicKey.fromBase58(ZKAPP_ADDRESS as string);
        const res = await coreUtils.fetchAccount({ publicKey58: zkappPublicKey.toBase58() });

        const accountExists = res.error == null;

        if (!accountExists)
        setDisplayText('Impossible retrieve account, try later..');
        // await coreUtils.fetchAccount({publicKey58: zkappPublicKey.toBase58()});

        await coreUtils.initZkappInstance({ publicKey58: zkappPublicKey.toBase58() })
        console.log('Getting zkApp state...');
        setDisplayText('Getting zkApp state...');


        const field_a = await coreUtils.getNum('record_a');
        const value_b = await coreUtils.getNum('record_b');
        const oracle_add = await coreUtils.getAddressOracle()
        const tree_add = await coreUtils.getAddressTree();
        var ev_mina = await coreUtils.recoverHistory();

        setState({
          ...state,
          mina,
          hasWallet: true,
          hasBeenSetup: true,
          publicUserKey: publicUserKey,
          zkappPublicKey: coreState.zkapp?.address ?? null,
          accountExists,
          value_a: field_a,
          value_b,
          OracleKey: oracle_add == null ? null : (oracle_add.toBase58()),
          TreeKey: tree_add == null ? null : (tree_add.toBase58())
        });
        setMinaEvents(ev_mina ?? []);


        var oor = state.OracleKey == null ? '' : JSON.stringify(PublicKey.fromBase58(state.OracleKey).toJSON());

        var a = 1;
      })();
  }, []);

  return (
    <>
      <Head>
        <title>Mina zkApp UI</title>
        <meta name="description" content="built with o1js" />
        <link rel="icon" href="/assets/favicon.ico" />
      </Head>
      <GradientBG>



        <main className={styles.main}>

          <div className={styles.mainCard}>
            <TreeGrid state={state} />
          </div>

          <div className={styles.mainCard}>

            <h2>Frontrunner!!</h2>
            <div>stato: {displayText}</div>

            <div className='my-2'>
              <button
                className='bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded'

                onClick={async () => {
                  setDisplayText("Compile Contract can require long time....")
                  coreUtils.compileContract({}).then(() => {
                    console.log('end compiling OK');
                    setState({
                      ...state,
                      compiledContract: true
                    });
                    setDisplayText("Compile successful");
                  }).catch((e)=>{
                    console.log('end compiling KO');
                    setDisplayText("fail compiling reson " + JSON.stringify(e));
                  });

                }}>
                Compile!
              </button>

              <button className='mx-2 bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded'

                onClick={async () => {
                  setDisplayText("Refresh events");
                  var ev_mina = await coreUtils.recoverHistory();
                  setMinaEvents(ev_mina ?? []);
                }}>
                Refresh events!
              </button>
            </div>

            {state.hasBeenSetup ?
              <div>
                <div>the last value is record A {state.value_a ?? 'no value'} <br />
                  record b {state.value_b ?? 'no value'}<br />
                  oracle:  {state.OracleKey ?? 'no value'}<br />
                  TreeKey: {state.TreeKey ?? 'no value'}<br />
                  addressContract: {state.zkappPublicKey?.toBase58() ?? ''}<br />
                </div>


                {state.compiledContract ?
                  <div className='my-3 bg-slate-100 p-4 flex justify-between'>
                    <input className='w-80 mx-auto m-1' id='chocheField' type='number' onChange={(e) => { setInputValue(e.target.value); }} value={inputValue} placeholder='insert the value here'></input>

                    <button className='text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2'
                      disabled={!state.hasWallet
                      }
                      onClick={async () => {
                        if (inputValue && state.publicUserKey != null) {

                          if (inputValue == '') {
                            alert("no value in input");
                          }
                          console.log("value X " + inputValue);

                          setDisplayText("Start ...");

                          await coreUtils.initAddress(state.publicUserKey);
                          await coreUtils.createTreeSaveTransaction(Number(inputValue), state.publicUserKey);
                          setDisplayText("building a proof for Tree contract");
                          await coreUtils.proveUpdateTransaction({});
                          var hash = await coreUtils.sendTransaction(state.mina);

                          setDisplayText("Result Tree hash: " + JSON.stringify(hash));
                          await coreUtils.createUpdateTransaction(Number(inputValue), state.publicUserKey);
                          setDisplayText("building a proof for Main contract");
                          await coreUtils.proveUpdateTransaction({});
                          var hash = await coreUtils.sendTransaction(state.mina);

                          setState({
                            ...state,
                            value_a: await coreUtils.getNum('record_a'),
                            value_b: await coreUtils.getNum('record_b')
                          });

                          setDisplayText("Result Txt Update Contract: " + JSON.stringify(hash));
                        }
                      }} >
                      Try to do!
                    </button>
                  </div> :
                  <div className="p-4 my-3 text-bold">Compile contract to continue</div>
                }
              </div> : 'loading..'
            }

          </div>

          <div className={styles.card}>

            <HistoryGrid state={state} fetched_event={minaEvents} />
          </div>
        </main>
      </GradientBG>
    </>
  );
}

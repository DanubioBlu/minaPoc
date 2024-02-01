import Head from 'next/head';
import Image from 'next/image';
import { InputHTMLAttributes, useEffect, useRef, useState } from 'react';
import GradientBG from './GradientBG.js';
import styles from '../styles/Home.module.css';
import heroMinaLogo from '../../public/assets/hero-mina-logo.svg';
import arrowRightSmall from '../../public/assets/arrow-right-small.svg';
import { Change } from '../../../contracts/build/src/Change.js';
import ZkappWorkerClient from '../lib/utils/zkappWorkerClient.js';

import { functions as coreUtils, state as coreState } from '../lib/utils/zkappWorker'
import { DAppActions } from '@aurowallet/mina-provider';
import { Field, Mina, PublicKey, fetchAccount } from 'o1js';
import { baseState, minaEvent } from '@/lib/struct/base.js';

interface TreeProps {
  state: baseState;
}

export default function TreeGrid(props: TreeProps) {

  const [treeView, setTreeView] = useState<{ "key": bigint, "values": any[] }[]>();

  if (!props.state.hasBeenSetup) {
    return (<div>loading....</div>);
  }
  return (<div className="bg-white p-6 rounded-lg shadow-md ">
    <h1 className="text-2xl font-semibold mb-4">Tree</h1>
    {treeView?.map((x, k) => {
      return (
        <div key={'tree_' + k.toString()} className='flex m-1'>
          <div>{x?.key.toString(10)}</div>
          <div className='mx-2'>{JSON.stringify(x?.values)}</div>
        </div>
      );
    })}

    <button onClick={async () => {
      var tree = await coreUtils.recoverPrintableTreeAllTree();
      setTreeView(tree);
    }}> Refresh </button>
  </div>);
}

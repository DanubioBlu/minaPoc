
import fs from 'fs/promises';
import { Cache, AccountUpdate, Field, Mina, PrivateKey, fetchAccount, PublicKey } from 'o1js';
import { Change } from '../Change.js';
import { Transaction } from 'o1js/dist/node/lib/mina.js';
import { Oracle } from '../Oracle.js';
import { MyTreeContract } from '../MyTreeContract.js';

console.log('compile the contract Oracle');
const cacheOracle: Cache = Cache.FileSystem("../ui/public/assets/cache/onlyoracle");
await Oracle.compile({cache:cacheOracle})
await Oracle.compile({cache:cacheOracle})
await Oracle.compile({cache:cacheOracle})
console.log('compile the contract MyTreeContract');

const cacheTree: Cache = Cache.FileSystem("../ui/public/assets/cache/onlytree");
var verification_key = await MyTreeContract.compile({ cache:cacheTree });
await MyTreeContract.compile({ cache:cacheTree });
await MyTreeContract.compile({ cache:cacheTree });
await MyTreeContract.compile({ cache:cacheTree });

console.log('compile the contract Cache');
const cacheChange: Cache = Cache.FileSystem("../ui/public/assets/cache");
var verification_key = await Change.compile({ cache:cacheChange });
await Change.compile({ cache:cacheChange });
await Change.compile({ cache:cacheChange });
await Change.compile({ cache:cacheChange });
console.log('compile the contract END');
# Mina zkApp: PoC Integration

This repository serves as an integration test for various functionalities of the Mina Blockchain.

- Oracle integration with Mock data at '/api/oracle'
- Main Contract implementing simple logic checks
- Offchain data integration using an experimental package deployed at [treestore.zkapps.it](https://treestore.zkapps.it)

## Note

A caching system has been implemented with a dynamic Filelist manifest (`/api/manifest/main`) to improve contract compilation time. The web worker is temporarily disabled to ensure a better debugging experience. There are various aspects for improvement that will be addressed over time. Please note that this PoC is **not intended for production use**.

## Solution
The stack comprises Next.js on Docker with Nginx as a reverse proxy. You can access it at [https://poc.zkapps.it/](https://poc.zkapps.it/).

Credentials:
- Username: minarulez
- Password: ( the password is  on zkignite site)


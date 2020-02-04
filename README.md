# hello-world-zk-dapp

A simple but practical (zero knowledge) hello world project, tested on `ganache-cli`.

## What does it do?

Simply put, the zero-knowledge dapp is responsible to verify if a user belongs to a certain group, without revealing any more additional information (i.e. who the user is).

# Getting Started

```bash
git clone https://github.com/kendricktan/hello-world-zk-dapp.git
cd hello-world-zk-dapp
npm install

# Linux/Mac
# Note: Only tested on node:12.14.1
# This starts up a ganache-cli process,
# compiles the zk-snark circuits,
# deploys the smart contracts
# and finally generate some proofs to verify
# if the user is part of the group or not
npm run start

# Docker
docker build . -t zkdapp
docker run zkdapp
```

# Project Structure

```bash
packages
  ├── circuits    # Zero knowledge circuits
  ├── contracts   # Smart contract logic
  └── scripts     # Scripts to interact with the deploy contracts
```

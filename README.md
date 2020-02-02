# hello-world-zk-dapp

A simple but practical (zero knowledge) hello world project, tested on `ganache-cli`.

# Getting Started

```bash
git clone https://github.com/kendricktan/hello-world-zk-dapp.git
cd hello-world-zk-dapp

# Linux/Mac
# Note: Only tested on node:12.14.1
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

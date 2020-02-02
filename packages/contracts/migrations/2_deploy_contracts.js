const fs = require("fs");
const path = require("path");

const ZkIdentity = artifacts.require("ZkIdentity");

module.exports = async deployer => {
  // Deploy ZkIdentity
  await deployer.deploy(ZkIdentity);

  // Saves to a file if needed
  const data = JSON.stringify({
    zkIdentityAddress: ZkIdentity.address
  });
  const buildDir = path.resolve(__dirname, "../build");
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
  }
  fs.writeFileSync(path.resolve(buildDir, "DeployedAddresses.json"), data);
};

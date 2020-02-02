const {
  genPrivateKey,
  genPublicKey,
  formatBabyJubJubPrivateKey,
  SNARK_FIELD_SIZE
} = require("./utils/crypto");
const {
  zkIdentityAddress
} = require("zk-contracts/build/DeployedAddresses.json");
const zkIdentityDef = require("zk-contracts/build/ZkIdentity.json");
const { binarifyWitness, binarifyProvingKey } = require("./utils/binarify");
const provingKey = require("zk-circuits/build/provingKey.json");
const verifyingKey = require("zk-circuits/build/verifyingKey.json");
const compiler = require("circom");
const { buildBn128 } = require("websnark");
const { Circuit, groth, bigInt } = require("snarkjs");
const {
  stringifyBigInts,
  unstringifyBigInts
} = require("snarkjs/src/stringifybigint");
const { ethers } = require("ethers");

// Provider to interact with ganache
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const wallet = new ethers.Wallet(
  "0x989d5b4da447ba1c7f5d48e3b4310d0eec08d4abd0f126b58249598abd8f4c37",
  provider
);
const zkIdentityContract = new ethers.Contract(
  zkIdentityAddress,
  zkIdentityDef.abi,
  wallet
);

// These are the key pairs specified in the smart contract (ZkIdentity.sol)
const validSk1 = bigInt(
  "5127263858703129043234609052997016034219110701251230596053007266606287227503"
);
const validSk2 = bigInt(
  "859505848622195548664064193769263253816895468776855574075525012843176328128"
);

const validPub1 = genPublicKey(validSk1);
const validPub2 = genPublicKey(validSk2);

const invalidSk1 = genPrivateKey();
const invalidSk2 = genPrivateKey();

const invalidPub1 = genPublicKey(invalidSk1);
const invalidPub2 = genPublicKey(invalidSk2);

const generateProofAndSubmitToContract = async (sk, pks) => {
  // Get circtui definition
  const circuitDef = await compiler(
    require.resolve("zk-circuits/src/circuit.circom")
  );
  const circuit = new Circuit(circuitDef);
  const circuitInputs = {
    privateKey: formatBabyJubJubPrivateKey(sk),
    publicKeys: pks
  };

  // Calculate witness and public signals
  console.log("Generating witness....");
  const witness = circuit.calculateWitness(stringifyBigInts(circuitInputs));
  const publicSignals = witness.slice(
    1,
    circuit.nPubInputs + circuit.nOutputs + 1
  );

  // Websnark to generate proof
  const wasmBn128 = await buildBn128();
  const zkSnark = groth;

  console.log("Generating proof....");
  const witnessBin = binarifyWitness(witness);
  const provingKeyBin = binarifyProvingKey(provingKey);
  const proof = await wasmBn128.groth16GenProof(witnessBin, provingKeyBin);
  const isValid = zkSnark.isValid(
    unstringifyBigInts(verifyingKey),
    unstringifyBigInts(proof),
    unstringifyBigInts(publicSignals)
  );

  // Need to massage inputs to fit solidity format
  const solidityProof = {
    a: stringifyBigInts(proof.pi_a).slice(0, 2),
    b: stringifyBigInts(proof.pi_b)
      .map(x => x.reverse())
      .slice(0, 2),
    c: stringifyBigInts(proof.pi_c).slice(0, 2),
    inputs: publicSignals.map(x => x.mod(SNARK_FIELD_SIZE).toString())
  };
  console.log(`Passed local zk-snark verification: ${isValid}`);

  // Submit to smart contract
  const solidityIsValid = await zkIdentityContract.isInGroup(
    solidityProof.a,
    solidityProof.b,
    solidityProof.c,
    solidityProof.inputs
  );
  console.log(`Verified user is in group (via solidity): ${solidityIsValid}`);
};

const main = async () => {
  console.log("------------------------------------------------------");
  console.log("Interacting with deployed zk-dapp....");
  console.log("------------------------------------------------------");
  console.log("");
  console.log("------------------------------------------------------");

  console.log(
    "1. Supplying derived key pair that exists in the smart contract...."
  );
  await generateProofAndSubmitToContract(validSk1, [validPub1, validPub2]);
  console.log("------------------------------------------------------");
  console.log("");

  console.log("------------------------------------------------------");
  console.log(
    "2. Supplying derived key pair that _does_ _not_ exists in the smart contract...."
  );
  try {
    await generateProofAndSubmitToContract(genPrivateKey(), [
      validPub1,
      validPub2
    ]);
  } catch (e) {
    console.log("(Expected behavior)");
    console.log(`${e}`);
  }
  console.log("------------------------------------------------------");
  console.log("");

  console.log("------------------------------------------------------");
  console.log("3. Supplying invalid public keys....");
  try {
    await generateProofAndSubmitToContract(invalidSk1, [
      invalidPub1,
      invalidPub2
    ]);
  } catch (e) {
    console.log("(Expected behavior)");
    console.log(`${e}`);
  }
  console.log("------------------------------------------------------");

  process.exit(0);
};

main();

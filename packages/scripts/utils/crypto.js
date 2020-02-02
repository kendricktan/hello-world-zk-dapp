const crypto = require("crypto");
const { bigInt } = require("snarkjs");
const { babyJub, eddsa, mimcsponge } = require("circomlib");

const SNARK_FIELD_SIZE = bigInt(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);

/* Helper functions */
const bigInt2Buffer = i => {
  return Buffer.from(i.toString());
};

const hash = (msg, k) => {
  if (k === undefined) {
    return multiHash([msg], 0n, 1);
  }

  return multiHash([msg], k, 1);
};

const multiHash = (arr, key, outputs) => {
  const ret = mimcsponge.multiHash(arr, key, outputs);

  if (Array.isArray(ret)) {
    return ret.map(x => bigInt(x));
  }

  return bigInt(ret);
};

const formatBabyJubJubPrivateKey = priv => {
  // Formats private key to be babyJubJub compatiable

  // https://tools.ietf.org/html/rfc8032
  // Because of the "buff[0] & 0xF8" part which makes sure you have a point with order that 8 divides
  // (^ pruneBuffer)
  // Every point in babyjubjub is of the form: aP + bH, where H has order 8 and P has a big large prime order
  // Guaranteeing that any low order points in babyjubjub get deleted
  // ^From Kobi
  const sBuff = eddsa.pruneBuffer(bigInt2Buffer(hash(priv)).slice(0, 32));

  return bigInt.leBuff2int(sBuff).shr(3);
};

const genPrivateKey = () => {
  const min = (BigInt(2) ** BigInt(256) - SNARK_FIELD_SIZE) % SNARK_FIELD_SIZE;

  let rand;

  while (true) {
    rand = BigInt("0x" + crypto.randomBytes(32).toString("hex"));

    if (rand >= min) {
      break;
    }
  }

  return rand % SNARK_FIELD_SIZE;
};

const genPublicKey = sk => {
  const s = formatBabyJubJubPrivateKey(sk);

  return babyJub.mulPointEscalar(babyJub.Base8, s);
};

module.exports = {
  genPrivateKey,
  genPublicKey,
  formatBabyJubJubPrivateKey,
  SNARK_FIELD_SIZE
};


const {
  parseScArgs,
  hideObject
} = require("./utils/tool");
const deployMigration = require("./deploy");

const argv = parseScArgs();
console.log("argv", hideObject(argv, ["ownerPk", "adminPk", "mnemonic", "ownerIdx", "adminIdx"]));
deployMigration(argv);

/*

node migrations/startDeploy.js --network testnet --nodeURL http://192.168.1.36:8545 --ownerPk b6a03207128827eaae0d31d97a7a6243de31f2baf99eabd764e33389ecf436fc --superAddr "0x2d0e7c0813a51d3bd1d08246af2a8a7a57d8922e" --adminAddr "0x2AA0175Eb8b0FB818fFF3c518792Cc1a327a1338" --monitorAddr "0xEdBdF9e0C92528651dac75d2e9443140A8Cb283C" --gasPrice 10000000000 --gasLimit 8000000 2>&1 | tee /tmp/node1
 */
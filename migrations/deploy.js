const fs = require("fs");
const path = require("path");

const Contract = require("./utils/contract");
const {
    contractLoad,
    wanchainScScript,
    chainDict,
    networks,
    defaultArgv
} = require("./utils/config");
const {
    mkdir,
    exit,
    parseNetwork,
    getProxyDelegate,
    getWorkspace,
    hideObject
} = require("./utils/tool");

async function deploy(argv) {
    let error;
    let ownerPrivateKey;
    let adminPrivateKey;
    let deployedPath;
    let adminAddr;
    let monitorAddr;

    argv = Object.assign({}, defaultArgv[argv.network], argv);
    if (!networks.includes(argv.network)) {
        error = `Invalid network ${argv.network}`;
    }
    if (!argv.nodeURL) {
        error = `Invalid nodeURL ${argv.nodeURL}`;
    }

    if (!argv.superAddr) {
        error = `Need superAddr`;
    }
    if (error) {
        exit(error);
    }

    if (!argv.adminAddr) {
        error = `Need adminAddr`;
    }
    if (error) {
        exit(error);
    }

    if (!argv.monitorAddr) {
        error = `Need monitorAddr`;
    }
    if (error) {
        exit(error);
    }

    const {chainType, isMainnet} = parseNetwork(argv.network);
    if (error) {
        exit(error);
    }

    if (!path.isAbsolute(argv.outputDir)) {
        deployedPath = path.join(__dirname, argv.outputDir);
    } else {
        deployedPath = argv.outputDir;
    }
    mkdir(deployedPath);

    if (argv.ownerPk) {
        ownerPrivateKey = argv.ownerPk;
    } else {
        ownerPrivateKey = Contract.exportPrivateKey(argv.mnemonic, Contract.getChainIndex(chainType), argv.ownerIdx).toString("hex");
    }

    let cfg = {
        network: argv.network, // 'mainnet' or 'testnet' or 'ethereum' or 'rinkeby'
        nodeURL: argv.nodeURL,
        privateKey: ownerPrivateKey,
        superAddr: argv.superAddr,
        adminAddr: argv.adminAddr,
        monitorAddr: argv.monitorAddr,
        contractDir: path.join(__dirname, "..", 'contracts'),
        outputDir: path.join(__dirname, "..", 'build', 'sc-contracts'),
        gasPrice: Number(argv.gasPrice),
        gasLimit: Number(argv.gasLimit)
    }
    console.log("cfg", hideObject(cfg, ["privateKey", "adminPrivateKey"]));
    const workspace = getWorkspace(__dirname, contractLoad, wanchainScScript);
    console.log("run", workspace[chainType].deploy);

    const {wanchainScDeploy} = require(workspace[chainType].deploy);
    let contractDict = await wanchainScDeploy(cfg, isMainnet);

    let deployed = {};
    for (let contract in contractDict.address) {
        let abiName;
        let abiContract = getProxyDelegate(contract);
        if (contractDict.abi[abiContract]) {
            abiName = `abi.${abiContract}.json`;
            fs.writeFileSync(path.join(deployedPath, abiName), JSON.stringify(contractDict.abi[abiContract]), {
                flag: 'w',
                encoding: 'utf8',
                mode: '0666'
            });
        }
        deployed[contract] = {address: contractDict.address[contract]};
        if (abiName) {
            deployed[contract].abi = abiName;
        }
    }

    if (Object.keys(deployed).length > 0) {
        // merge
        const outputFile = path.join(deployedPath, `${argv.network}.json`);
        if (fs.existsSync(outputFile)) {
            const preDeployed = require(outputFile);
            for (let key in preDeployed) {
                if (!deployed[key]) {
                    deployed[key] = preDeployed[key];
                }
            }
        }
        fs.writeFileSync(outputFile, JSON.stringify(deployed, null, 5), {flag: 'w', encoding: 'utf8', mode: '0666'});
        console.log("output", deployedPath);
    }
}

module.exports = deploy;

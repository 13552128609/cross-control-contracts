const wanchainScSdkDeployer = require('wanchain-sc-sdk');
const scDict = require('./contract');

async function wanchainScDeploy(cfg, isMainnet) {
    let contract = {};
    let abi = {};
    let txData;
    await wanchainScSdkDeployer.config(cfg);

    let workerAddr = wanchainScSdkDeployer.getAddressString(cfg.privateKey);
    let adminAddr = cfg.adminAddr.toLowerCase();
    let monitorAddr = cfg.monitorAddr.toLowerCase();
    let superAdminAddr = cfg.superAddr.toLowerCase();

    await wanchainScSdkDeployer.deploy(scDict.CrossControlDelegate);
    let ccd = await wanchainScSdkDeployer.deployed(scDict.CrossControlDelegate);


    await wanchainScSdkDeployer.deploy(scDict.CrossControlProxy, ccd.address, superAdminAddr, '0x');
    let ccp = await wanchainScSdkDeployer.deployed(scDict.CrossControlProxy);

    let crossControl = await wanchainScSdkDeployer.at(scDict.CrossControlDelegate, ccp.address);
    contract[scDict.CrossControlProxy] = ccp.address;
    contract[scDict.CrossControlDelegate] = ccd.address;
    abi[scDict.CrossControlProxy] = ccp.abi;
    abi[scDict.CrossControlDelegate] = ccd.abi;

    txData = await crossControl.methods.initialize(superAdminAddr, adminAddr, monitorAddr).encodeABI();
    await wanchainScSdkDeployer.sendTx(ccp.address, txData);
    return {address: contract, abi: abi};
}

module.exports = {wanchainScDeploy};

const MappingTokenV2 = artifacts.require('CrossControlDelegate');
module.exports = async function (deployer, network) {
  console.log("network:%s",network);
  console.log("deployer:%s",deployer.network);

  if (deployer.network != 'testnet ' && deployer.network != 'mainnet') {
    console.log('no need migration');
    return;
  }
  // ====================================
  //  need change below for new token contract deploy
  // ====================================
  // let symbol = 'DOGE';
  // let decimal = 18;
  // let name = 'DOGE';
  //
  // await deployer.deploy(MappingTokenV2,name,symbol,decimal);
  // let sc = await MappingTokenV2.deployed();
  // console.log("symbol:%s , name :%s, decimal:%d, scAddress",symbol,name,decimal,sc.address);

};
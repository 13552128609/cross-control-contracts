const assert = require('assert');
const CrossControlDelegate = artifacts.require('CrossControlDelegate');
const {expectRevert, expectEvent} = require('@openzeppelin/test-helpers');
const BN = require("bignumber.js");

function bigsToInts(b){
    let ret = [];
    for(let i = 0; i<b.length;i++){
        ret.push(parseInt(b[i].toString(10)))
    }
    return ret;
}

contract('Test CrossControlDelegate', async (accounts) => {
    // accounts[0]: admin
    // accounts[1]: monitor
    for (let i = 0; i < accounts.length; i++) {
        console.log("accounts[%d]:%s", i, accounts[i]);
    }

    let ccd;
    beforeEach(async () => {
        ccd = await CrossControlDelegate.new({from: accounts[0]});
    });

    it("getGlobalProhibit", async () => {
        let globalProhibit = await ccd.getGlobalProhibit();
        assert.strictEqual(globalProhibit, false);
    });

    it("turnOnProhibit from admin", async () => {
        await ccd.turnOnProhibit();
        let globalProhibitAfter = await ccd.getGlobalProhibit();
        assert.strictEqual(globalProhibitAfter, true);
    });

    it("turnOnProhibit from not admin (monitor)", async () => {
        let monitorRole = await ccd.MONITOR_ROLE();
        await ccd.grantRole(monitorRole,accounts[1]);

        await ccd.turnOnProhibit({from:accounts[1]});
        let globalProhibitAfter = await ccd.getGlobalProhibit();
        assert.strictEqual(globalProhibitAfter, true);
    });

    it("turnOnProhibit from not admin (other)", async () => {
        let tx =  ccd.turnOnProhibit({from: accounts[2]});
        expectRevert(tx, "Nether admin Nor Monitor");
    });

    it("turnOnProhibit from admin(already turn on)", async () => {
        await ccd.turnOnProhibit();
        let tx = ccd.turnOnProhibit();
        expectRevert(tx, "already turn on");
    });


    it("turnOffProhibit from admin", async () => {
        await ccd.turnOnProhibit();
        await ccd.turnOffProhibit();
        let globalProhibitAfter = await ccd.getGlobalProhibit();
        assert.strictEqual(globalProhibitAfter, false);
    });

    it("turnOffProhibit already turn off", async () => {
        let tx =  ccd.turnOffProhibit();
        expectRevert(tx, "already turn off");
    });

    it("turnOffProhibit from not admin (other))", async () => {
        await ccd.turnOnProhibit();
        let tx =  ccd.turnOffProhibit({from: accounts[2]});
        expectRevert(tx, "Not admin");
    });

    it("turnOffProhibit from not admin (monitor)", async () => {
        await ccd.turnOnProhibit();

        let monitorRole = await ccd.MONITOR_ROLE();
        await ccd.grantRole(monitorRole,accounts[1]);

        let tx =  ccd.turnOffProhibit({from: accounts[1]});
        expectRevert(tx, "Not admin");
    });


    it("addTokenPairId from  admin", async () => {
        await ccd.addTokenPairId(1);
        let ret = await ccd.getAllWLTokenPairs();
        assert.deepStrictEqual([1],bigsToInts(ret));

    });

    it("addTokenPairIDs from  admin", async () => {
        await ccd.addTokenPairIDs([1,2,3]);
        let ret = await ccd.getAllWLTokenPairs();
        let ret1 = bigsToInts(ret);
        assert.deepStrictEqual([1,2,3],ret1);
    });

    it("addTokenPairId from  not admin", async () => {
        let tx = ccd.addTokenPairId(1,{from:accounts[1]});
        expectRevert(tx, "Not admin");
    });

    it("removeTokenPairId(empty) from  admin ", async () => {
        let tx = ccd.removeTokenPairId(1);
        expectRevert(tx, "No token pair ID");
    });
    it("removeTokenPairId(not exist) from  admin", async () => {
        await ccd.addTokenPairId(1);
        let ret = await ccd.getAllWLTokenPairs();
        assert.deepStrictEqual([1],bigsToInts(ret));

        let tx =  ccd.removeTokenPairId(2);
        expectRevert(tx, "No token pair ID");
    });

    it("removeTokenPairId(exist) from  admin", async () => {
        await ccd.addTokenPairId(1);
        let ret = await ccd.getAllWLTokenPairs();
        assert.deepStrictEqual([1],bigsToInts(ret));

        await ccd.removeTokenPairId(1);
        ret = await ccd.getAllWLTokenPairs();
        assert.strictEqual(0,ret.length);
    });


    it("removeTokenPairIDs(exist) from  admin", async () => {
        await ccd.addTokenPairIDs([1,2,3]);
        let ret = await ccd.getAllWLTokenPairs();
        assert.deepStrictEqual([1,2,3],bigsToInts(ret));

        await ccd.removeTokenPairIDs([1,2]);
        ret = await ccd.getAllWLTokenPairs();
        assert.deepStrictEqual([3],bigsToInts(ret));
    });

    it("removeTokenPairIDs(exist) from  admin", async () => {
        await ccd.addTokenPairIDs([1,2,3]);
        let ret = await ccd.getAllWLTokenPairs();
        assert.deepStrictEqual([1,2,3],bigsToInts(ret));

        await ccd.removeTokenPairIDs([1,2,3]);
        ret = await ccd.getAllWLTokenPairs();
        assert.strictEqual(0,ret.length);
    });


    it("isValidTokenPair from  admin", async () => {
        let ret = await ccd.isValidTokenPair(1);
        assert.deepStrictEqual(ret,true);
    });

    it("isValidTokenPair from  admin", async () => {
        await ccd.turnOnProhibit();
        let ret = await ccd.isValidTokenPair(1);
        assert.deepStrictEqual(ret,false);
    });

    it("isValidTokenPair from  admin", async () => {
        await ccd.turnOnProhibit();
        await ccd.addTokenPairIDs([1,2,3]);
        let ret = await ccd.isValidTokenPair(1);
        assert.deepStrictEqual(ret,true);
    });

    it("isValidTokenPair from  admin", async () => {
        await ccd.turnOnProhibit();
        await ccd.addTokenPairIDs([1,2,3]);
        let ret = await ccd.isValidTokenPair(4);
        assert.deepStrictEqual(ret,false);
    });

    it("addTokenPairId twice from  admin", async () => {
        await ccd.addTokenPairId(1);
        let ret = await ccd.getAllWLTokenPairs();
        assert.deepStrictEqual([1],bigsToInts(ret));

        let tx =  ccd.addTokenPairId(1);
        expectRevert(tx,"Duplicate token pair ID");
    });

    it("clearWL  from  admin", async () => {
        await ccd.addTokenPairIDs([1,2,3,4]);
        let ret = await ccd.getAllWLTokenPairs();
        console.log("ret---",bigsToInts(ret));
        assert.deepStrictEqual([1,2,3,4],bigsToInts(ret));

        await ccd.clearWL();
        ret = await ccd.getAllWLTokenPairs();
        console.log("ret*****",bigsToInts(ret));
        assert.strictEqual(ret.length,0,"clearWL error");
    });
});
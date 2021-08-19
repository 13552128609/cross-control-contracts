const assert = require('assert');
const CrossControlDelegate = artifacts.require('CrossControlDelegate');
const {expectRevert, expectEvent} = require('@openzeppelin/test-helpers');
const BN = require("bignumber.js");

function bigsToInts(b) {
    let ret = [];
    for (let i = 0; i < b.length; i++) {
        ret.push(parseInt(b[i].toString(10)))
    }
    return ret;
}

contract('Test CrossControlDelegate', async (accounts) => {
    let superAdminAddr = accounts[0];
    let adminAddr = accounts[1];
    let adminAddr1 = accounts[2];
    let monitorAddr = accounts[3];
    let monitorAddr1 = accounts[4];
    let otherAddr = accounts[5];

    for (let i = 0; i < accounts.length; i++) {
        console.log("accounts[%d]:%s", i, accounts[i]);
    }

    let ccd;
    beforeEach(async () => {
        ccd = await CrossControlDelegate.new({from: accounts[0]});
        await ccd.initialize(superAdminAddr, adminAddr, monitorAddr);
    });

    it("getGlobalProhibit", async () => {
        let globalProhibit = await ccd.getGlobalProhibit();
        assert.strictEqual(globalProhibit, false);
    });

    it("turnOnProhibit from admin", async () => {
        await ccd.turnOnProhibit({from: adminAddr});
        let globalProhibitAfter = await ccd.getGlobalProhibit();
        assert.strictEqual(globalProhibitAfter, true);
    });

    it("turnOnProhibit from not admin (monitor)", async () => {
        let monitorRole = await ccd.MONITOR_ROLE();
        await ccd.grantRole(monitorRole, monitorAddr1, {from: adminAddr});

        await ccd.turnOnProhibit({from: monitorAddr1});
        let globalProhibitAfter = await ccd.getGlobalProhibit();
        assert.strictEqual(globalProhibitAfter, true);
    });

    it("turnOnProhibit from not admin (other)", async () => {
        let tx = ccd.turnOnProhibit({from: otherAddr});
        expectRevert(tx, "Nether admin Nor Monitor");
    });

    it("turnOnProhibit from admin(already turn on)", async () => {
        await ccd.turnOnProhibit({from: adminAddr});
        let tx = ccd.turnOnProhibit({from: adminAddr});
        expectRevert(tx, "already turn on");
    });


    it("turnOffProhibit from admin", async () => {
        await ccd.turnOnProhibit({from: adminAddr});
        await ccd.turnOffProhibit({from: adminAddr});
        let globalProhibitAfter = await ccd.getGlobalProhibit();
        assert.strictEqual(globalProhibitAfter, false);
    });

    it("turnOffProhibit already turn off", async () => {
        let tx = ccd.turnOffProhibit({from: adminAddr});
        expectRevert(tx, "already turn off");
    });

    it("turnOffProhibit from not admin (other))", async () => {
        await ccd.turnOnProhibit({from: adminAddr});
        let tx = ccd.turnOffProhibit({from: otherAddr});
        expectRevert(tx, "Not admin");
    });

    it("turnOffProhibit from not admin (monitor)", async () => {
        await ccd.turnOnProhibit({from: adminAddr});

        let tx = ccd.turnOffProhibit({from: otherAddr});
        expectRevert(tx, "Not admin");
    });


    it("addTokenPairId from  admin", async () => {
        await ccd.addTokenPairId(1, {from: adminAddr});
        let ret = await ccd.getAllWLTokenPairs();
        assert.deepStrictEqual([1], bigsToInts(ret));

    });

    it("addTokenPairIDs from  admin", async () => {
        await ccd.addTokenPairIDs([1, 2, 3], {from: adminAddr});
        let ret = await ccd.getAllWLTokenPairs();
        let ret1 = bigsToInts(ret);
        assert.deepStrictEqual([1, 2, 3], ret1);
    });

    it("addTokenPairId from  not admin", async () => {
        let tx = ccd.addTokenPairId(1, {from: otherAddr});
        expectRevert(tx, "Not admin");
    });

    it("removeTokenPairId(empty) from  admin ", async () => {
        let tx = ccd.removeTokenPairId(1, {from: adminAddr});
        expectRevert(tx, "No token pair ID");
    });
    it("removeTokenPairId(not exist) from  admin", async () => {
        await ccd.addTokenPairId(1, {from: adminAddr});
        let ret = await ccd.getAllWLTokenPairs();
        assert.deepStrictEqual([1], bigsToInts(ret));

        let tx = ccd.removeTokenPairId(2, {from: adminAddr});
        expectRevert(tx, "No token pair ID");
    });

    it("removeTokenPairId(exist) from  admin", async () => {
        await ccd.addTokenPairId(1, {from: adminAddr});
        let ret = await ccd.getAllWLTokenPairs();
        assert.deepStrictEqual([1], bigsToInts(ret));

        await ccd.removeTokenPairId(1, {from: adminAddr});
        ret = await ccd.getAllWLTokenPairs();
        assert.strictEqual(0, ret.length);
    });


    it("removeTokenPairIDs(exist) from  admin", async () => {
        await ccd.addTokenPairIDs([1, 2, 3], {from: adminAddr});
        let ret = await ccd.getAllWLTokenPairs();
        assert.deepStrictEqual([1, 2, 3], bigsToInts(ret));

        await ccd.removeTokenPairIDs([1, 2], {from: adminAddr});
        ret = await ccd.getAllWLTokenPairs();
        assert.deepStrictEqual([3], bigsToInts(ret));
    });

    it("removeTokenPairIDs(exist) from  admin", async () => {
        await ccd.addTokenPairIDs([1, 2, 3], {from: adminAddr});
        let ret = await ccd.getAllWLTokenPairs();
        assert.deepStrictEqual([1, 2, 3], bigsToInts(ret));

        await ccd.removeTokenPairIDs([1, 2, 3], {from: adminAddr});
        ret = await ccd.getAllWLTokenPairs();
        assert.strictEqual(0, ret.length);
    });


    it("isValidTokenPair from  other", async () => {
        let ret = await ccd.isValidTokenPair(1);
        assert.deepStrictEqual(ret, true);
    });

    it("isValidTokenPair from  other", async () => {
        await ccd.turnOnProhibit({from: adminAddr});
        let ret = await ccd.isValidTokenPair(1);
        assert.deepStrictEqual(ret, false);
    });

    it("isValidTokenPair from  admin", async () => {
        await ccd.turnOnProhibit({from: adminAddr});
        await ccd.addTokenPairIDs([1, 2, 3], {from: adminAddr});
        let ret = await ccd.isValidTokenPair(1);
        assert.deepStrictEqual(ret, true);
    });

    it("isValidTokenPair from  admin", async () => {
        await ccd.turnOnProhibit({from: adminAddr});
        await ccd.addTokenPairIDs([1, 2, 3], {from: adminAddr});
        let ret = await ccd.isValidTokenPair(4);
        assert.deepStrictEqual(ret, false);
    });

    it("addTokenPairId twice from  admin", async () => {
        await ccd.addTokenPairId(1, {from: adminAddr});
        let ret = await ccd.getAllWLTokenPairs();
        assert.deepStrictEqual([1], bigsToInts(ret));

        let tx = ccd.addTokenPairId(1, {from: adminAddr});
        expectRevert(tx, "Duplicate token pair ID");
    });

    it("clearWL  from  admin", async () => {
        await ccd.addTokenPairIDs([1, 2, 3, 4], {from: adminAddr});
        let ret = await ccd.getAllWLTokenPairs();
        assert.deepStrictEqual([1, 2, 3, 4], bigsToInts(ret));

        await ccd.clearWL({from: adminAddr});
        ret = await ccd.getAllWLTokenPairs();
        assert.strictEqual(ret.length, 0, "clearWL error");
    });

    it("Access test(admin transfer)", async () => {
        // old admin account[0]
        // new admin account[2]
        // monitor account[1]
        //let monitorRole = await ccd.MONITOR_ROLE();
        let adminRole = await ccd.ADMIN_ROLE();

        let hasAdminRole, hasMonitorRole;
        hasAdminRole = await ccd.hasRole(adminRole, adminAddr);
        assert.strictEqual(true, hasAdminRole, "has role error");

        hasAdminRole = await ccd.hasRole(adminRole, adminAddr1);
        assert.strictEqual(false, hasAdminRole, "has role error");

        await ccd.grantRole(adminRole, adminAddr1, {from: superAdminAddr});


        hasAdminRole = await ccd.hasRole(adminRole, adminAddr);
        assert.strictEqual(true, hasAdminRole, "has role error");

        hasAdminRole = await ccd.hasRole(adminRole, adminAddr1);
        assert.strictEqual(true, hasAdminRole, "has role error");
    });
});
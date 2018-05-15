let MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
let MiniMeToken = artifacts.require("MiniMeToken");
let BNC = artifacts.require("BNC");
const BigNumber = require("bignumber.js");
const assertFail = require("./helpers/assertFail");
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

let initialBalance = 100000000000000000000;
let amount =100;
let miniMeTokenFactory;
let bnc;
let MiniMeTokenObj;
let FakeBlockNumber = 200000000000000000000;

contract("MiniMeToken", function(accounts){
  beforeEach(async () => {
    let miniMeTokenFactory = await MiniMeTokenFactory.new({
      from: accounts[0]
    });
    MiniMeTokenObj = await MiniMeToken.new(
      miniMeTokenFactory.address, 
      0x0,               // no parent token
      FakeBlockNumber,   // no snapshot block number from parent
      "Random Token Name",  // Token name
      12,                // Decimals
      "XXX",             // Symbol
      true,
      { from: accounts[0]}
    );
    bnc = await BNC.new(miniMeTokenFactory.address, { from: accounts[0] });
    await bnc.enableTransfers(true, { from: accounts[0] }); //test enableTransfers function
  });
  describe("burnable functions:", function() {
    beforeEach(async () => {
      bnc.generateTokens(accounts[0], amount);
      bnc.generateTokens(accounts[1], amount);
    });

    it("transfer: should fail due to FakeBlockNumber larger than current block.number", async () => {      
      MiniMeTokenObj.generateTokens(accounts[0], amount);
      // assert.equal((await MiniMeTokenObj.balanceOf.call(accounts[0])).toNumber(), amount);
      assertFail( async () => {
        await MiniMeTokenObj.transfer(accounts[1], accounts);
      })
    })

    it("Controler and only controler can burn", async () => {
      assert.equal((await bnc.balanceOf.call(accounts[0])).toNumber(), initialBalance + amount);
      await bnc.destroyTokens(accounts[0], amount);
      assert.equal((await bnc.balanceOf.call(accounts[0])).toNumber(), initialBalance + amount);

      await bnc.changeController(accounts[9]);

      await assertFail(async () => {
        await bnc.destroyTokens(accounts[0], amount);
      });
      assert.equal((await bnc.balanceOf.call(accounts[0])).toNumber(), initialBalance + amount);
    });
  });

  describe("ERC20 functions: ", function() {
    beforeEach(async () => {
      bnc.generateTokens(accounts[0], amount);    
    });

    // CREATION
    it("creation: should have imported an initial balance of "+initialBalance+" from the old Token", async () => {
      assert.equal(
        (await bnc.balanceOf.call(accounts[0])).toNumber(),
        initialBalance + amount
      );
    });

    // TRANSERS
    it("transfer: should transfer "+ amount + " to accounts[1] with accounts[0] having "+initialBalance, async () => {
      watcher = bnc.Transfer();
      await bnc.transfer(accounts[1], amount, {
        from: accounts[0]
      });
      let logs = watcher.get();
      assert.equal(logs[0].event, "Transfer");
      assert.equal(logs[0].args._from, accounts[0]);
      assert.equal(logs[0].args._to, accounts[1]);
      assert.equal(logs[0].args._amount.toNumber(), amount);
      assert.equal((await bnc.balanceOf.call(accounts[0])).toNumber(), initialBalance - amount);
      assert.equal(
        (await bnc.balanceOf.call(accounts[1])).toNumber(),
        amount
      );
    });

    it('transfer: should throw if transferEnabled is false', async () => {
      await bnc.transfer(accounts[1], 0, {from:accounts[0]});
      await bnc.enableTransfers(false, { from: accounts[0] });
      await assertFail( async () =>{ await bnc.transfer(accounts[1], amount, {from: accounts[0] })});
    });

    it('transfer: should throw if _to is zero address', async () =>{
      await assertFail( async () =>{ await bnc.transfer(ZERO_ADDRESS,amount, {from: accounts[0]})});
    });

    it('transfer: should throw if controller is a contract and onTransfer returns false', async () =>{
      await bnc.changeController(bnc.address);
      await assertFail( async () =>{ await bnc.transfer(accounts[1], amount, {from:accounts[0]});})
    });

    // APPROVALS
    it("approvals: msg.sender should approve "+amount+" to accounts[1]", async () => {
      watcher = bnc.Approval();
      await bnc.approve(accounts[1], 100, { from: accounts[0] });
      let logs = watcher.get();
      assert.equal(logs[0].event, "Approval");
      assert.equal(logs[0].args._owner, accounts[0]);
      assert.equal(logs[0].args._spender, accounts[1]);
      assert.strictEqual(logs[0].args._amount.toNumber(), 100);

      assert.strictEqual(
        (await bnc.allowance.call(accounts[0], accounts[1])).toNumber(),
        100
      );
    });

    it('approvals: should throw if transferEnabled is false', async () =>{
      await bnc.enableTransfers(false, { from: accounts[0] });
      await assertFail( async () =>{ await bnc.approve(accounts[1], 100, { from: accounts[0] });})
    });

    it('approvals: should throw if _amount is 0', async () =>{
      await bnc.approve(accounts[1], 100, { from: accounts[0] });
      await assertFail( async () =>{ await bnc.approve(accounts[1], 200, { from: accounts[0] });})
    });

    it('approvals: should throw if controller is a describe and onTransfer returns false', async () =>{
      await bnc.changeController(bnc.address);
      await assertFail( async () =>{  await bnc.approve(accounts[1], 100, { from: accounts[0] });})
    });

    it("approvals: msg.sender approves accounts[1] of 100 & withdraws 20 once.", async () => {
      watcher = bnc.Transfer();
      await bnc.approve(accounts[1], amount, { from: accounts[0] });

      assert.strictEqual((await bnc.balanceOf.call(accounts[2])).toNumber(), 0);
      await bnc.transferFrom(accounts[0], accounts[2], amount/2, {
        from: accounts[1]
      });

      var logs = watcher.get();
      assert.equal(logs[0].event, "Transfer");
      assert.equal(logs[0].args._from, accounts[0]);
      assert.equal(logs[0].args._to, accounts[2]);
      assert.strictEqual(logs[0].args._amount.toNumber(), amount/2);

      assert.strictEqual(
        (await bnc.allowance.call(accounts[0], accounts[1])).toNumber(),
        amount/2
      );

      assert.strictEqual((await bnc.balanceOf.call(accounts[2])).toNumber(), amount/2);
      // await bnc.balanceOf.call(accounts[0]);
      assert.equal(
        (await bnc.balanceOf.call(accounts[0])).toNumber(),
        initialBalance - amount/2
      );
    });


    //should approve 100 of msg.sender & withdraw 50 & 60 (should fail).
    it("approvals: msg.sender approves accounts[1] of "+amount+" & withdraws "+amount/5+" & "+amount/2+" (2nd tx should fail)", async () => {
      await bnc.approve(accounts[1], amount, { from: accounts[0] });
      await bnc.transferFrom(accounts[0], accounts[2], amount/5, {
        from: accounts[1]
      });
      assert.strictEqual(
        (await bnc.allowance.call(accounts[0], accounts[1])).toNumber(),
        amount*4/5
      );

      assert.strictEqual((await bnc.balanceOf.call(accounts[2])).toNumber(), amount/5);

      assert.equal(
        (await bnc.balanceOf.call(accounts[0])).toNumber(),
        initialBalance-amount/5
      );
      await bnc.transferFrom.call(accounts[0], accounts[2], amount/2, {
        from: accounts[1]
      });
      assert.strictEqual((await bnc.balanceOf.call(accounts[2])).toNumber(), amount/5);
      assert.equal(
        (await bnc.balanceOf.call(accounts[0])).toNumber(),
        initialBalance - amount/5
      );
    });

    it("approvals: attempt withdrawal from account with no allowance (should fail)", async () => {
      await bnc.transferFrom.call(accounts[0], accounts[2], amount, {
        from: accounts[1]
      });
      assert.equal(
        (await bnc.balanceOf.call(accounts[0])).toNumber(),
        initialBalance
      );
    });

    it("approvals: allow accounts[1] "+amount+" to withdraw from accounts[0]. Withdraw 60 and then approve 0 & attempt transfer.", async () => {
      await bnc.approve(accounts[1], amount, { from: accounts[0] });
      await bnc.transferFrom(accounts[0], accounts[2], amount/2, {
        from: accounts[1]
      });
      await bnc.approve(accounts[1], 0, { from: accounts[0] });
      await bnc.transferFrom.call(accounts[0], accounts[2], amount/2, {
        from: accounts[1]
      });
      assert.equal(
        (await bnc.balanceOf.call(accounts[0])).toNumber(),
        initialBalance - amount/2
      );
    });

    it('transferFrom: if transferEnabled is false, it should throw.', async () => {
      await bnc.approve(accounts[1], amount, { from: accounts[0] });
      await bnc.enableTransfers(false, {from : accounts[0]});
      await assertFail( await bnc.transferFrom(accounts[0], accounts[1], amount/2));
    })

    it('transferFrom: it should throw if mas.sender is non-controller and transferEnabled is false, ', async () => {
      await bnc.approve(accounts[1], amount, { from: accounts[0] });
      await bnc.enableTransfers(false, {from : accounts[0]});
      await bnc.changeController(accounts[9]);
      await assertFail( async () => {await bnc.transferFrom(accounts[0], accounts[1], amount/2,{from: accounts[1]} )});
    })

    it('approveAndCall: it should throw if approve fails.', async () => {
      await bnc.enableTransfers(false, {from : accounts[0]});
      await assertFail( async () => { await bnc.approveAndCall(accounts[1], amount, '');});
    })

    it('totalSupply: should get the total supply at current block number.', async () => {
      let totalSupply = (await bnc.totalSupply.call()).toNumber();
      assert.equal(totalSupply, initialBalance + amount);
      await bnc.generateTokens(accounts[1], amount);
      totalSupply = (await bnc.totalSupply.call()).toNumber();
      assert.equal(totalSupply, initialBalance + amount *2);
    });

    it('totalSupplyAt: should get the total supply at history block number.', async () => {
      await bnc.generateTokens(accounts[1], amount);
      let blockNumber;
      blockNumber = web3.eth.blockNumber;  
      let totalSupplyAt = (await bnc.totalSupplyAt.call(blockNumber-1)).toNumber();
      assert.equal(totalSupplyAt, initialBalance + amount);
    })

    it('totalSupplyAt: should get the total supply at block 1.', async () => {
      let totalSupplyAt = (await bnc.totalSupplyAt.call(1)).toNumber();
      assert.equal(totalSupplyAt, 0);
    })
  });


  describe("Clonable functions: ", function() {
    beforeEach(async () => {
      amount = 100;
      miniMeTokenFactory = await MiniMeTokenFactory.new({ from: accounts[0] });
      bnc.generateTokens(accounts[0], amount);
    });

    it("A cloned Token will keep the original Token's transaction history", async () => {
      await bnc.transfer(accounts[1], amount);

      assert.equal(
        (await bnc.balanceOf.call(accounts[0])).toNumber(),
        (initialBalance + amount),
        (initialBalance + amount) + " wasn't in the first account after the transfer"
      );

      let bnc2 = BNC.at(
        (await bnc.createCloneToken(
          "Mothership Token Clone",
          18,
          "BNCC",
          web3.eth.blockNumber,
          true
        )).logs[0].args._cloneToken
      );

      assert.equal(
        (await bnc2.balanceOf.call(accounts[0])).toNumber(),
        initialBalance + amount,
        amount + " wasn't in the first account after the clone process"
      );

      assert.equal(
        (await bnc2.balanceOf.call(accounts[1])).toNumber(),
        amount,
        amount + " wasn't in the second account after the clone process"
      );

      assert.equal(
        await bnc2.name.call(),
        "Mothership Token Clone",
        "Mothership Token Clone isn't the cloned token's name."
      );

      assert.equal(
        await bnc2.symbol.call(),
        "BNCC",
        "BNCC isn't the cloned token's symbol."
      );

      assert.equal(
        (await bnc2.decimals.call()).toNumber(),
        18,
        "18 isn't the cloned token's decimals"
      );
    });

    it("A cloned Token can be cloned without calling createCloneToken", async () => {
      await bnc.transfer(accounts[1], amount);

      assert.equal(
        (await bnc.balanceOf.call(accounts[0])).toNumber(),
        initialBalance + amount,
        amount + " wasn't in the first account after the transfer"
      );

      let bnc2 = await MiniMeToken.new(
        miniMeTokenFactory.address,
        bnc.address,
        web3.eth.blockNumber,
        "Mothership Token Clone",
        18,
        "BNCC",
        true
      );

      assert.equal(
        (await bnc2.balanceOf.call(accounts[0])).toNumber(),
        initialBalance + amount,
        amount + " wasn't in the first account after the clone process"
      );

      assert.equal(
        (await bnc2.balanceOf.call(accounts[1])).toNumber(),
        amount,
        amount + " wasn't in the second account after the clone process"
      );

      assert.equal(
        await bnc2.name.call(),
        "Mothership Token Clone",
        "Mothership Token Clone isn't the cloned token's name."
      );

      assert.equal(
        await bnc2.symbol.call(),
        "BNCC",
        "BNCC isn't the cloned token's symbol."
      );

      assert.equal(
        (await bnc2.decimals.call()).toNumber(),
        18,
        "18 isn't the cloned token's decimals"
      );
    });
  });


  describe("mintable function: ", function() {
    it("Controller and only controller can mint", async () => {
      await bnc.generateTokens(accounts[0], amount);  //test generateTokens function
      assert.equal((await bnc.balanceOf.call(accounts[0])).toNumber(), initialBalance + amount);

      await bnc.changeController(accounts[9]);  //test changeController function

      await assertFail(async () => {
        await bnc.generateTokens(accounts[0], amount);
      });

      assert.equal((await bnc.balanceOf.call(accounts[0])).toNumber(), initialBalance + amount);
    });
  });
});
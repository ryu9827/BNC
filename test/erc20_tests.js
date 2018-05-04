let MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
let BNC = artifacts.require("BNC");
const BigNumber = require("bignumber.js");
const assertFail = require("./helpers/assertFail");
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

let miniMeTokenFactory;
let bnc;

contract("ERC20 functions: ", function(accounts) {
  beforeEach(async () => {
    miniMeTokenFactory = await MiniMeTokenFactory.new({ from: accounts[0] });
    bnc = await BNC.new(miniMeTokenFactory.address, { from: accounts[0] });
    await bnc.enableTransfers(true, { from: accounts[0] });
    bnc.generateTokens(accounts[0], 100000000000000000000);
    // await bnc.changeController("0x0"); //don't get it. change the controller from current account address to 0x0?
  });

  // CREATION
  it("creation: should have imported an initial balance of 200000000000000000000 from the old Token", async () => {
    assert.equal(
      (await bnc.balanceOf.call(accounts[0])).toNumber(),
      200000000000000000000
    );
  });

  // TRANSERS
  it("transfers: should transfer 100000000000000000000 to accounts[1] with accounts[0] having 100000000000000000000", async () => {
    watcher = bnc.Transfer();
    await bnc.transfer(accounts[1], 100000000000000000000, {
      from: accounts[0]
    });
    let logs = watcher.get();
    assert.equal(logs[0].event, "Transfer");
    assert.equal(logs[0].args._from, accounts[0]);
    assert.equal(logs[0].args._to, accounts[1]);
    assert.equal(logs[0].args._amount.toNumber(), 100000000000000000000);
    assert.equal((await bnc.balanceOf.call(accounts[0])).toNumber(), 100000000000000000000);
    assert.equal(
      (await bnc.balanceOf.call(accounts[1])).toNumber(),
      100000000000000000000
    );
  });

  // it("transfers: should fail when trying to transfer 100000000000000000001 to accounts[1] with accounts[0] having 100000000000000000000", async () => {
  //   await assertFail(async () => {
  //     await bnc.transfer(
  //       accounts[1],
  //       new BigNumber(web3.toWei(200000000000000000001)),
  //       {
  //         from: accounts[0]
  //       }
  //     );
  //   })
  //   assert.equal(
  //     (await bnc.balanceOf.call(accounts[0])).toNumber(),
  //     200000000000000000000
  //   );
  // });

  it('transfer: should throw if transferEnabled is false', async () => {
    await bnc.transfer(accounts[1], 0, {from:accounts[0]});
    await bnc.enableTransfers(false, { from: accounts[0] });
    await assertFail( async () =>{ await bnc.transfer(accounts[1], 50000000000, {from: accounts[0] })});
  });

  it('transfer: should throw if _to is zero address', async () =>{
    await assertFail( async () =>{ await bnc.transfer(ZERO_ADDRESS,50000000000, {from: accounts[0]})});
  });

  // it.only('transfer: should throw if previous blanace is less than _amount', async () =>{
  //   await bnc.transfer(accounts[1], 60000000000000000000);
  //   let result = await bnc.transfer.call(accounts[1], 4000000000000000000);
  //   assert.equal(result, false)
  // });

  it('transfer: should throw if controller is a contract and onTransfer returns false', async () =>{
    await bnc.changeController(bnc.address);
    await assertFail( async () =>{ await bnc.transfer(accounts[1], 50000000000, {from:accounts[0]});})
  });

  // APPROVALS
  it("approvals: msg.sender should approve 100 to accounts[1]", async () => {
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

  it('approvals: should throw if controller is a contract and onTransfer returns false', async () =>{
    await bnc.changeController(bnc.address);
    await assertFail( async () =>{  await bnc.approve(accounts[1], 100, { from: accounts[0] });})
  });

  it("approvals: msg.sender approves accounts[1] of 100 & withdraws 20 once.", async () => {
    watcher = bnc.Transfer();
    await bnc.approve(accounts[1], 100, { from: accounts[0] });

    assert.strictEqual((await bnc.balanceOf.call(accounts[2])).toNumber(), 0);
    await bnc.transferFrom(accounts[0], accounts[2], 20, {
      from: accounts[1]
    });

    var logs = watcher.get();
    assert.equal(logs[0].event, "Transfer");
    assert.equal(logs[0].args._from, accounts[0]);
    assert.equal(logs[0].args._to, accounts[2]);
    assert.strictEqual(logs[0].args._amount.toNumber(), 20);

    assert.strictEqual(
      (await bnc.allowance.call(accounts[0], accounts[1])).toNumber(),
      80
    );

    assert.strictEqual((await bnc.balanceOf.call(accounts[2])).toNumber(), 20);
    await bnc.balanceOf.call(accounts[0]);
    assert.equal(
      (await bnc.balanceOf.call(accounts[0])).toNumber(),
      200000000000000000000
    );
  });

  it("approvals: msg.sender approves accounts[1] of 100 & withdraws 20 twice.", async () => {
    await bnc.approve(accounts[1], 100, { from: accounts[0] });
    await bnc.transferFrom(accounts[0], accounts[2], 20, {
      from: accounts[1]
    });
    await bnc.transferFrom(accounts[0], accounts[2], 20, {
      from: accounts[1]
    });
    await bnc.allowance.call(accounts[0], accounts[1]);

    assert.strictEqual(
      (await bnc.allowance.call(accounts[0], accounts[1])).toNumber(),
      60
    );

    assert.strictEqual((await bnc.balanceOf.call(accounts[2])).toNumber(), 40);

    assert.equal(
      (await bnc.balanceOf.call(accounts[0])).toNumber(),
      200000000000000000000
    );
  });

  //should approve 100 of msg.sender & withdraw 50 & 60 (should fail).
  it("approvals: msg.sender approves accounts[1] of 100 & withdraws 50 & 60 (2nd tx should fail)", async () => {
    await bnc.approve(accounts[1], 100, { from: accounts[0] });
    await bnc.transferFrom(accounts[0], accounts[2], 50, {
      from: accounts[1]
    });
    assert.strictEqual(
      (await bnc.allowance.call(accounts[0], accounts[1])).toNumber(),
      50
    );

    assert.strictEqual((await bnc.balanceOf.call(accounts[2])).toNumber(), 50);

    assert.equal(
      (await bnc.balanceOf.call(accounts[0])).toNumber(),
      200000000000000000000
    );
    await bnc.transferFrom.call(accounts[0], accounts[2], 60, {
      from: accounts[1]
    });
    assert.strictEqual((await bnc.balanceOf.call(accounts[2])).toNumber(), 50);
    assert.equal(
      (await bnc.balanceOf.call(accounts[0])).toNumber(),
      200000000000000000000
    );
  });

  it("approvals: attempt withdrawal from account with no allowance (should fail)", async () => {
    await bnc.transferFrom.call(accounts[0], accounts[2], 60, {
      from: accounts[1]
    });
    assert.equal(
      (await bnc.balanceOf.call(accounts[0])).toNumber(),
      200000000000000000000
    );
  });

  it("approvals: allow accounts[1] 100 to withdraw from accounts[0]. Withdraw 60 and then approve 0 & attempt transfer.", async () => {
    await bnc.approve(accounts[1], 100, { from: accounts[0] });
    await bnc.transferFrom(accounts[0], accounts[2], 60, {
      from: accounts[1]
    });
    await bnc.approve(accounts[1], 0, { from: accounts[0] });
    await bnc.transferFrom.call(accounts[0], accounts[2], 10, {
      from: accounts[1]
    });
    assert.equal(
      (await bnc.balanceOf.call(accounts[0])).toNumber(),
      200000000000000000000
    );
  });

  it('transferFrom: if transferEnabled is false, it should throw.', async () => {
    await bnc.approve(accounts[1], 100, { from: accounts[0] });
    await bnc.enableTransfers(false, {from : accounts[0]});
    await assertFail( await bnc.transferFrom(accounts[0], accounts[1], 50));
  })

  // it('approveAndCall: data should be stored.', async () => {
  //   // await bnc.approve(accounts[1], 100, { from: accounts[0] });
  //   let result = await bnc.approveAndCall(accounts[1], 100, '', { from: accounts[0] });
  //   assert.equal(result, true);
  // })

  it('approveAndCall: it should throw if approve fails.', async () => {
    await bnc.enableTransfers(false, {from : accounts[0]});
    await assertFail( async () => { await bnc.approveAndCall(accounts[1], 100, '');});
  })

  it('totalSupply: should get the total supply at current block number.', async () => {
    let totalSupply = (await bnc.totalSupply.call()).toNumber();
    assert.equal(totalSupply, 200000000000000000000);
    await bnc.generateTokens(accounts[1], 100000000000000000000);
    totalSupply = (await bnc.totalSupply.call()).toNumber();
    assert.equal(totalSupply, 300000000000000000000);
  })
});

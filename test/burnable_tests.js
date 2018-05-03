let MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
let BNC = artifacts.require("BNC");

const assertFail = require("./helpers/assertFail");

let bnc;
let initialBalance = 100000000000000000000;

contract("BNC", function(accounts) {
  beforeEach(async () => {
    let miniMeTokenFactory = await MiniMeTokenFactory.new({
      from: accounts[0]
    });
    bnc = await BNC.new(miniMeTokenFactory.address, { from: accounts[0] });
    await bnc.enableTransfers(true, { from: accounts[0] });
    bnc.generateTokens(accounts[0], 50100);
    bnc.generateTokens(accounts[1], 50100);
  });

  it("Controler and only controler can burn", async () => {
    assert.equal((await bnc.balanceOf.call(accounts[0])).toNumber(), initialBalance + 50100);
    await bnc.destroyTokens(accounts[0], 100);
    assert.equal((await bnc.balanceOf.call(accounts[0])).toNumber(), initialBalance + 50000);

    await bnc.changeController(accounts[9]);

    await assertFail(async () => {
      await bnc.destroyTokens(accounts[0], 50000);
    });
    assert.equal((await bnc.balanceOf.call(accounts[0])).toNumber(), initialBalance + 50000);
  });

  // it.only("Burner can also burn it's own tokens", async () => {
  //   await bnc.changeController(accounts[0]);
  //   // await contribution.initialize(bnc.address);

  //   await bnc.destroyTokens(accounts[0], 50100);
  //   console.log((await bnc.balanceOf.call(accounts[0])).toNumber());
    
  //   assert.equal((await bnc.balanceOf.call(accounts[0])).toNumber(), initialBalance - 50100);

  //   await assertFail(async () => {
  //     await bnc.destroyTokens(accounts[1], 50100);
  //   });
  //   assert.equal((await bnc.balanceOf.call(accounts[1])).toNumber(), 50100);
  // });
});

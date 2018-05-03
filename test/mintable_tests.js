let MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
// let LeanContribution = artifacts.require("LeanContribution");
let BNC = artifacts.require("BNC");

const assertFail = require("./helpers/assertFail");

let bnc;
let contribution;
let initialBalance = 100000000000000000000;

contract("BNC", function(accounts) {
  beforeEach(async () => {
    let miniMeTokenFactory = await MiniMeTokenFactory.new({
      from: accounts[0]
    });
    bnc = await BNC.new(miniMeTokenFactory.address, { from: accounts[0] });
    await bnc.enableTransfers(true, { from: accounts[0] }); //test enableTransfers function
  });

  it("Controler and only controler can mint", async () => {
    await bnc.generateTokens(accounts[0], 100);  //test generateTokens function
    assert.equal((await bnc.balanceOf.call(accounts[0])).toNumber(), initialBalance + 100);

    await bnc.changeController(accounts[9]);  //test changeController function

    await assertFail(async () => {
      await bnc.generateTokens(accounts[0], 50000);
    });

    assert.equal((await bnc.balanceOf.call(accounts[0])).toNumber(), initialBalance + 100);
  });
});

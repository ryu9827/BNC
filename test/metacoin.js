var MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
var BNC = artifacts.require("BNC");

contract("BNC", function(accounts) {
  it("should put 10000 MetaCoin in the first account", async function() {
    let bnc = await BNC.new(MiniMeTokenFactory.address);
    assert.equal(
      (await bnc.balanceOf.call(accounts[0])).toNumber(),
      100000000000000000000,
      "100000000000000000000 is supposed to be the initial value"
    );

    assert.equal(
      await bnc.name.call(),
      "Brave New Coin",
      "Brave New Coin wasn't in the first account"
    );

    assert.equal(
      await bnc.symbol.call(),
      "BNC",
      "BNC wasn't in the first account"
    );

    assert.equal(
      (await bnc.decimals.call()).toNumber(),
      12,
      "BNC wasn't in the first account"
    );
  });

  it("should put 10000 MetaCoin in the first account", async function() {
    let bnc = await BNC.new(MiniMeTokenFactory.address);
    bnc.transfer(accounts[1], 50000000000000000000);
    assert.equal(
      (await bnc.balanceOf.call(accounts[0])).toNumber(),
      50000000000000000000,
      "50000000000000000000 wasn't in the first account"
    );

    let bnc2 = BNC.at(
      (await bnc.createCloneToken(
        "Brave New Coin Clone",
        12,
        "BNCC",
        web3.eth.blockNumber,
        true
      )).logs[0].args._cloneToken
    );

    assert.equal(
      (await bnc2.balanceOf.call(accounts[0])).toNumber(),
      50000000000000000000,
      "50000000000000000000 wasn't in the first account"
    );

    assert.equal(
      (await bnc2.balanceOf.call(accounts[1])).toNumber(),
      50000000000000000000,
      "50000000000000000000 wasn't in the first account"
    );

    assert.equal(
      await bnc2.name.call(),
      "Brave New Coin Clone",
      "Brave New Coin wasn't in the first account"
    );

    assert.equal(
      await bnc2.symbol.call(),
      "BNCC",
      "BNC wasn't in the first account"
    );

    assert.equal(
      (await bnc2.decimals.call()).toNumber(),
      12,
      "BNC wasn't in the first account"
    );
  });
});

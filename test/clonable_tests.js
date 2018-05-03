let MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
let MiniMeToken = artifacts.require("MiniMeToken");
let BNC = artifacts.require("BNC");

let miniMeTokenFactory;
let bnc;
let initialBalance = 100000000000000000000;

contract("BNC", function(accounts) {
  beforeEach(async () => {
    miniMeTokenFactory = await MiniMeTokenFactory.new({ from: accounts[0] });
    bnc = await BNC.new(miniMeTokenFactory.address, { from: accounts[0] });
    await bnc.enableTransfers(true, { from: accounts[0] });
    bnc.generateTokens(accounts[0], 100000000000000000000);
  });

  it("A cloned Token will keep the original Token's transaction history", async () => {
    await bnc.transfer(accounts[1], 50000000000000000000);

    assert.equal(
      (await bnc.balanceOf.call(accounts[0])).toNumber(),
      (initialBalance + 50000000000000000000),
      "150.000.000.000.000.000.000 wasn't in the first account after the transfer"
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
      initialBalance + 50000000000000000000,
      "50.000.000.000.000.000.000 wasn't in the first account after the clone process"
    );

    assert.equal(
      (await bnc2.balanceOf.call(accounts[1])).toNumber(),
      50000000000000000000,
      "50.000.000.000.000.000.000 wasn't in the second account after the clone process"
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

  it("A cloned Token can be cloned whithout the calling createCloneToken", async () => {
    await bnc.transfer(accounts[1], 50000000000000000000);

    assert.equal(
      (await bnc.balanceOf.call(accounts[0])).toNumber(),
      initialBalance + 50000000000000000000,
      "50.000.000.000.000.000.000 wasn't in the first account after the transfer"
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
      initialBalance + 50000000000000000000,
      "50.000.000.000.000.000.000 wasn't in the first account after the clone process"
    );

    assert.equal(
      (await bnc2.balanceOf.call(accounts[1])).toNumber(),
      50000000000000000000,
      "50.000.000.000.000.000.000 wasn't in the second account after the clone process"
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

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ConnectWalletTest", function() {
  let connectWalletTest;
  let owner;
  let user1;
  let user2;
  
  beforeEach(async function() {
    [owner, user1, user2] = await ethers.getSigners();
    const ConnectWalletTest = await ethers.getContractFactory("ConnectWalletTest");
    connectWalletTest = await ConnectWalletTest.deploy();
  });

  describe("Basic Functionality", function() {
    it("should set the correct owner on deployment", async function() {
      expect(await connectWalletTest.owner()).to.equal(owner.address);
    });

    it("should emit WalletConnected event when connecting", async function() {
      await expect(connectWalletTest.connectWalletTest())
        .to.emit(connectWalletTest, "WalletConnected")
        .withArgs(owner.address);
    });

    it("should emit WalletConnected with correct user address when connecting from different account", async function() {
      await expect(connectWalletTest.connect(user1).connectWalletTest())
        .to.emit(connectWalletTest, "WalletConnected")
        .withArgs(user1.address);
      
      await expect(connectWalletTest.connect(user2).connectWalletTest())
        .to.emit(connectWalletTest, "WalletConnected")
        .withArgs(user2.address);
    });
  });
}); 
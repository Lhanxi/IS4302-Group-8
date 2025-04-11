const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ResearchAccess", function() {
  let researchAccess;
  let owner;
  
  beforeEach(async function() {
    [owner] = await ethers.getSigners();
    const ResearchAccess = await ethers.getContractFactory("ResearchAccess");
    researchAccess = await ResearchAccess.deploy();
  });

  describe("CID Management", function() {
    it("should add a CID successfully", async function() {
      const testCID = "test-cid-ipfs-hash";
      await researchAccess.addCID(testCID);
      
      const cids = await researchAccess.getCIDs();
      expect(cids.length).to.equal(1);
      expect(cids[0]).to.equal(testCID);
    });

    it("should add multiple CIDs", async function() {
      const testCID1 = "test-cid-ipfs-hash-1";
      const testCID2 = "test-cid-ipfs-hash-2";
      
      await researchAccess.addCID(testCID1);
      await researchAccess.addCID(testCID2);
      
      const cids = await researchAccess.getCIDs();
      expect(cids.length).to.equal(2);
      expect(cids[0]).to.equal(testCID1);
      expect(cids[1]).to.equal(testCID2);
    });

    it("should allow access to individual CIDs by index", async function() {
      const testCID1 = "test-cid-ipfs-hash-1";
      const testCID2 = "test-cid-ipfs-hash-2";
      
      await researchAccess.addCID(testCID1);
      await researchAccess.addCID(testCID2);
      
      expect(await researchAccess.CID(0)).to.equal(testCID1);
      expect(await researchAccess.CID(1)).to.equal(testCID2);
    });

    it("should revert when accessing CID with invalid index", async function() {
      const testCID = "test-cid-ipfs-hash";
      await researchAccess.addCID(testCID);
      
      await expect(researchAccess.CID(1)).to.be.reverted;
    });
  });
}); 
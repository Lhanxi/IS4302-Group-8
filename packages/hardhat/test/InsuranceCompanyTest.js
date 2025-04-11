const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Insurance Company Contracts Tests", function() {
  // Test InsuranceCompanyOracle Contract
  describe("InsuranceCompanyOracle", function() {
    let insuranceCompanyOracle;
    let owner;
    let insuranceCompany1;
    let insuranceCompany2;
    
    beforeEach(async function() {
      [owner, insuranceCompany1, insuranceCompany2] = await ethers.getSigners();
      const InsuranceCompanyOracle = await ethers.getContractFactory("InsuranceCompanyOracle");
      insuranceCompanyOracle = await InsuranceCompanyOracle.deploy();
    });

    describe("Basic Functionality", function() {
      it("should set the correct owner on deployment", async function() {
        expect(await insuranceCompanyOracle.owner()).to.equal(owner.address);
      });

      it("should add an insurance company successfully", async function() {
        await insuranceCompanyOracle.addInsuranceCompany(insuranceCompany1.address, "Insurance Co A");
        expect(await insuranceCompanyOracle.verifyInsuranceCompany(insuranceCompany1.address)).to.be.true;
        expect(await insuranceCompanyOracle.insuranceCompanyName(insuranceCompany1.address)).to.equal("Insurance Co A");
      });

      it("should not allow adding insurance company with empty name", async function() {
        await expect(insuranceCompanyOracle.addInsuranceCompany(insuranceCompany1.address, ""))
          .to.be.revertedWith("Insurance company name must be non-empty");
      });

      it("should remove an insurance company successfully", async function() {
        await insuranceCompanyOracle.addInsuranceCompany(insuranceCompany1.address, "Insurance Co A");
        await insuranceCompanyOracle.removeDoctor(insuranceCompany1.address);
        expect(await insuranceCompanyOracle.verifyInsuranceCompany(insuranceCompany1.address)).to.be.false;
        expect(await insuranceCompanyOracle.insuranceCompanyName(insuranceCompany1.address)).to.equal("");
      });
    });

    describe("Batch Operations", function() {
      it("should batch add insurance companies successfully", async function() {
        const companies = [insuranceCompany1.address, insuranceCompany2.address];
        const names = ["Insurance Co A", "Insurance Co B"];
        await insuranceCompanyOracle.batchAddInsuranceCompany(companies, names);
        
        expect(await insuranceCompanyOracle.verifyInsuranceCompany(insuranceCompany1.address)).to.be.true;
        expect(await insuranceCompanyOracle.verifyInsuranceCompany(insuranceCompany2.address)).to.be.true;
        expect(await insuranceCompanyOracle.insuranceCompanyName(insuranceCompany1.address)).to.equal("Insurance Co A");
        expect(await insuranceCompanyOracle.insuranceCompanyName(insuranceCompany2.address)).to.equal("Insurance Co B");
      });

      it("should fail batch add if arrays have different lengths", async function() {
        const companies = [insuranceCompany1.address, insuranceCompany2.address];
        const names = ["Insurance Co A"];
        await expect(insuranceCompanyOracle.batchAddInsuranceCompany(companies, names))
          .to.be.revertedWith("Input arrays must have the same length");
      });

      it("should batch remove insurance companies successfully", async function() {
        const companies = [insuranceCompany1.address, insuranceCompany2.address];
        const names = ["Insurance Co A", "Insurance Co B"];
        await insuranceCompanyOracle.batchAddInsuranceCompany(companies, names);
        await insuranceCompanyOracle.batchRemoveInsuranceCompany(companies);
        
        expect(await insuranceCompanyOracle.verifyInsuranceCompany(insuranceCompany1.address)).to.be.false;
        expect(await insuranceCompanyOracle.verifyInsuranceCompany(insuranceCompany2.address)).to.be.false;
        expect(await insuranceCompanyOracle.insuranceCompanyName(insuranceCompany1.address)).to.equal("");
        expect(await insuranceCompanyOracle.insuranceCompanyName(insuranceCompany2.address)).to.equal("");
      });
    });

    describe("Access Control", function() {
      it("should only allow owner to add insurance companies", async function() {
        await expect(insuranceCompanyOracle.connect(insuranceCompany1).addInsuranceCompany(insuranceCompany2.address, "Insurance Co B"))
          .to.be.revertedWith("Not authorized");
      });

      it("should only allow owner to remove insurance companies", async function() {
        await insuranceCompanyOracle.addInsuranceCompany(insuranceCompany1.address, "Insurance Co A");
        await expect(insuranceCompanyOracle.connect(insuranceCompany2).removeDoctor(insuranceCompany1.address))
          .to.be.revertedWith("Not authorized");
      });
    });

    describe("Events", function() {
      it("should emit InsuranceCompanyAdded event when adding a company", async function() {
        await expect(insuranceCompanyOracle.addInsuranceCompany(insuranceCompany1.address, "Insurance Co A"))
          .to.emit(insuranceCompanyOracle, "InsuranceCompanyAdded")
          .withArgs(insuranceCompany1.address, "Insurance Co A");
      });

      it("should emit InsuranceCompanyRemoved event when removing a company", async function() {
        await insuranceCompanyOracle.addInsuranceCompany(insuranceCompany1.address, "Insurance Co A");
        await expect(insuranceCompanyOracle.removeDoctor(insuranceCompany1.address))
          .to.emit(insuranceCompanyOracle, "InsuranceCompanyRemoved")
          .withArgs(insuranceCompany1.address);
      });
    });
  });

  // Test InsuranceCompany Contract
  describe("InsuranceCompany", function() {
    let InsuranceCompany;
    let insuranceCompany;
    let owner;
    
    const publicKey = "test-public-key";

    beforeEach(async function() {
      [owner] = await ethers.getSigners();
      InsuranceCompany = await ethers.getContractFactory("InsuranceCompany");
      insuranceCompany = await InsuranceCompany.deploy(publicKey);
    });

    it("should store and return the correct public key", async function() {
      expect(await insuranceCompany.getPublicKey()).to.equal(publicKey);
    });
  });

  // Test InsuranceCompanyHandler Contract
  describe("InsuranceCompanyHandler", function() {
    it("needs modification for testability like DoctorHandler", function() {
      // The InsuranceCompanyHandler contract has the same limitation as DoctorHandler
      // where removeInsuranceCompany can only be called by the contract itself:
      //
      // function removeInsuranceCompany(address _insuranceCompany) public {
      //     require(msg.sender == address(this), "Only contract can call this function");
      //     delete insuranceCompanyContracts[_insuranceCompany];
      //     emit InsuranceCompanyAuthenticationRemoved(_insuranceCompany);
      // }
      //
      // To make it testable, we would need to modify it like the DoctorHandler:
      //
      // function removeInsuranceCompany(address _insuranceCompany) public {
      //     require(msg.sender == address(this) || msg.sender == owner, 
      //             "Only contract or owner can call this function");
      //     delete insuranceCompanyContracts[_insuranceCompany];
      //     emit InsuranceCompanyAuthenticationRemoved(_insuranceCompany);
      // }
    });
  });
}); 
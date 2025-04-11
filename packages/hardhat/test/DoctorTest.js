const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Doctor Contracts Tests", function() {
  // Test DoctorOracle Contract
  describe("DoctorOracle", function() {
    let doctorOracle;
    let owner;
    let doctor1;
    let doctor2;
    
    beforeEach(async function() {
      [owner, doctor1, doctor2] = await ethers.getSigners();
      const DoctorOracle = await ethers.getContractFactory("DoctorOracle");
      doctorOracle = await DoctorOracle.deploy();
    });

    describe("Basic Functionality", function() {
      it("should set the correct owner on deployment", async function() {
        expect(await doctorOracle.owner()).to.equal(owner.address);
      });

      it("should add a doctor successfully", async function() {
        await doctorOracle.addDoctor(doctor1.address, "Dr. Smith");
        expect(await doctorOracle.verifyDoctor(doctor1.address)).to.be.true;
        expect(await doctorOracle.doctorName(doctor1.address)).to.equal("Dr. Smith");
      });

      it("should not allow adding doctor with empty name", async function() {
        await expect(doctorOracle.addDoctor(doctor1.address, ""))
          .to.be.revertedWith("Doctor name must be non-empty");
      });

      it("should remove a doctor successfully", async function() {
        await doctorOracle.addDoctor(doctor1.address, "Dr. Smith");
        await doctorOracle.removeDoctor(doctor1.address);
        expect(await doctorOracle.verifyDoctor(doctor1.address)).to.be.false;
        expect(await doctorOracle.doctorName(doctor1.address)).to.equal("");
      });
    });

    describe("Batch Operations", function() {
      it("should batch add doctors successfully", async function() {
        const doctors = [doctor1.address, doctor2.address];
        const names = ["Dr. Smith", "Dr. Jones"];
        await doctorOracle.batchAddDoctor(doctors, names);
        
        expect(await doctorOracle.verifyDoctor(doctor1.address)).to.be.true;
        expect(await doctorOracle.verifyDoctor(doctor2.address)).to.be.true;
        expect(await doctorOracle.doctorName(doctor1.address)).to.equal("Dr. Smith");
        expect(await doctorOracle.doctorName(doctor2.address)).to.equal("Dr. Jones");
      });

      it("should fail batch add if arrays have different lengths", async function() {
        const doctors = [doctor1.address, doctor2.address];
        const names = ["Dr. Smith"];
        await expect(doctorOracle.batchAddDoctor(doctors, names))
          .to.be.revertedWith("Input arrays must have the same length");
      });

      it("should batch remove doctors successfully", async function() {
        const doctors = [doctor1.address, doctor2.address];
        const names = ["Dr. Smith", "Dr. Jones"];
        await doctorOracle.batchAddDoctor(doctors, names);
        await doctorOracle.batchRemoveDoctor(doctors);
        
        expect(await doctorOracle.verifyDoctor(doctor1.address)).to.be.false;
        expect(await doctorOracle.verifyDoctor(doctor2.address)).to.be.false;
        expect(await doctorOracle.doctorName(doctor1.address)).to.equal("");
        expect(await doctorOracle.doctorName(doctor2.address)).to.equal("");
      });
    });

    describe("Access Control", function() {
      it("should only allow owner to add doctors", async function() {
        await expect(doctorOracle.connect(doctor1).addDoctor(doctor2.address, "Dr. Jones"))
          .to.be.revertedWith("Not authorized");
      });

      it("should only allow owner to remove doctors", async function() {
        await doctorOracle.addDoctor(doctor1.address, "Dr. Smith");
        await expect(doctorOracle.connect(doctor2).removeDoctor(doctor1.address))
          .to.be.revertedWith("Not authorized");
      });
    });

    describe("Events", function() {
      it("should emit DoctorAdded event when adding a doctor", async function() {
        await expect(doctorOracle.addDoctor(doctor1.address, "Dr. Smith"))
          .to.emit(doctorOracle, "DoctorAdded")
          .withArgs(doctor1.address, "Dr. Smith");
      });

      it("should emit DoctorRemoved event when removing a doctor", async function() {
        await doctorOracle.addDoctor(doctor1.address, "Dr. Smith");
        await expect(doctorOracle.removeDoctor(doctor1.address))
          .to.emit(doctorOracle, "DoctorRemoved")
          .withArgs(doctor1.address);
      });
    });
  });

  // Test Doctor Contract
  describe("Doctor", function() {
    let Doctor;
    let doctor;
    let owner;
    
    const publicKey = "test-public-key";

    beforeEach(async function() {
      [owner] = await ethers.getSigners();
      Doctor = await ethers.getContractFactory("Doctor");
      doctor = await Doctor.deploy(publicKey);
    });

    it("should store and return the correct public key", async function() {
      expect(await doctor.getPublicKey()).to.equal(publicKey);
    });
  });

});

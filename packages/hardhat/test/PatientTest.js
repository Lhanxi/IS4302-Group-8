const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Patient", function() {
  let patientContract;
  let patient;
  let doctor1;
  let doctor2;
  let doctor3;
  
  beforeEach(async function() {
    [patient, doctor1, doctor2, doctor3] = await ethers.getSigners();
    const Patient = await ethers.getContractFactory("Patient");
    patientContract = await Patient.deploy(patient.address);
  });

  describe("Basic Functionality", function() {
    it("should set the correct owner on deployment", async function() {
      expect(await patientContract.owner()).to.equal(patient.address);
    });

    it("should grant access to a doctor", async function() {
      await patientContract.grantAccess(doctor1.address, "encrypted-key-123");
      expect(await patientContract.accessList(doctor1.address)).to.be.true;
    });

    it("should revoke access from a doctor", async function() {
      await patientContract.grantAccess(doctor1.address, "encrypted-key-123");
      await patientContract.revokeAccess(doctor1.address);
      expect(await patientContract.accessList(doctor1.address)).to.be.false;
    });

    it("should allow a doctor to request access", async function() {
      await patientContract.connect(doctor1).requestAccess();
      expect(await patientContract.accessRequests(patient.address, doctor1.address)).to.be.true;
    });

    it("should not allow a patient to request access to themselves", async function() {
      await expect(patientContract.connect(patient).requestAccess())
        .to.be.revertedWith("Patient cannot request access to themselves");
    });
  });

  describe("Access Control", function() {
    it("should only allow owner to grant access", async function() {
      await expect(patientContract.connect(doctor1).grantAccess(doctor2.address, "encrypted-key-123"))
        .to.be.revertedWith("Only owner can perform this function");
    });

    it("should only allow owner to revoke access", async function() {
      await patientContract.grantAccess(doctor1.address, "encrypted-key-123");
      await expect(patientContract.connect(doctor2).revokeAccess(doctor1.address))
        .to.be.revertedWith("Only owner can perform this function");
    });
  });

  describe("Data Access", function() {
    it("should allow an authorized doctor to get the encryption key", async function() {
      await patientContract.grantAccess(doctor1.address, "encrypted-key-123");
      expect(await patientContract.connect(doctor1).getEncryptionKey()).to.equal("encrypted-key-123");
    });

    it("should not allow an unauthorized doctor to get the encryption key", async function() {
      await expect(patientContract.connect(doctor1).getEncryptionKey())
        .to.be.revertedWith("Access denied");
    });

    it("should allow an authorized doctor to get the CID", async function() {
      // Note: The CID is not set in the contract, so this will return an empty string
      await patientContract.grantAccess(doctor1.address, "encrypted-key-123");
      expect(await patientContract.connect(doctor1).getCID()).to.equal("");
    });

    it("should not allow an unauthorized doctor to get the CID", async function() {
      await expect(patientContract.connect(doctor1).getCID())
        .to.be.revertedWith("Access denied");
    });
  });

  describe("Doctor Management", function() {
    it("should track multiple doctors who request access", async function() {
      await patientContract.connect(doctor1).requestAccess();
      await patientContract.connect(doctor2).requestAccess();
      await patientContract.connect(doctor3).requestAccess();
      
      // Check that all doctors are in the doctors array
      expect(await patientContract.doctors(0)).to.equal(doctor1.address);
      expect(await patientContract.doctors(1)).to.equal(doctor2.address);
      expect(await patientContract.doctors(2)).to.equal(doctor3.address);
    });

    it("should not add duplicate doctor requests", async function() {
      await patientContract.connect(doctor1).requestAccess();
      await patientContract.connect(doctor1).requestAccess();
      
      // Check that the doctor is only added once
      expect(await patientContract.doctors(0)).to.equal(doctor1.address);
      expect(await patientContract.doctors(1)).to.equal(ethers.constants.AddressZero);
    });
  });
});

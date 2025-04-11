const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Patient Tests", function() {
  let Patient;
  let patient;
  let patientOwner;
  let doctor1;
  let doctor2;
  
  const publicKey = "test-patient-public-key";
  const encryptedAESKey = "encrypted-aes-key-for-test";
  const doctorEncryptedKey = "doctor-encrypted-key-for-test";
  const testCID = "test-cid-ipfs-hash";

  beforeEach(async function() {
    [patientOwner, doctor1, doctor2] = await ethers.getSigners();
    Patient = await ethers.getContractFactory("Patient");
    patient = await Patient.deploy(patientOwner.address);
  });

  it("should set the correct owner on deployment", async function() {
    expect(await patient.owner()).to.equal(patientOwner.address);
  });

  it("should allow storing patient public key", async function() {
    await patient.setPatientPublicKey(publicKey);
    expect(await patient.patientPublicKey()).to.equal(publicKey);
  });

  it("should allow owner to set encrypted AES key", async function() {
    await patient.connect(patientOwner).setEncryptedAESKey(encryptedAESKey);
    expect(await patient.getAES()).to.equal(encryptedAESKey);
  });

  it("should add and retrieve CIDs", async function() {
    await patient.addCID(testCID);
    const cids = await patient.getCIDs();
    expect(cids.length).to.equal(1);
    expect(cids[0]).to.equal(testCID);
  });

  it("should allow owner to grant access to a doctor", async function() {
    await patient.connect(patientOwner).grantAccess(doctor1.address, doctorEncryptedKey);
    expect(await patient.doctorAccessList(doctor1.address)).to.be.true;
  });

  it("should allow doctor to request access", async function() {
    await patient.connect(doctor1).requestAccess(doctor1.address);
    const doctors = await patient.doctors(0);
    expect(doctors).to.equal(doctor1.address);
  });

  it("should allow owner to revoke doctor access", async function() {
    await patient.connect(patientOwner).grantAccess(doctor1.address, doctorEncryptedKey);
    await patient.connect(patientOwner).revokeAccess(doctor1.address);
    expect(await patient.doctorAccessList(doctor1.address)).to.be.false;
  });

  it("should provide encryption key to authorized doctor", async function() {
    await patient.connect(patientOwner).grantAccess(doctor1.address, doctorEncryptedKey);
    expect(await patient.connect(doctor1).getEncryptionKey()).to.equal(doctorEncryptedKey);
  });

  it("should not provide encryption key to unauthorized doctor", async function() {
    await expect(patient.connect(doctor2).getEncryptionKey())
      .to.be.revertedWith("Access denied");
  });
});

describe("PatientHandler Tests", function() {
  let patientHandler;
  let patientOwner;
  let doctor1;
  let doctor2;
  let insuranceCompany;

  beforeEach(async function() {
    [patientOwner, doctor1, doctor2, insuranceCompany] = await ethers.getSigners();
    
    const PatientHandler = await ethers.getContractFactory("PatientHandler");
    patientHandler = await PatientHandler.deploy();
  });

  it("should register a new patient successfully", async function() {
    await patientHandler.connect(patientOwner).registerPatient();
    const patientContractAddress = await patientHandler.getPatientContract(patientOwner.address);
    expect(patientContractAddress).to.not.equal("0x0000000000000000000000000000000000000000");
  });

  it("should not allow registering the same patient twice", async function() {
    await patientHandler.connect(patientOwner).registerPatient();
    await expect(patientHandler.connect(patientOwner).registerPatient())
      .to.be.revertedWith("Patient already registered");
  });

  it("should emit PatientRegistered event when registering", async function() {
    await expect(patientHandler.connect(patientOwner).registerPatient())
      .to.emit(patientHandler, "PatientRegistered");
  });

  describe("After patient registration", function() {
    beforeEach(async function() {
      await patientHandler.connect(patientOwner).registerPatient();
    });

    it("should allow doctor to request access", async function() {
      await patientHandler.connect(doctor1).requestAccess(patientOwner.address);
      
      const pendingDoctors = await patientHandler.getPendingRequestForPatient(patientOwner.address);
      expect(pendingDoctors.length).to.equal(1);
      expect(pendingDoctors[0]).to.equal(doctor1.address);
      
      expect(await patientHandler.accessRequests(patientOwner.address, doctor1.address)).to.be.true;
    });

    it("should not allow requesting access for unregistered patient", async function() {
      await expect(patientHandler.connect(doctor1).requestAccess(doctor2.address))
        .to.be.revertedWith("Patient is not registered");
    });

    it("should not allow duplicate access requests", async function() {
      await patientHandler.connect(doctor1).requestAccess(patientOwner.address);
      await expect(patientHandler.connect(doctor1).requestAccess(patientOwner.address))
        .to.be.revertedWith("Access request already sent");
    });

    it("should emit AccessRequested event", async function() {
      await expect(patientHandler.connect(doctor1).requestAccess(patientOwner.address))
        .to.emit(patientHandler, "AccessRequested")
        .withArgs(patientOwner.address, doctor1.address);
    });

    it("should allow insurance company to request access", async function() {
      await patientHandler.connect(insuranceCompany).insuranceCompanyRequestAccess(patientOwner.address);
      
      const pendingCompanies = await patientHandler.getInsuranceCompanyPendingRequestForPatient(patientOwner.address);
      expect(pendingCompanies.length).to.equal(1);
      expect(pendingCompanies[0]).to.equal(insuranceCompany.address);
      
      expect(await patientHandler.insuranceCompanyAccessRequests(patientOwner.address, insuranceCompany.address)).to.be.true;
    });

    it("should emit InsuranceCompanyAccessRequested event", async function() {
      await expect(patientHandler.connect(insuranceCompany).insuranceCompanyRequestAccess(patientOwner.address))
        .to.emit(patientHandler, "InsuranceCompanyAccessRequested")
        .withArgs(patientOwner.address, insuranceCompany.address);
    });
  });
});

describe("Patient-PatientHandler Integration Tests", function() {
  let patientHandler;
  let patient;
  let Patient;
  let patientOwner;
  let doctor1;
  let doctor2;
  let insuranceCompany;
  
  const doctorEncryptedKey = "doctor-encrypted-key-for-test";

  beforeEach(async function() {
    [patientOwner, doctor1, doctor2, insuranceCompany] = await ethers.getSigners();
    
    // Deploy PatientHandler
    const PatientHandler = await ethers.getContractFactory("PatientHandler");
    patientHandler = await PatientHandler.deploy();
    
    // Register patient
    await patientHandler.connect(patientOwner).registerPatient();
    
    // Get the deployed Patient contract address
    const patientContractAddress = await patientHandler.getPatientContract(patientOwner.address);
    
    // Get instance of the deployed Patient contract
    Patient = await ethers.getContractFactory("Patient");
    patient = await Patient.attach(patientContractAddress);
  });

  it("should correctly link PatientHandler and Patient contracts", async function() {
    expect(await patient.owner()).to.equal(patientOwner.address);
  });

  it("should propagate access requests from handler to patient contract", async function() {
    await patientHandler.connect(doctor1).requestAccess(patientOwner.address);
    
    // Check that the doctor is added to the patient's doctor list
    const doctors = await patient.doctors(0);
    expect(doctors).to.equal(doctor1.address);
  });

  it("should allow full access flow from request to grant", async function() {
    // Doctor requests access through PatientHandler
    await patientHandler.connect(doctor1).requestAccess(patientOwner.address);
    
    // Verify request is registered in PatientHandler
    expect(await patientHandler.accessRequests(patientOwner.address, doctor1.address)).to.be.true;
    
    // Patient grants access directly on Patient contract
    await patient.connect(patientOwner).grantAccess(doctor1.address, doctorEncryptedKey);
    
    // Verify access is granted
    expect(await patient.doctorAccessList(doctor1.address)).to.be.true;
    
    // Doctor can retrieve the encryption key
    expect(await patient.connect(doctor1).getEncryptionKey()).to.equal(doctorEncryptedKey);
  });

  it("should handle insurance company access requests properly", async function() {
    // Insurance company requests access
    await patientHandler.connect(insuranceCompany).insuranceCompanyRequestAccess(patientOwner.address);
    
    // Verify request is registered
    const pendingCompanies = await patientHandler.getInsuranceCompanyPendingRequestForPatient(patientOwner.address);
    expect(pendingCompanies.length).to.equal(1);
    expect(pendingCompanies[0]).to.equal(insuranceCompany.address);
  });
});

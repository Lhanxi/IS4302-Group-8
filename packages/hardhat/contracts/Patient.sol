// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/*
Each patient will have their own instance of the contract. Through this contract they grant access or revoke access to their health data
This will store the CID for Web3Storage and manage the encryption keys for doctors who request access. 
*/

contract Patient {
    //owner of the contract is the patient
    address public owner;
    string[] public CID; // this is where the data is stored on the IFPS
    string public patientAES; //this is the AES key that is used to encrypt datat, it is encrypted with the patient public key
    string public patientPublicKey; //this is the 
    mapping(address => bool) public doctorAccessList; //tracks whether a doctor has been given access
    mapping(address => string) private doctorEncryptedKeys; //the AES key for doctors 
    mapping(address => bool) public insuranceCompanyAccessList; //tracks whether a insurance company has been given access
    mapping(address => string) private insuranceCompanyEncryptedKeys; //the AES key for insurance company 
    address[] public doctors;
    address[] public insuranceCompanies;
    bool public allowResearchAccess;

    constructor (address patient) {
        owner = patient;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the patient can perform this action");
        _;
    }

    function grantAccess(address doctor, string memory encryptedKey) external onlyOwner {
        doctorAccessList[doctor] = true;
        doctorEncryptedKeys[doctor] = encryptedKey; 
    }

    function requestAccess(address doctor) external {
        require(doctor != owner, "Patient cannot request access to themselves");
        doctors.push(doctor);  // Store the doctor address in the array
        doctorAccessList[doctor] = false;  //set the initial request as false
    }

    function revokeAccess(address doctor) public onlyOwner {
        doctorAccessList[doctor] = false;
        //remove the AES key of the doctor
        doctorEncryptedKeys[doctor] = "";
    }

    function getEncryptionKey() external view returns (string memory) {
        require(doctorAccessList[msg.sender], "Access denied"); 
        return doctorEncryptedKeys[msg.sender]; 
    }

    function getDoctorEncryptionKey(address doctor) external view returns (string memory) {
        return doctorEncryptedKeys[doctor];
    }

    function checkDoctorAccess(address doctor) external view returns (bool) {
        return doctorAccessList[doctor];
    }

    function addCID(string memory newCID) external {
        CID.push(newCID);
    }

    function getCIDs() external view returns (string[] memory) {
        return CID;
    }
 
    function getAES() external view returns (string memory) {
        return patientAES;
    }

    function setPatientPublicKey(string memory publicKey) external {
        patientPublicKey = publicKey;
    }

    function setEncryptedAESKey(string memory encryptedAES) external onlyOwner {
        patientAES = encryptedAES;
    }

    function setDoctorEncryptedAES(address doctor, string memory encryptedAES) external onlyOwner {
        doctorEncryptedKeys[doctor] = encryptedAES;
    }

    function insuranceCompanyRequestAccess(address insuranceCompany) external {
        require(insuranceCompany != owner, "Patient cannot request access to themselves");
        insuranceCompanies.push(insuranceCompany);  // Store the doctor address in the array
        insuranceCompanyAccessList[insuranceCompany] = false;  //set the initial request as false
    }

    function insuranceCompanyRevokeAccess(address insuranceCompany) public onlyOwner {
        insuranceCompanyAccessList[insuranceCompany] = false;
        //remove the AES key of the insurance company
        insuranceCompanyEncryptedKeys[insuranceCompany] = "";
    }

    function getInsuranceCompanyEncryptionKey(address insuranceCompany) external view returns (string memory) {
        return insuranceCompanyEncryptedKeys[insuranceCompany];
    }

    function setInsuranceCompanyEncryptedAES(address insuranceCompany, string memory encryptedAES) external onlyOwner {
        insuranceCompanyEncryptedKeys[insuranceCompany] = encryptedAES;
    }

    function checkInsuranceCompanyAccess(address insuranceCompany) external view returns (bool) {
        return insuranceCompanyAccessList[insuranceCompany];
    }

    function grantInsuranceCompanyAccess(address insuranceCompany, string memory encryptedKey) external onlyOwner {
        insuranceCompanyAccessList[insuranceCompany] = true;
        insuranceCompanyEncryptedKeys[insuranceCompany] = encryptedKey; 
    }

    function setResearchAccess(bool researchAccess) external onlyOwner {
        allowResearchAccess = researchAccess; 
    }

    function getResearchAccess() public view returns (bool) {
        return allowResearchAccess;
    }
}
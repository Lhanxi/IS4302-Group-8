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
    mapping(address => bool) public accessList; //tracks whether a doctor has been given access
    mapping(address => string) private encryptedKeys; //the AES key for doctors 
    address[] public doctors;


    constructor (address patient) {
        owner = patient;
    }

    function grantAccess(address doctor, string memory encryptedKey) external {
        accessList[doctor] = true;
        encryptedKeys[doctor] = encryptedKey; 
    }

    function requestAccess(address doctor) external {
        require(doctor != owner, "Patient cannot request access to themselves");
        doctors.push(doctor);  // Store the doctor address in the array
        accessList[doctor] = false;  //set the initial request as false
    }

    function revokeAccess(address doctor) public {
        accessList[doctor] = false;
    }

    function getEncryptionKey() external view returns (string memory) {
        require(accessList[msg.sender], "Access denied"); 
        return encryptedKeys[msg.sender]; 
    }

    function getDoctorEncryptionKey(address doctor) external view returns (string memory) {
        return encryptedKeys[doctor];
    }

    function checkDoctorAccess(address doctor) external view returns (bool) {
        return accessList[doctor];
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

    function setEncryptedAESKey(string memory encryptedAES) external {
        patientAES = encryptedAES;
    }

}
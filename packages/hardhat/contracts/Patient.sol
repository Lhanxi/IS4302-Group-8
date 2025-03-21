// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/*
Each patient will have their own instance of the contract. Through this contract they grant access or revoke access to their health data
This will store the CID for Web3Storage and manage the encryption keys for doctors who request access. 
*/

contract Patient {
    //owner of the contract is the patient
    address public owner;
    string private CID; // this is where the data is stored on the IFPS
    string private patientAES; //this is the AES key that is used to store 
    string public patientPublicKey; //this is the 
    mapping(address => bool) public accessList; //tracks whether a doctor has been given access
    mapping(address => string) private encryptedKeys; 
    mapping(address => mapping(address => bool)) public accessRequests; // Tracks access requests
    address[] public doctors;


    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this function"); 
        _;
    }

    constructor (address patient) {
        owner = patient;
    }

    function grantAccess(address doctor, string memory encryptedKey) external onlyOwner {
        accessList[doctor] = true;
        encryptedKeys[doctor] = encryptedKey; 
    }

    function requestAccess() external {
        require(msg.sender != owner, "Patient cannot request access to themselves");
        accessRequests[owner][msg.sender] = true;  // This tracks if a doctor requested access
        doctors.push(msg.sender);  // Store the doctor address in the array
    }

    function revokeAccess(address doctor) public onlyOwner() {
        accessList[doctor] = false;
    }

    function getEncryptionKey() external view returns (string memory) {
        require(accessList[msg.sender], "Access denied"); 
        return encryptedKeys[msg.sender]; 
    }

    function getCID() external view returns (string memory) {
        require(accessList[msg.sender], "Access denied"); 
        return CID; 
    }

    function setPatientPublicKey(string memory publicKey) external {
        patientPublicKey = publicKey;
    }

}
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
    mapping(address => bool) public accessList;
    mapping(address => string) private encryptedKeys;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this function");
        _;
    }

    constructor(address patient) {
        owner = patient;
    }

    function grantAccess(
        address doctor,
        string memory encryptedKey
    ) external onlyOwner {
        accessList[doctor] = true;
        encryptedKeys[doctor] = encryptedKey;
    }

    function revokeAccess(address doctor) public onlyOwner {
        accessList[doctor] = false;
    }

    function getEncryptionKey() external view returns (string memory) {
        require(accessList[msg.sender], "Access denied");
        return encryptedKeys[msg.sender];
    }

    function getCID(address caller) external view returns (string memory) {
        require(accessList[caller], "Access denied");
        return CID;
    }

    function setCID(string memory _CID) external onlyOwner {
        CID = _CID;
    }
}

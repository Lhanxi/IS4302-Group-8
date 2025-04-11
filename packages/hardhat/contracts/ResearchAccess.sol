// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/*
Each patient will have their own instance of the contract. Through this contract they grant access or revoke access to their health data
This will store the CID for Web3Storage and manage the encryption keys for doctors who request access. 
*/

contract ResearchAccess {
    string[] public CID; // this is where the data is stored on the IFPS

    /// @notice adds the new CID to the list of research CIDs.
    /// @param newCID the new CID to be added to the list of research CIDs
    function addCID(string memory newCID) external {
        CID.push(newCID);
    }

    /// @notice retrieves the list of research CIDs
    function getCIDs() external view returns (string[] memory) {
        return CID;
    } 
}
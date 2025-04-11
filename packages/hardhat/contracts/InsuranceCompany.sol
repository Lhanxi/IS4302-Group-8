// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract InsuranceCompany {
    string private publicKey;

    constructor(string memory _publicKey) {
        publicKey = _publicKey;
    }

    /// @notice Retrieves the insurance company's public key
    function getPublicKey() public view returns (string memory) {
        return publicKey;
    }
}
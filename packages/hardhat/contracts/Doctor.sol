// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Doctor {
    string private publicKey;

    constructor(string memory _publicKey) {
        require(bytes(_publicKey).length > 0, "Public key cannot be empty");
        publicKey = _publicKey;
    }

    function getPublicKey() public view returns (string memory) {
        return publicKey;
    }
}
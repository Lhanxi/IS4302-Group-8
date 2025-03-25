// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Doctor {
    string private publicKey;

    constructor(string memory _publicKey) {
        publicKey = _publicKey;
    }

    function getPublicKey() public view returns (string memory) {
        return publicKey;
    }
}
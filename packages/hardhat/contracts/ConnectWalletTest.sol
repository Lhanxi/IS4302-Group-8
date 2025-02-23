// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract ConnectWalletTest {
    address public owner;

    event WalletConnected(address indexed user);

    constructor() {
        owner = msg.sender;
    }

    function connectWalletTest() public {
        emit WalletConnected(msg.sender);
    }
}

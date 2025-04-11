// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./InsuranceCompany.sol";

/*
InsuranceCompanyHandler contract acts like a registry for all insurance company. Calls on the insuranceCompanyOracle.
*/

interface ExternalOracle {
    function verifyInsuranceCompany(address _insuranceCompany) external view returns (bool);
}

contract InsuranceCompanyHandler {
    address private owner = msg.sender;
    ExternalOracle public externalOracle;

    mapping(address => address) public insuranceCompanyContracts;

    event InsuranceCompanyAuthenticated(address indexed insuranceCompany);
    event InsuranceCompanyAuthenticationRemoved(address indexed insuranceCompany);

    constructor(address _oracleAddress) {
        externalOracle = ExternalOracle(_oracleAddress);
    }

    /// @notice Authenticates the insurance company using an external oracle.
    /// @param _insuranceCompany The wallet address of the insurance company to authenticate.
    /// @param _publicKey The public key the insurance company will use to encrypt patient's data.
    function authenticateInsuranceCompany(address _insuranceCompany, string memory _publicKey) external {
        require(insuranceCompanyContracts[_insuranceCompany] == address(0), "Insurance Company already authenticated");
        require(externalOracle.verifyInsuranceCompany(_insuranceCompany) == true, "Insurance Company not verified by oracle");
        InsuranceCompany insuranceCompanyContract = new InsuranceCompany(_publicKey);
        insuranceCompanyContracts[_insuranceCompany] = address(insuranceCompanyContract);
        emit InsuranceCompanyAuthenticated(_insuranceCompany);
    }

    /// @notice Updates authentication status based on the latest oracle information
    /// @param _insuranceCompany The wallet address that needs to have its authentication status updated.
    function updateAuthentication(address _insuranceCompany) external {
        if (!externalOracle.verifyInsuranceCompany(_insuranceCompany)) {
            this.removeInsuranceCompany(_insuranceCompany);
        }
    }

    /// @notice Checks authentication status of the wallet address.
    /// @param _insuranceCompany The wallet address that needs to be checked.
    function isAuthenticated(address _insuranceCompany) view external returns (bool) {
        if (insuranceCompanyContracts[_insuranceCompany] == address(0)) {
            return false;
        }
        return true;
    }

    /// @notice Removes authentication for the insurance company.
    /// @param _insuranceCompany The wallet address of the insurance company to remove authentication.
    function removeInsuranceCompany(address _insuranceCompany) public {
        require(msg.sender == address(this), "Only contract can call this function");
        delete insuranceCompanyContracts[_insuranceCompany];
        emit InsuranceCompanyAuthenticationRemoved(_insuranceCompany);
    }

    /// @notice Gets the insurance company's contract address.
    /// @param _insuranceCompany The wallet address of the insurance company to retrieve the contract address.
    function getInsuranceContractAddress(address _insuranceCompany) view public returns (address) {
        return insuranceCompanyContracts[_insuranceCompany];
    }
}
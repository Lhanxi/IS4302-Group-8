// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
 
contract InsuranceCompanyOracle {
    address public owner;
     
    // Mapping from a insurance company's address to their name.
    mapping(address => string) public insuranceCompanyName;
 
    // Events for logging changes.
    event InsuranceCompanyAdded(address indexed insuranceCompany, string name);
    event InsuranceCompanyRemoved(address indexed insuranceCompany);
 
    // Modifier to restrict access to the contract owner.
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }
 
    constructor() {
        owner = msg.sender;
    }
 
    /// @notice Adds a new insurance company to the oracle.
    /// @param _insuranceCompany The wallet address of the insurance company.
    /// @param _name The name of the insurance company (must be non-empty).
    function addInsuranceCompany(address _insuranceCompany, string calldata _name) external onlyOwner {
        require(bytes(_name).length > 0, "Insurance company name must be non-empty");
        insuranceCompanyName[_insuranceCompany] = _name;
        emit InsuranceCompanyAdded(_insuranceCompany, _name);
    }
 
    /// @notice Batch adds multiple insurance company to the oracle.
    /// @param _insuranceCompanies An array of wallet addresses.
    /// @param _names An array of insurance company names corresponding to the addresses.
    function batchAddInsuranceCompany(address[] calldata _insuranceCompanies, string[] calldata _names) external onlyOwner {
        require(_insuranceCompanies.length == _names.length, "Input arrays must have the same length");
        for (uint i = 0; i < _insuranceCompanies.length; i++) {
            insuranceCompanyName[_insuranceCompanies[i]] = _names[i];
            emit InsuranceCompanyAdded(_insuranceCompanies[i], _names[i]);
        }
    }
 
    /// @notice Removes a insurance company from the oracle.
    /// @param _insuranceCompany The wallet address of the insurance company to remove.
    function removeDoctor(address _insuranceCompany) external onlyOwner {
        delete insuranceCompanyName[_insuranceCompany];
        emit InsuranceCompanyRemoved(_insuranceCompany);
    }
 
    /// @notice Batch removes insurance companies from the oracle.
    /// @param _insuranceCompanies An array of wallet addresses to remove.
    function batchRemoveInsuranceCompany(address[] calldata _insuranceCompanies) external onlyOwner {
        for (uint i = 0; i < _insuranceCompanies.length; i++) {
            delete insuranceCompanyName[_insuranceCompanies[i]];
            emit InsuranceCompanyRemoved(_insuranceCompanies[i]);
        }
    }
 
    /// @notice Verifies whether a given address is registered as a insurance company.
    /// @param _insuranceCompany The wallet address to verify.
    /// @return Returns true if the insurance company is registered (i.e. name is non-empty), false otherwise.
    function verifyInsuranceCompany(address _insuranceCompany) external view returns (bool) {
        return bytes(insuranceCompanyName[_insuranceCompany]).length > 0;
    }
 }
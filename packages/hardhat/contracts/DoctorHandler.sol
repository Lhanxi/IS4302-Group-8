// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./Doctor.sol";

/*
DoctorHandler contract acts like a registry for all doctors. Calls on the DoctorOracle.
*/

interface ExternalOracle {
    function verifyDoctor(address _doctor) external view returns (bool);
}

contract DoctorHandler {
    address private owner = msg.sender;
    ExternalOracle public externalOracle;

    mapping(address => address) public doctorContracts;

    event DoctorAuthenticated(address indexed doctor);
    event DoctorAuthenticationRemoved(address indexed doctor);

    constructor(address _oracleAddress) {
        externalOracle = ExternalOracle(_oracleAddress);
    }

    /// @notice Authenticates the doctor using an external oracle.
    /// @param _doctor The wallet address of the doctor to authenticate.
    /// @param _publicKey The public key the doctor will use to encrypt patient's data.
    function authenticateDoctor(address _doctor, string memory _publicKey) external {
        require(doctorContracts[_doctor] == address(0), "Doctor already authenticated");
        require(externalOracle.verifyDoctor(_doctor) == true, "Doctor not verified by oracle");  
        Doctor doctorContract = new Doctor(_publicKey);
        doctorContracts[_doctor] = address(doctorContract);
        emit DoctorAuthenticated(_doctor);
    }

    /// @notice Updates authentication status based on the latest oracle information
    /// @param _doctor The wallet address that needs to have its authentication status updated.
    function updateAuthentication(address _doctor) external {
        if (!externalOracle.verifyDoctor(_doctor)) {
            this.removeDoctor(_doctor);
        }
    }

    /// @notice Checks authentication status of the wallet address.
    /// @param _doctor The wallet address that needs to be checked.
    function isAuthenticated(address _doctor) view external returns (bool) {
        if (doctorContracts[_doctor] == address(0)) {
            return false;
        }
        return true;
    }

    /// @notice Removes authentication for the doctor.
    /// @param _doctor The wallet address of the doctor to remove authentication.
    function removeDoctor(address _doctor) public {
        require(msg.sender == address(this) || msg.sender == owner, "Only contract or owner can call this function");
        delete doctorContracts[_doctor];
        emit DoctorAuthenticationRemoved(_doctor);
    }

    /// @notice Gets the doctor's contract address.
    /// @param _doctor The wallet address of the doctor to retrieve the contract address.
    function getDoctorContractAddress(address _doctor) view public returns (address) {
        return doctorContracts[_doctor];
    }
}
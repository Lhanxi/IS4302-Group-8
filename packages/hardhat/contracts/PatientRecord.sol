// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract PatientRecord {
    struct RecordHistory {
        uint256 timestamp;
        address doctor;
        string description;
    }

    struct Patient {
        uint256 patientId;
        string name;
        uint256 dateOfBirth;
        string gender;
        string bloodType;
        string[] allergies;
        string[] conditions;
        string[] medications;
        string emergencyContact;
    }

    mapping(address => Patient) private patients;

    event RecordUpdated(address indexed patient, address indexed doctor);

    modifier onlyPatient(address _patient) {
        require(patients[_patient].patientId != 0, "Not a registered patient");
        require(msg.sender == _patient, "Can only access your own data");
        _;
    }

    function registerPatient(
        uint256 _patientId,
        string memory _name,
        uint256 _dateOfBirth,
        string memory _gender,
        string memory _bloodType,
        string memory _emergencyContact
    ) public {
        require(patients[msg.sender].patientId == 0, "Already registered");

        string[] memory emptyAllergies = new string[](0);
        string[] memory emptyConditions = new string[](0);
        string[] memory emptyMedications = new string[](0);

        patients[msg.sender] = Patient({
            patientId: _patientId,
            name: _name,
            dateOfBirth: _dateOfBirth,
            gender: _gender,
            bloodType: _bloodType,
            allergies: emptyAllergies,
            conditions: emptyConditions,
            medications: emptyMedications,
            emergencyContact: _emergencyContact
        });
    }

    function getPatientData(
        address _patient
    )
        public
        view
        onlyPatient(_patient)
        returns (
            string memory name,
            uint256 dob,
            string memory gender,
            string memory bloodType,
            string[] memory allergies,
            string[] memory conditions,
            string[] memory medications,
            string memory emergencyContact
        )
    {
        Patient storage p = patients[_patient];
        return (
            p.name,
            p.dateOfBirth,
            p.gender,
            p.bloodType,
            p.allergies,
            p.conditions,
            p.medications,
            p.emergencyContact
        );
    }
}

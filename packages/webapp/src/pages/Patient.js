import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { DataGrid } from '@mui/x-data-grid';
import { Button } from '@mui/material';

const PatientPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientHandlerContract, setPatientHandlerContract] = useState(null);
  const [patientContract, setPatientContract] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);

  const patientHandlerAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
  const patientHandlerAbi = [
    "function getPendingRequestForPatient(address patient) public view returns (address[] memory)",
    "function registerPatient() external",
    "function accessRequests(address patient, address doctor) public view returns (bool)"
  ];
  const patientAbi = [
    "function accessRequests(address doctor) external view returns (bool)",
    "function accessList(address doctor) external view returns (bool)",
    "function revokeAccess(address doctor) external",
    "function grantAccess(address doctor, string memory encryptedKey) external"
  ];

  useEffect(() => {
    const init = async () => {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      setCurrentAccount(accounts[0]);

      const provider = new ethers.BrowserProvider(ethereum);
      const patientHandlerContractInstance = new ethers.Contract(patientHandlerAddress, patientHandlerAbi, provider.getSigner());
      setPatientHandlerContract(patientHandlerContractInstance);

      const patientAddress = await patientHandlerContractInstance.patientContracts(accounts[0]);
      const patientContractInstance = new ethers.Contract(patientAddress, patientAbi, provider.getSigner());
      setPatientContract(patientContractInstance);

      // Fetch doctors who have requested access
      const doctorsList = await fetchPendingDoctors(patientHandlerContractInstance, accounts[0]);
      setDoctors(doctorsList);
      setLoading(false);
    };

    init();
  }, []);

  const fetchPendingDoctors = async (patientHandlerContract, patientAddress) => {
    const pendingDoctors = await patientHandlerContract.getPendingRequestForPatient(patientAddress);
    const doctorsList = [];
    for (let address of pendingDoctors) {
      const isRequested = await patientHandlerContract.accessRequests(patientAddress, address);
      const isApproved = await patientContract.accessList(address);
      doctorsList.push({
        id: address,
        doctor: address,
        status: isRequested ? "Requested" : "Not Requested",
        access: isApproved ? "Approved" : "Rejected",
      });
    }
    return doctorsList;
  };

  const handleGrantAccess = async (doctor) => {
    if (!patientContract) return;

    const encryptedKey = "yourEncryptedKey"; // This will be dynamically set
    await patientContract.grantAccess(doctor, encryptedKey);
    setDoctors(doctors.map((doc) => (doc.doctor === doctor ? { ...doc, access: "Approved" } : doc)));
  };

  const handleRevokeAccess = async (doctor) => {
    if (!patientContract) return;

    await patientContract.revokeAccess(doctor);
    setDoctors(doctors.map((doc) => (doc.doctor === doctor ? { ...doc, access: "Rejected" } : doc)));
  };

  const columns = [
    { field: 'doctor', headerName: 'Doctor', width: 200 },
    { field: 'status', headerName: 'Status', width: 180 },
    { field: 'access', headerName: 'Access', width: 180 },
    {
      field: 'action',
      headerName: 'Action',
      width: 250,
      renderCell: (params) => {
        return (
          <div>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleGrantAccess(params.row.doctor)}
            >
              Grant Access
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => handleRevokeAccess(params.row.doctor)}
            >
              Revoke Access
            </Button>
          </div>
        );
      },
    },
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid rows={doctors} columns={columns} pageSize={5} />
    </div>
  );
};

export default PatientPage;

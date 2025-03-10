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
    const [isRegistered, setIsRegistered] = useState(false);
    const [error, setError] = useState(null);

    const patientHandlerAddress = "0x9A676e781A523b5d0C0e43731313A708CB607508";
    const patientHandlerAbi = [
      "function getPendingRequestForPatient(address patient) public view returns (address[] memory)",
      "function registerPatient() external",
      "function accessRequests(address patient, address doctor) public view returns (bool)",
      "function getPatientContract(address patient) public view returns (address)",
  ];
    const patientAbi = [
        "function accessRequests(address doctor) external view returns (bool)",
        "function accessList(address doctor) external view returns (bool)",
        "function revokeAccess(address doctor) external",
        "function grantAccess(address doctor, string memory encryptedKey) external"
    ];

    const getProviderAndSigner = async () => {
        if (!window.ethereum) {
            alert("Please install MetaMask!");
            return null;
        }

        console.log("Initializing provider and signer...");
        const { ethereum } = window;
        const newProvider = new ethers.BrowserProvider(ethereum);
        await newProvider.send("eth_requestAccounts", []);
        const signer = await newProvider.getSigner();

        console.log("Provider and Signer initialized.");
        return { provider: newProvider, signer };
    };

    useEffect(() => {
        const init = async () => {
            try {
                console.log("Starting initialization...");
                setError(null);

                const { ethereum } = window;
                if (!ethereum) {
                    alert("Please install MetaMask!");
                    return;
                }

                const { provider, signer } = await getProviderAndSigner();
                if (!provider || !signer) return;

                const accounts = await ethereum.request({ method: "eth_requestAccounts" });
                setCurrentAccount(accounts[0]);
                console.log("Current account:", accounts[0]);

                const patientHandlerContractInstance = new ethers.Contract(patientHandlerAddress, patientHandlerAbi, signer);
                setPatientHandlerContract(patientHandlerContractInstance);
                console.log("PatientHandler contract initialized:", patientHandlerContractInstance);

                console.log("Fetching patient contract for account:", accounts[0]);
                let patientAddress;
                try {
                    patientAddress = await patientHandlerContractInstance.getPatientContract(accounts[0]);
                    console.log("Fetched patient contract address:", patientAddress);
                } catch (err) {
                    console.error("Error fetching patient contract:", err);
                    setError("Failed to fetch patient contract. Please try again.");
                    setLoading(false);
                    return;
                }

                if (patientAddress === "0x0000000000000000000000000000000000000000") {
                    console.log("User is NOT registered.");
                    setIsRegistered(false);
                    setLoading(false);
                    return;
                }

                console.log("User is registered.");
                setIsRegistered(true);

                console.log("Initializing patient contract...");
                const patientContractInstance = new ethers.Contract(patientAddress, patientAbi, signer);
                setPatientContract(patientContractInstance);
                console.log("Patient contract initialized:", patientContractInstance);

                console.log("Fetching pending doctor requests...");
                const doctorsList = await fetchPendingDoctors(patientHandlerContractInstance, accounts[0]);
                console.log("Fetched pending doctors:", doctorsList);
                setDoctors(doctorsList);
                setLoading(false);
            } catch (err) {
                console.error("Initialization error:", err);
                setError("Something went wrong. Please refresh the page or check your network.");
                setLoading(false);
            }
        };

        init();
    }, []);

    const fetchPendingDoctors = async (patientHandlerContract, patientAddress) => {
        try {
            console.log("Fetching pending doctor requests for patient:", patientAddress);
            const pendingDoctors = await patientHandlerContract.getPendingRequestForPatient(patientAddress);
            console.log("Pending doctors retrieved:", pendingDoctors);

            const doctorsList = [];
            for (let address of pendingDoctors) {
                console.log("Checking access status for doctor:", address);
                const isRequested = await patientHandlerContract.accessRequests(patientAddress, address);
                const isApproved = await patientContract?.accessList(address);
                console.log(`Doctor: ${address}, Requested: ${isRequested}, Approved: ${isApproved}`);

                doctorsList.push({
                    id: address,
                    doctor: address,
                    status: isRequested ? "Requested" : "Not Requested",
                    access: isApproved ? "Approved" : "Rejected",
                });
            }
            return doctorsList;
        } catch (err) {
            console.error("Error fetching pending doctors:", err);
            return [];
        }
    };

    const handleGrantAccess = async (doctor) => {
        try {
            if (!patientContract) {
                console.warn("Patient contract is not initialized.");
                return;
            }

            console.log("Granting access to doctor:", doctor);
            const encryptedKey = "yourEncryptedKey"; // Replace dynamically
            await patientContract.grantAccess(doctor, encryptedKey);
            console.log("Access granted to doctor:", doctor);

            setDoctors(doctors.map((doc) => (doc.doctor === doctor ? { ...doc, access: "Approved" } : doc)));
        } catch (err) {
            console.error("Grant access error:", err);
            setError("Failed to grant access. Please try again.");
        }
    };

    const handleRevokeAccess = async (doctor) => {
        try {
            if (!patientContract) {
                console.warn("Patient contract is not initialized.");
                return;
            }

            console.log("Revoking access from doctor:", doctor);
            await patientContract.revokeAccess(doctor);
            console.log("Access revoked from doctor:", doctor);

            setDoctors(doctors.map((doc) => (doc.doctor === doctor ? { ...doc, access: "Rejected" } : doc)));
        } catch (err) {
            console.error("Revoke access error:", err);
            setError("Failed to revoke access. Please try again.");
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div style={{ height: 400, width: '100%' }}>
            {!isRegistered ? (
                <div>
                    <h2>You are not registered yet.</h2>
                </div>
            ) : (
                <DataGrid rows={doctors} columns={[
                    { field: 'doctor', headerName: 'Doctor', width: 200 },
                    { field: 'status', headerName: 'Status', width: 180 },
                    { field: 'access', headerName: 'Access', width: 180 },
                    {
                        field: 'action',
                        headerName: 'Action',
                        width: 250,
                        renderCell: (params) => (
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
                        ),
                    },
                ]} pageSize={5} />
            )}
        </div>
    );
};

export default PatientPage;

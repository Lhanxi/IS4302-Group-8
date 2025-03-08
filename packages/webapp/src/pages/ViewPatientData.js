// Import required dependencies
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";  // ✅ Fixed: Import useParams
import { BrowserProvider, Contract, ZeroAddress } from "ethers"; 
import { PATIENT_HANDLER_ADDRESS, PATIENT_HANDLER_ABI, PATIENT_ABI } from "../contractConfig";
import { Container, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, Paper } from "@mui/material";

const PatientDataPage = () => {
    // Get wallet address from URL
    const { walletAddress } = useParams();  
    const [patientCID, setPatientCID] = useState(null);
    const [patientData, setPatientData] = useState(null);
    const [loading, setLoading] = useState(false);  

    // Fetch the patient's contract address from Smart Contract
    useEffect(() => {
        if (walletAddress) {  // ✅ Fixed: Use walletAddress instead of userAddress
            fetchPatientCID();
        }
    }, [walletAddress]);

    // Fetch the patient's contract address from PatientHandler
    const fetchPatientCID = async () => {
        setLoading(true);
        try {
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            
            // Connect to the PatientHandler contract
            const patientHandlerContract = new Contract(PATIENT_HANDLER_ADDRESS, PATIENT_HANDLER_ABI, signer);  // ✅ Fixed ethers.Contract

            // Get the patient's smart contract address
            const patientContractAddress = await patientHandlerContract.patientContracts(walletAddress);
            if (patientContractAddress === ZeroAddress) {  // ✅ Fixed ZeroAddress usage
                console.error("Patient is not registered.");
                setLoading(false);
                return;
            }

            // Connect to the Patient contract
            const patientContract = new Contract(patientContractAddress, PATIENT_ABI, signer);  // ✅ Fixed ethers.Contract

            // Fetch the CID (Content Identifier) from IPFS
            const cid = await patientContract.getCID(walletAddress);
            setPatientCID(cid);
            console.log("Fetched CID:", cid);

            // Fetch data from IPFS
            fetchIPFSData(cid);
        } catch (error) {
            console.error("Error fetching patient CID:", error);
        }
        setLoading(false);
    };

    // Fetch patient data from IPFS
    const fetchIPFSData = async (cid) => {
        try {
            const ipfsURL = `https://ipfs.io/ipfs/${cid}`; 
            const response = await fetch(ipfsURL);
            const data = await response.json();
            setPatientData(data);
            console.log("Fetched Patient Data:", data);
        } catch (error) {
            console.error("Error fetching data from IPFS:", error);
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 5 }}>
            <Typography variant="h4" align="center" gutterBottom>
                Patient Data
            </Typography>

            {loading ? (
                <Typography align="center">Fetching patient data...</Typography>
            ) : patientData ? (
                <Paper sx={{ p: 3 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><b>Field</b></TableCell>
                                <TableCell><b>Value</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.entries(patientData).map(([key, value]) => (
                                <TableRow key={key}>
                                    <TableCell>{key}</TableCell>
                                    <TableCell>{value}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
            ) : (
                <Typography align="center">No patient data available.</Typography>
            )}

            <Button variant="contained" color="primary" onClick={fetchPatientCID} sx={{ mt: 3 }}>
                Refresh Data
            </Button>
        </Container>
    );
};

export default PatientDataPage;

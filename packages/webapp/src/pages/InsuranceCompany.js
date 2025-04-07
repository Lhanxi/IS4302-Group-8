import { Button, TextField } from "@mui/material";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { patientHandlerAddress } from "../utils/contractAddress";
import { patientHandlerABI } from "../utils/contractABI";

// PatientHandler contract details
const patientHandlerAbi = patientHandlerABI;
const PatientHandlerAddress = patientHandlerAddress;

const InsuranceCompanyPage = () => {
  const [patientAddress, setPatientAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);

  // Function to get signer
  const getSigner = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return null;
    }

    try {
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      await newProvider.send("eth_requestAccounts", []); // Request permission
      setProvider(newProvider);

      const signer = await newProvider.getSigner();
      return signer;
    } catch (error) {
      console.error("Error creating signer:", error);
      setError("Error creating signer. Please check MetaMask.");
      return null;
    }
  };

  // Fetch connected account on load
  useEffect(() => {
    const initAccount = async () => {
      if (window.ethereum) {
        try {
          const [selectedAccount] = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          if (selectedAccount) {
            setAccount(selectedAccount);
            console.log("Selected Account: ", selectedAccount);
          }
        } catch (err) {
          console.error("Error requesting account:", err);
          setError("Error accessing MetaMask. Please try again.");
        }
      }
    };

    initAccount();
  }, []);

  const requestAccess = async () => {
    if (!patientAddress) {
      setError("Please enter a valid patient address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const signer = await getSigner();
      if (!signer) {
        alert("Signer not available.");
        setLoading(false);
        return;
      }

      const contract = new ethers.Contract(
        PatientHandlerAddress,
        patientHandlerAbi,
        signer
      );
      console.log("Contract instance:", contract);

      const tx = await contract.requestAccess(patientAddress);
      console.log("Transaction Sent:", tx);

      await tx.wait(); // Wait for transaction confirmation
      console.log("Transaction Mined:", tx);

      alert("Access request sent successfully!");
    } catch (err) {
      console.error("Error requesting access:", err);
      if (err.reason?.includes("Patient is not registered")) {
        setError("User does not exist.");
      } else {
        setError("Transaction failed. Please try again.");
      }
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
      <h2>Insurance Company Page</h2>
      <TextField
        label="Enter patient address"
        variant="outlined"
        fullWidth
        value={patientAddress}
        onChange={(e) => setPatientAddress(e.target.value)}
        style={{ marginBottom: "10px" }}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={requestAccess}
        disabled={loading}
        fullWidth
      >
        {loading ? "Requesting..." : "Request Access"}
      </Button>
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
  );
};

export default InsuranceCompanyPage;

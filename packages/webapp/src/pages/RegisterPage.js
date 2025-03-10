import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom'; 

// PatientHandler contract details
const patientHandlerAddress = "0x9A676e781A523b5d0C0e43731313A708CB607508"; // Replace with actual address
const patientHandlerAbi = [
  "function registerPatient() external",
];

//for the navigation to the view page


const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const navigate = useNavigate();

  // Ensure we are using a signer to send transactions
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

  useEffect(() => {
    const initAccount = async () => {
      if (window.ethereum) {
        try {
          const [selectedAccount] = await window.ethereum.request({ method: 'eth_requestAccounts' });
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

  const handleRegisterPatient = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!window.ethereum) {
        alert("MetaMask is not available. Please install it.");
        setLoading(false);
        return;
      }

      if (!account) {
        alert("Account is not available. Please connect your wallet.");
        setLoading(false);
        return;
      }

      console.log("Account Available: ", account);

      // Get the signer from the provider
      const signer = await getSigner();

      if (!signer) {
        alert("Signer not available.");
        setLoading(false);
        return;
      }

      console.log("Signer Address: ", signer.address); // In ethers v6, getAddress() is not needed

      // Create contract instance with signer
      const patientHandlerContract = new ethers.Contract(patientHandlerAddress, patientHandlerAbi, signer);
      console.log("Patient Handler Contract: ", patientHandlerContract);

      // Call the registerPatient function from the contract
      const tx = await patientHandlerContract.registerPatient();
      console.log("Transaction Sent: ", tx);

      await tx.wait(); // Wait for the transaction to be mined
      console.log("Transaction Mined: ", tx);

      alert("Patient registered successfully!");
    } catch (err) {
      console.error("Error registering patient:", err);
      setError("An error occurred while registering the patient. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Register as a Patient</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <Button
        variant="contained"
        color="primary"
        onClick={handleRegisterPatient}
        disabled={loading}
      >
        {loading ? "Registering..." : "Register"}
      </Button>

      {/* Button to navigate to the PatientPage */}
      <Button
        variant="outlined"
        color="secondary"
        onClick={() => navigate('/patient')}
        style={{ marginTop: '10px' }}
      >
        Go to Patient Page
      </Button>
    </div>
  );
};

export default RegisterPage;
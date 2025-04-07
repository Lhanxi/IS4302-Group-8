import { Button, CircularProgress } from "@mui/material";
import { ethers } from "ethers";
import forge from "node-forge";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { insuranceCompanyHandlerAddress } from "../utils/contractAddress";
import { insuranceCompanyHandlerABI } from "../utils/contractABI";

const RegisterInsuranceCompany = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const navigate = useNavigate();
  const [privateKey, setPrivateKey] = useState(null);
  const [publicKey, setPublicKey] = useState(null);

  // Function to get signer (used to send transactions)
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

  const generateRSAKeyPair = async () => {
    console.log("Generating RSA key pair...");
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulating async behavior
        const keyPair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
        const privateKeyPem = forge.pki.privateKeyToPem(keyPair.privateKey);
        const publicKeyPem = forge.pki.publicKeyToPem(keyPair.publicKey);
        console.log("Generated publicKey:", publicKeyPem);
        console.log("Generated privateKey:", privateKeyPem);
        resolve({ privateKeyPem, publicKeyPem });
        setPrivateKey(privateKeyPem);
        setPublicKey(publicKeyPem);
      }, 100); // Small delay to mimic async execution
    });
  };

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

  // Function to handle authentication
  const registerInsuranceCompany = async () => {
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

      // Get the signer from the provider
      const signer = await getSigner();
      if (!signer) {
        setLoading(false);
        return;
      }

      console.log("Signer Address: ", signer.address); // In ethers v6, getAddress() is not needed

      // Create contract instance with signer
      const InsuranceCompanyHandlerContract = new ethers.Contract(
        insuranceCompanyHandlerAddress,
        insuranceCompanyHandlerABI,
        signer
      );
      console.log(
        "Insurance Company Handler Contract: ",
        InsuranceCompanyHandlerContract
      );

      const { privateKeyPem, publicKeyPem } = await generateRSAKeyPair();

      //parse the data into the contract
      const tx =
        await InsuranceCompanyHandlerContract.authenticateInsuranceCompany(
          signer.address,
          publicKeyPem
        );
      await tx.wait();

      alert("Insurance company's authentication status updated!");
      
      const isAuthenticated = await InsuranceCompanyHandlerContract.isAuthenticated(signer.address);
      if (isAuthenticated) {
        navigate("/insuranceCompany");
      } else {
        return;
      }
    } catch (err) {
      console.error("Error registering insurance company:", err);
      setError("Authentication Rejected. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginLeft: "10px" }}>
      <h2>Register as a InsuranceCompany</h2>

      <div style={{ display: "flex", gap: "10px" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={registerInsuranceCompany}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            "Register Insurance Company"
          )}
        </Button>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default RegisterInsuranceCompany;

import { Button, CircularProgress } from "@mui/material";
import { ethers } from "ethers";
import forge from "node-forge";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { insuranceCompanyHandlerAddress } from "../utils/contractAddress";
import { insuranceCompanyHandlerABI } from "../utils/contractABI";

const RegisterInsuranceCompany = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [pin, setPin] = useState(""); // ✅ Added PIN state
  const navigate = useNavigate();

  const getSigner = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return null;
    }

    try {
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      await newProvider.send("eth_requestAccounts", []);
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
        const keyPair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
        const privateKeyPem = forge.pki.privateKeyToPem(keyPair.privateKey);
        const publicKeyPem = forge.pki.publicKeyToPem(keyPair.publicKey);
        console.log("Generated publicKey:", publicKeyPem);
        console.log("Generated privateKey:", privateKeyPem);
        resolve({ privateKeyPem, publicKeyPem });
        setPrivateKey(privateKeyPem);
        setPublicKey(publicKeyPem);
      }, 100);
    });
  };

  // ✅ Store PIN, private key and address in backend
  const StoreAddressForm = async (address, pin, privateKey) => {
    try {
      const response = await axios.post("http://localhost:5001/store-address", {
        address,
        pin,
        privateKeyP: privateKey,
      });
      console.log("Response from backend:", response.data);
    } catch (err) {
      console.error("Error storing address:", err);
    }
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

      const signer = await getSigner();
      if (!signer) {
        setLoading(false);
        return;
      }

      console.log("Signer Address: ", signer.address);
      const insuranceCompanyHandlerContract = new ethers.Contract(
        insuranceCompanyHandlerAddress,
        insuranceCompanyHandlerABI,
        signer
      );
      console.log("Insurance Handler Contract: ", insuranceCompanyHandlerContract);

      let tx = await insuranceCompanyHandlerContract.updateAuthentication(signer.address);
      await tx.wait();
      console.log("Synced authentication status with oracle.");

      let isAuthenticated = await insuranceCompanyHandlerContract.isAuthenticated(signer.address);
      if (isAuthenticated) {
        navigate("/insuranceCompany");
      } else {
        const { privateKeyPem, publicKeyPem } = await generateRSAKeyPair();

        await StoreAddressForm(await signer.getAddress(), pin, privateKeyPem);

        const tx = await insuranceCompanyHandlerContract.authenticateInsuranceCompany(
          signer.address,
          publicKeyPem
        );
        await tx.wait();

        alert("Insurance Company's authentication status updated!");

        isAuthenticated = await insuranceCompanyHandlerContract.isAuthenticated(signer.address);
        if (isAuthenticated) {
          navigate("/insuranceCompany");
        } else {
          return;
        }
      }
    } catch (err) {
      console.error("Error registering insurance company:", err);
      setError("Authentication Rejected. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    const userPin = prompt("Please enter your PIN:");
    setPin(userPin);
  };

  return (
    <div style={{ marginLeft: "10px" }}>
      <h2>Register as a InsuranceCompany</h2>

      <Button onClick={handleButtonClick}>Enter PIN</Button> 

      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
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

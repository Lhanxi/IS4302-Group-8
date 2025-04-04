import {
    Alert,
    Box,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
  } from "@mui/material";
  import { createTheme, ThemeProvider } from "@mui/material/styles";
  import { ethers } from "ethers";
  import React, { useEffect, useState } from "react";
  import axios from 'axios';
  import { PatientHandlerAddress } from "./contractAdress";
import { decryptAESKey } from "./DecryptAES";
import decryptPatientDataCopy from "./decryptPatientDataCopy";
  
  const PatientRecords = () => {
    const [records, setRecords] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [patientContract, setPatientContract] = useState(null);
    const [currentAccount, setCurrentAccount] = useState(null);
    const [input, setInput] = useState('');
    const [pin, setPin] = useState('');
    const [showPinInput, setShowPinInput] = useState(false); 
    const [hasRequestedData, setHasRequestedData] = useState(false); 
    const [privateKey, setPrivateKey] = useState('');
    const [patientData, setPatientData] = useState([]);
    const [decryptedPatientData, setDecryptedPatientData] = useState([]);

  
    const patientHandlerAbi = [
      "function getPatientContract(address patient) public view returns (address)",
    ];
  
    const patientAbi = [
      "function getCIDs() external view returns (string[] memory)",
      "function getAES() external view returns (string memory)"
    ];
  
    const theme = createTheme({
      palette: {
        mode: "dark",
        primary: {
          main: "#00bcd4",
        },
        background: {
          default: "#121212",
        },
      },
      typography: {
        fontFamily: "Roboto, sans-serif",
      },
    });

    const getPrivateKey = async (ad, pin) => {
        try {
            const response = await axios.get(`http://localhost:5001/get-private-key/${ad}/${pin}`);
            const privKey = response.data.privateKey;
            console.log(privKey);
            setPrivateKey(privKey); // Assuming setPrivateKey is a function to set the state
            return privKey; // Returning the privateKey
        } catch (error) {
            console.error("Error fetching private key:", error);
            throw error; // Optionally throw error if needed
        }
    };    

    const fetchData = async (cid, localArray) => {
        try {
            const response = await fetch(`http://localhost:5001/fetch-ipfs?cid=${cid}`);
            if (!response.ok) throw new Error("Failed to fetch patient data");
    
            const data = await response.json();
            console.log("data", data);
    
            localArray.push(data); // Push into local array
        } catch (err) {
            console.error("Fetch error:", err);
            setError(err.message);
        }
    };
    
  
    useEffect(() => {
        const init = async () => {
          try {
            if (!hasRequestedData || !pin) return; // NEW: Only run if user clicked "Request Data" AND set PIN
      
            console.log("Initializing PatientRecords component...");
      
            if (!window.ethereum) {
              console.error("MetaMask not detected.");
              setError("Please install MetaMask!");
              setLoading(false);
              return;
            }
      
            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const accounts = await provider.send("eth_requestAccounts", []);
            console.log("Connected account:", accounts[0]);
            setCurrentAccount(accounts[0]);
      
            console.log("Initializing PatientHandler contract...");
            const patientHandlerContract = new ethers.Contract(
              PatientHandlerAddress,
              patientHandlerAbi,
              signer
            );
      
            console.log("Fetching patient contract address...");
            const patientAddress = await patientHandlerContract.getPatientContract(
              accounts[0]
            );
            console.log("Retrieved patient contract address:", patientAddress);
      
            if (patientAddress === "0x0000000000000000000000000000000000000000") {
              console.warn("No patient contract found for this address.");
              setError("You are not registered as a patient!");
              setLoading(false);
              return;
            }
      
            console.log("Initializing Patient contract...");
            const patientContractInstance = new ethers.Contract(
              patientAddress,
              patientAbi,
              signer
            );
            setPatientContract(patientContractInstance);
      
            console.log("Fetching patient records...");
      
            console.log("Fetching CIDS");
            const CIDs = await patientContractInstance.getCIDs();
            console.log("CIDs", CIDs);
      
            console.log("Fetching encrypted AES");
            const encryptedAES = await patientContractInstance.getAES();
            console.log("AES", encryptedAES);
      
            console.log("Fetching patient private key"); 
            const ad = await signer.getAddress(); 
            const privKey = await getPrivateKey(ad, pin); 
            console.log("priv key", privKey); 

            console.log("Decrypting the AES"); 
            const decryptedAES = await decryptAESKey(encryptedAES, privKey);
            console.log("decrypted AEs", decryptedAES);
            
            console.log("Getting the data from pinata"); 
            const localPatientData = [];

            for (const cid of Array.from(CIDs)) {
                await fetchData(cid, localPatientData); // Pass the local array to be updated
                console.log("called data");
            }

            console.log("Final localPatientData:", localPatientData);



            for (let i = 0; i < localPatientData.length; i++) {
            console.log("power");
            let decryptedData = await decryptPatientDataCopy(localPatientData[i], decryptedAES);
            console.log("decrypte datat", decryptedData); 
            console.log("tests");
            setDecryptedPatientData((prevData) => [...prevData, decryptedData]);
            }


            setLoading(false);
          } catch (err) {
            console.error("Error initializing PatientRecords:", err);
            setError("Failed to load records. Please try again.");
            setLoading(false);
          }
        };
      
        init();
      }, [hasRequestedData, pin]);
      
      
  
    return (
        <div>
        {!showPinInput ? (
            <button onClick={() => setShowPinInput(true)}>Request Data</button>
        ) : (
            <>
            <input
                type="password"
                placeholder="Enter PIN"
                onChange={(e) => setInput(e.target.value)}
            />
            <button
                onClick={() => {
                setPin(input);
                setHasRequestedData(true);
                }}
            >
                Set PIN
            </button>
            </>
        )}
        </div>

       
    );
  };
  
  export default PatientRecords;
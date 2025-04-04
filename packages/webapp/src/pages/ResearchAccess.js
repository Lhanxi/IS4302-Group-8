import React, { useEffect } from "react";
import { Button } from "@mui/material";
import { ResearchAccessABI, ResearchAccessAddress } from "./contractAdress";
import { useState } from "react";
import { ethers } from 'ethers';

function ResearchAccess() {
    const [researchAccess, setResearchAccess] = useState(null);
    const [requestSigner, setSigner] = useState('');
    const [records, setRecords] = useState([]);
    

    const handleClick = async () => {
        console.log("Research Access button clicked");
        const cids = await researchAccess.getCIDs();
      
        const records = await Promise.all(
          cids.map(async (cid) => {
            const response = await fetch(`http://localhost:5001/fetch-ipfs?cid=${cid}`);
            if (!response.ok) throw new Error("Failed to fetch patient data");
            return await response.json();
          })
        );
      
        setRecords(records);
      };
      
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
          await setSigner(signer);
  
          console.log("Provider and Signer initialized.");
          return { provider: newProvider, signer };
      };

      useEffect(() => {
        const init = async () => {
          try {
            console.log("Starting initialization...");
      
            const { ethereum } = window;
            if (!ethereum) {
              alert("Please install MetaMask!");
              return;
            }
      
            const { provider, signer } = await getProviderAndSigner();
            if (!provider || !signer) return;
      
            const accounts = await ethereum.request({ method: "eth_requestAccounts" });
            console.log("Current account:", accounts[0]);
      
            const researchAccessInstance = new ethers.Contract(
              ResearchAccessAddress,
              ResearchAccessABI,
              signer
            );
            setResearchAccess(researchAccessInstance);
            console.log("research access instance", researchAccessInstance);
      
          } catch (error) {
            console.error("Initialization error:", error);
          }
        };
      
        init(); 
      }, []);
      

  return (
    <div> 
         <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Research Access</h1>
      <Button variant="contained" color="primary" onClick={handleClick}>
        Get Research Access
      </Button>
    </div>

    {records.length > 0 && (
                <div>
                    <h3>Decrypted Patient Records:</h3>
                    {records.map((record, idx) => (
                        <div key={idx} style={{ border: "1px solid #ccc", marginBottom: "1rem", padding: "1rem" }}>
                            <p><strong>Name:</strong> {record.name}</p>
                            <p><strong>ID:</strong> {record.identificationNumber}</p>
                            <p><strong>Gender:</strong> {record?.gender || ""}</p>
                            <p><strong>Age:</strong> {record?.age || ""}</p>
                            <p><strong>Health:</strong> {record.healthRecords}</p>
                            <p><strong>Timestamp:</strong> {record.timestamp}</p>
                        </div>
                    ))}
                </div>
            )}
    </div>
   
  );
}

export default ResearchAccess;

import {
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { patientHandlerABI } from "../utils/contractABI";
import { patientHandlerAddress } from "../utils/contractAddress";

// PatientHandler contract details
const patientHandlerAbi = patientHandlerABI;
const PatientHandlerAddress = patientHandlerAddress;

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#00bcd4" },
    background: { default: "#121212" },
  },
  typography: { fontFamily: "Roboto, sans-serif" },
});

const DoctorPage = () => {
  const [patientAddress, setPatientAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);

  const navigate = useNavigate();

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
    <ThemeProvider theme={theme}>
      <Container
        maxWidth="sm"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: 2,
          borderRadius: 2,
        }}
      >
        <Card
          sx={{
            width: "100%",
            p: 2,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(10px)",
            borderRadius: 3,
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
          }}
        >
          <CardContent>
            <Typography variant="h4" align="center" gutterBottom>
              Doctor Page
            </Typography>
            <TextField
              label="Enter patient address"
              variant="outlined"
              fullWidth
              value={patientAddress}
              onChange={(e) => setPatientAddress(e.target.value)}
              sx={{ mb: 2 }}
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
            <Button
              onClick={() => navigate("/uploadPatientData")}
              fullWidth
              sx={{ mt: 2 }}
            >
              Go to Upload Patient Data Page
            </Button>
            <Button
              onClick={() => navigate("/display")}
              fullWidth
              sx={{ mt: 2 }}
            >
              Go to View Patient Data Page
            </Button>
            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Container>
    </ThemeProvider>
  );
};

export default DoctorPage;

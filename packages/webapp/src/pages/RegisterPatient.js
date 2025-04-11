import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { ethers, ZeroAddress } from "ethers";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../contractConfig";
import { connectWallet } from "../utils/connectWallet";

function RegisterPatient() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkRegistration = async () => {
      if (contract && account) {
        try {
          const patientContractAddress = await contract.patientContracts(
            account
          );
          if (patientContractAddress !== ZeroAddress) {
            setIsRegistered(true);
            navigate("/");
          }
        } catch (error) {
          console.error("Error checking registration:", error);
        }
      }
    };

    checkRegistration();
  }, [contract, account, navigate]);

  const handleConnectWallet = async () => {
    const walletData = await connectWallet();
    if (walletData) {
      setAccount(walletData.account);
      setProvider(walletData.provider);
      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        walletData.signer
      );
      setContract(contractInstance);
    }
  };

  const registerPatient = async () => {
    if (!contract) return console.log("Contract not loaded yet.");

    try {
      const tx = await contract.registerPatient();
      await tx.wait();
      console.log("Patient Registered Successfully");
      setIsRegistered(true);
      navigate("/");
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  const theme = createTheme({
    palette: {
      mode: "dark",
      primary: { main: "#00bcd4" },
      background: { default: "#121212" },
    },
    typography: { fontFamily: "Roboto, sans-serif" },
  });

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
              Register as a Patient
            </Typography>
            {account ? (
              <Box textAlign="center" mt={3}>
                {isRegistered ? (
                  <Typography variant="h6">
                    You are already registered!
                  </Typography>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={registerPatient}
                    size="large"
                  >
                    Register as Patient
                  </Button>
                )}
                <Typography variant="subtitle1" mt={2}>
                  Connected Account: {account}
                </Typography>
              </Box>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleConnectWallet}
                size="large"
              >
                Connect Wallet
              </Button>
            )}
          </CardContent>
        </Card>
      </Container>
    </ThemeProvider>
  );
}

export default RegisterPatient;

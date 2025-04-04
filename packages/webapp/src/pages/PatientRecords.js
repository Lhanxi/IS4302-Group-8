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
import { PatientHandlerAddress } from "./contractAdress";

const PatientRecords = () => {
  const [records, setRecords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientContract, setPatientContract] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);

  const patientHandlerAbi = [
    "function getPatientContract(address patient) public view returns (address)",
  ];

  const patientAbi = [
    "function viewOwnRecords() external view returns (string[] memory cids, address[] memory recordDoctors, uint256[] memory timestamps, string[] memory recordTypes, string memory aesKey, string memory publicKey, address[] memory authorizedDoctors)",
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

  useEffect(() => {
    const init = async () => {
      try {
        if (!window.ethereum) {
          setError("Please install MetaMask!");
          setLoading(false);
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const accounts = await provider.send("eth_requestAccounts", []);
        setCurrentAccount(accounts[0]);

        // Initialize PatientHandler contract
        const patientHandlerContract = new ethers.Contract(
          PatientHandlerAddress,
          patientHandlerAbi,
          signer
        );

        // Get patient's contract address
        const patientAddress = await patientHandlerContract.getPatientContract(
          accounts[0]
        );
        if (patientAddress === "0x0000000000000000000000000000000000000000") {
          setError("You are not registered as a patient!");
          setLoading(false);
          return;
        }

        // Initialize Patient contract
        const patientContractInstance = new ethers.Contract(
          patientAddress,
          patientAbi,
          signer
        );
        setPatientContract(patientContractInstance);

        // Fetch records
        const recordData = await patientContractInstance.viewOwnRecords();
        setRecords(recordData);
        setLoading(false);
      } catch (err) {
        console.error("Error initializing:", err);
        setError("Failed to load records. Please try again.");
        setLoading(false);
      }
    };

    init();
  }, []);

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Container
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
          }}
        >
          <CircularProgress />
        </Container>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <Container
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
          }}
        >
          <Alert severity="error">{error}</Alert>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Container sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
          Your Medical Records
        </Typography>

        <Grid container spacing={3}>
          {/* Summary Card */}
          <Grid item xs={12}>
            <Card
              sx={{
                mb: 4,
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                backdropFilter: "blur(10px)",
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Summary
                </Typography>
                <Typography>Total Records: {records.cids.length}</Typography>
                <Typography>
                  Authorized Doctors: {records.authorizedDoctors.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Records Table */}
          <Grid item xs={12}>
            <TableContainer
              component={Paper}
              sx={{
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Record Type</TableCell>
                    <TableCell>Doctor</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>CID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.cids.map((cid, index) => (
                    <TableRow key={index}>
                      <TableCell>{records.recordTypes[index]}</TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            backgroundColor: "rgba(0, 188, 212, 0.1)",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            display: "inline-block",
                          }}
                        >
                          {records.recordDoctors[index]}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {new Date(
                          records.timestamps[index] * 1000
                        ).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            backgroundColor: "rgba(0, 188, 212, 0.1)",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            display: "inline-block",
                            wordBreak: "break-all",
                          }}
                        >
                          {cid}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
};

export default PatientRecords;

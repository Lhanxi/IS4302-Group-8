// PatientInsurancePage.jsx
import {
  Button,
  Card,
  CardContent,
  Container,
  Typography,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import axios from "axios";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  insuranceCompanyABI,
  insuranceCompanyHandlerABI,
  patientABI,
  patientHandlerABI,
} from "../utils/contractABI";
import {
  insuranceCompanyHandlerAddress,
  patientHandlerAddress,
} from "../utils/contractAddress";
import { decryptAESKey } from "../utils/DecryptAES";
import encryptAESKey from "../utils/EncryptAES";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#00bcd4" },
    background: { default: "#121212" },
  },
  typography: { fontFamily: "Roboto, sans-serif" },
});

const PatientInsurancePage = () => {
  const [insuranceAgents, setInsuranceAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientHandlerContract, setPatientHandlerContract] = useState(null);
  const [patientContract, setPatientContract] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState(null);
  const [requestSigner, setSigner] = useState(null);
  const [requestProvider, setProvider] = useState(null);
  const [showPrivateKeyForm, setShowPrivateKeyForm] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [pin, setPin] = useState("");
  const [allowAccess, setAllowAccess] = useState(false);
  const navigate = useNavigate();

  const patientHandlerAbi = patientHandlerABI;
  const patientAbi = patientABI;
  const insuranceAbi = insuranceCompanyABI;

  const getProviderAndSigner = async () => {
    const { ethereum } = window;
    console.log("Connecting to provider and signer...");
    const newProvider = new ethers.BrowserProvider(ethereum);
    await newProvider.send("eth_requestAccounts", []);
    const signer = await newProvider.getSigner();
    console.log("Signer address:", await signer.getAddress());
    setSigner(signer);
    return { provider: newProvider, signer };
  };

  const handleAccessToggle = async () => {
    console.log("Toggling research access...");
    const initialAccess = await patientContract.getResearchAccess();
    console.log("Current access:", initialAccess);
    await patientContract.setResearchAccess(!initialAccess);
    const result = await patientContract.getResearchAccess();
    console.log("Updated access:", result);
    setAllowAccess(result);
  };

  const fetchPendingInsuranceAgents = async (
    contract,
    patientAddress,
    signer
  ) => {
    console.log("Fetching pending insurance companies...");
    const pending = await contract.getInsuranceCompanyPendingRequestForPatient(
      patientAddress
    );
    console.log("Pending insurance companies:", pending);
    const patientAddressContract = await contract.getPatientContract(
      await signer.getAddress()
    );
    console.log("Patient contract address:", patientAddressContract);
    const patient = await new ethers.Contract(
      patientAddressContract,
      patientAbi,
      signer
    );
    const agents = [];

    for (let address of pending) {
      const isApproved = await patient.checkInsuranceCompanyAccess(address);
      console.log(`Insurance company: ${address}, Access: ${isApproved}`);
      agents.push({
        id: address,
        agent: address,
        access: isApproved ? "Approved" : "Not Approved",
      });
    }

    return agents;
  };

  const getPrivateKey = async (ad, pin) => {
    console.log(`Requesting private key for address: ${ad} with pin`);
    const response = await axios.get(
      `http://localhost:5001/get-private-key/${ad}/${pin}`
    );
    const privKey = response.data.privateKey;
    console.log("Received private key.");
    setPrivateKey(privKey);
    return privKey;
  };

  const handleGrantAccessClick = (agent) => {
    console.log("Grant access clicked for:", agent);
    setSelectedAgent(agent);
    setShowPrivateKeyForm(true);
  };

  const handleGrantAccess = async () => {
    if (!pin) {
      alert("Please enter your pin!");
      return;
    }

    try {
      console.log("Granting access to:", selectedAgent);
      const encryptedAES = await patientContract.getAES();
      console.log("Encrypted AES:", encryptedAES);
      const ad = await requestSigner.getAddress();
      const privKey = await getPrivateKey(ad, pin);
      const decryptedAES = await decryptAESKey(encryptedAES, privKey);
      console.log("Decrypted AES:", decryptedAES);

      const insuranceHandler = await new ethers.Contract(
        insuranceCompanyHandlerAddress,
        insuranceCompanyHandlerABI,
        requestSigner
      );
      console.log("insurance handler", insuranceHandler);
      console.log(insuranceCompanyHandlerAddress);

      const isAuth = await insuranceHandler.isAuthenticated(selectedAgent);
      console.log("Is agent authenticated?", isAuth);

      console.log("selected agent", selectedAgent);
      const agentContractAddress =
        await insuranceHandler.getInsuranceContractAddress(selectedAgent);
      console.log("Agent contract address:", agentContractAddress);

      const agentContract = await new ethers.Contract(
        agentContractAddress,
        insuranceAbi,
        requestSigner
      );
      const agentPublicKey = await agentContract.getPublicKey();
      console.log("Agent public key:", agentPublicKey);
      const encryptedForAgent = await encryptAESKey(
        decryptedAES,
        agentPublicKey
      );
      console.log("Encrypted AES for agent:", encryptedForAgent);

      await patientContract.setInsuranceCompanyEncryptedAES(
        selectedAgent,
        encryptedForAgent
      );
      const tx = await patientContract.grantInsuranceCompanyAccess(
        selectedAgent,
        encryptedForAgent
      );
      console.log("Transaction sent:", tx);
      await tx.wait();
      console.log("Transaction confirmed.");

      const updatedAccess = await patientContract.checkInsuranceCompanyAccess(
        selectedAgent
      );
      console.log("Access confirmed:", updatedAccess);
      setInsuranceAgents(
        insuranceAgents.map((agent) =>
          agent.agent === selectedAgent
            ? { ...agent, access: "Approved" }
            : agent
        )
      );
    } catch (err) {
      console.error("Grant access error:", err);
      setError("Failed to grant access. Please try again.");
    }

    setShowPrivateKeyForm(false);
    setPrivateKey("");
    console.log("Private key form closed.");
  };

  const handleRevokeAccess = async (agent) => {
    console.log("Revoking access for:", agent);
    await patientContract.insuranceCompanyRevokeAccess(agent);
    console.log("Access revoked.");
    setInsuranceAgents(
      insuranceAgents.map((agent) =>
        agent.agent === selectedAgent
          ? { ...agent, access: "Not Approved" }
          : agent
      )
    );
  };

  useEffect(() => {
    const init = async () => {
      try {
        console.log("Initializing PatientInsurancePage...");
        setError(null);
        const { provider, signer } = await getProviderAndSigner();
        setProvider(provider);
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        console.log("Connected account:", accounts[0]);
        setCurrentAccount(accounts[0]);

        const handler = new ethers.Contract(
          patientHandlerAddress,
          patientHandlerAbi,
          signer
        );
        console.log("Patient handler contract initialized.");
        setPatientHandlerContract(handler);

        const patientAddress = await handler.getPatientContract(accounts[0]);
        console.log("Patient contract address:", patientAddress);

        if (patientAddress === "0x0000000000000000000000000000000000000000") {
          console.log("User is not registered.");
          setIsRegistered(false);
          setLoading(false);
          return;
        }

        console.log("User is registered.");
        setIsRegistered(true);
        const contract = new ethers.Contract(
          patientAddress,
          patientAbi,
          signer
        );
        setPatientContract(contract);
        const researchAccess = await contract.getResearchAccess();
        console.log("Initial research access:", researchAccess);
        setAllowAccess(researchAccess);

        const insuranceList = await fetchPendingInsuranceAgents(
          handler,
          accounts[0],
          signer
        );
        setInsuranceAgents(insuranceList);
        setLoading(false);
        console.log("Initialization complete.");
      } catch (err) {
        console.error("Initialization error:", err);
        setError(
          "Something went wrong. Please refresh the page or check your network."
        );
        setLoading(false);
      }
    };

    init();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <ThemeProvider theme={theme}>
      <Container
        maxWidth="md"
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
              Patient Insurance Page
            </Typography>
            {allowAccess !== null && (
              <Typography variant="h6" align="center" gutterBottom>
                Currently you allow research access: {allowAccess.toString()}
              </Typography>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={handleAccessToggle}
              fullWidth
              sx={{ mb: 2 }}
            >
              Toggle Research Access
            </Button>
            {!isRegistered ? (
              <div>
                <Typography variant="h6" align="center" gutterBottom>
                  You are not registered yet.
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate("/patient-records")}
                  fullWidth
                >
                  Go to Registration Page
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate("/patient-records")}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Go to Registration Page
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate("/patient")}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Go to Patient Page
                </Button>
                <table
                  border="1"
                  style={{ width: "100%", borderCollapse: "collapse" }}
                >
                  <thead>
                    <tr>
                      <th>Insurance Company Address</th>
                      <th>Access</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insuranceAgents.map((agent) => (
                      <tr key={agent.id}>
                        <td>{agent.agent}</td>
                        <td>{agent.access}</td>
                        <td>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleGrantAccessClick(agent.agent)}
                            sx={{ mr: 1 }}
                          >
                            Grant Access
                          </Button>
                          <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => handleRevokeAccess(agent.agent)}
                          >
                            Revoke Access
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {showPrivateKeyForm && (
                  <div
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "white",
                        padding: "20px",
                        borderRadius: "10px",
                      }}
                    >
                      <Typography variant="h6" gutterBottom>
                        Enter Your PIN
                      </Typography>
                      <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="Enter your PIN"
                        style={{
                          width: "100%",
                          padding: "10px",
                          marginBottom: "10px",
                        }}
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleGrantAccess}
                        style={{ marginRight: "10px" }}
                      >
                        Submit
                      </Button>
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => setShowPrivateKeyForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </ThemeProvider>
  );
};

export default PatientInsurancePage;

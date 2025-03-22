import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { PatientAddress, PatientHandlerAddress  } from './contractAdress';

const PatientPage = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [patientHandlerContract, setPatientHandlerContract] = useState(null);
    const [patientContract, setPatientContract] = useState(null);
    const [currentAccount, setCurrentAccount] = useState(null);
    const [isRegistered, setIsRegistered] = useState(false);
    const [error, setError] = useState(null);

    // State for private key input
    const [showPrivateKeyForm, setShowPrivateKeyForm] = useState(false);
    const [privateKey, setPrivateKey] = useState("");
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    const patientHandlerAbi = [
      "function getPendingRequestForPatient(address patient) public view returns (address[] memory)",
      "function registerPatient() external",
      "function accessRequests(address patient, address doctor) public view returns (bool)",
      "function getPatientContract(address patient) public view returns (address)",
  ];
    const patientAbi = [
        "function accessRequests(address doctor) external view returns (bool)",
        "function accessList(address doctor) external view returns (bool)",
        "function revokeAccess(address doctor) external",
        "function grantAccess(address doctor, string memory encryptedKey) external", 
        "function getAES() external view returns (string memory)", 
        "function checkDoctorAccess(address doctor) external view returns (bool)"
    ];

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

        console.log("Provider and Signer initialized.");
        return { provider: newProvider, signer };
    };

    useEffect(() => {
        const init = async () => {
            try {
                console.log("Starting initialization...");
                setError(null);

                const { ethereum } = window;
                if (!ethereum) {
                    alert("Please install MetaMask!");
                    return;
                }

                const { provider, signer } = await getProviderAndSigner();
                if (!provider || !signer) return;

                const accounts = await ethereum.request({ method: "eth_requestAccounts" });
                await setCurrentAccount(accounts[0]);
                console.log("Current account:", accounts[0]);

                const patientHandlerContractInstance = new ethers.Contract(PatientHandlerAddress, patientHandlerAbi, signer);
                await setPatientHandlerContract(patientHandlerContractInstance);
                console.log("PatientHandler contract initialized:", patientHandlerContractInstance);

                console.log("Fetching patient contract for account:", accounts[0]);
                let patientAddress;
                try {
                    patientAddress = await patientHandlerContractInstance.getPatientContract(accounts[0]);
                    console.log("Fetched patient contract address:", patientAddress);
                } catch (err) {
                    console.error("Error fetching patient contract:", err);
                    setError("Failed to fetch patient contract. Please try again.");
                    setLoading(false);
                    return;
                }

                if (patientAddress === "0x0000000000000000000000000000000000000000") {
                    console.log("User is NOT registered.");
                    setIsRegistered(false);
                    setLoading(false);
                    return;
                }

                console.log("User is registered.");
                setIsRegistered(true);

                console.log("Initializing patient contract...");
                const patientContractInstance = new ethers.Contract(patientAddress, patientAbi, signer);
                setPatientContract(patientContractInstance);
                console.log("Patient contract initialized:", patientContractInstance);

                console.log("Fetching pending doctor requests...");
                const doctorsList = await fetchPendingDoctors(patientHandlerContractInstance, accounts[0], signer);
                console.log("Fetched pending doctors:", doctorsList);
                setDoctors(doctorsList);
                setLoading(false);
            } catch (err) {
                console.error("Initialization error:", err);
                setError("Something went wrong. Please refresh the page or check your network.");
                setLoading(false);
            }
        };

        init();
    }, []);

    const fetchPendingDoctors = async (patientHandlerContract, patientAddress, signer) => {
        try {
            console.log("Fetching pending doctor requests for patient:", patientAddress);
            const pendingDoctors = await patientHandlerContract.getPendingRequestForPatient(patientAddress);
            console.log("Pending doctors retrieved:", pendingDoctors);

            console.log("Fetching patient contract address...");
            const patientContractAddress = await patientHandlerContract.getPatientContract(await signer.getAddress());
            console.log("Patient contract address:", patientContractAddress);
            
            console.log("Creating Patient contract instance...");
            const patientContract = new ethers.Contract(patientContractAddress, patientAbi, signer);

            const doctorsList = [];
            for (let address of pendingDoctors) {
                console.log("Checking access status for doctor:", address);
                
                const isApproved = await patientContract.checkDoctorAccess(address);
                console.log(`Doctor: ${address}, Approved: ${isApproved}`);

                doctorsList.push({
                    id: address,
                    doctor: address,
                    access: isApproved ? "Approved" : "Not Approved",
                });
            }
            return doctorsList;
        } catch (err) {
            console.error("Error fetching pending doctors:", err);
            return [];
        }
    };

    const handleGrantAccessClick = (doctor) => {
        setSelectedDoctor(doctor);
        setShowPrivateKeyForm(true); // Show form when button is clicked
    };

    const handleGrantAccess = async () => {
        if (!privateKey) {
            alert("Please enter your private key!");
            return;
        }

        try {
            console.log("Patient Contract:", patientContract);
            
            // Simulating decryption (replace this with actual decryption logic)
            const decryptedAES = await decryptAESWithPrivateKey(privateKey);
            console.log("Decrypted AES Key:", decryptedAES);

            //encrypt the AES again (need to further be implemented)

            // Call the contract function to grant access
            const tx = await patientContract.grantAccess(selectedDoctor, decryptedAES);
            await tx.wait(); // Wait for the transaction to be confirmed
            console.log("Access granted to doctor:", selectedDoctor);

            // Now check if access is granted
            const app = await patientContract.checkDoctorAccess(selectedDoctor);
            console.log("Doctor post approve:", app);


            // Update UI
            setDoctors(doctors.map(doc => doc.doctor === selectedDoctor ? { ...doc, access: "Approved" } : doc));
        } catch (err) {
            console.error("Grant access error:", err);
            setError("Failed to grant access. Please try again.");
        }

        // Close the form
        setShowPrivateKeyForm(false);
        setPrivateKey("");
    };

    //dummy function for now
    const decryptAESWithPrivateKey = (privateKey) => {
        return "decryptedAESKey"; // Replace with actual decryption logic
    };


    const handleRevokeAccess = async (doctor) => {
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div>
            {!isRegistered ? (
                <div>
                    <h2>You are not registered yet.</h2>
                </div>
            ) : (
                <>
                    <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th>Doctor Address</th>
                                <th>Access</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {doctors.map((doctor) => (
                                <tr key={doctor.id}>
                                    <td>{doctor.doctor}</td>
                                    <td>{doctor.access}</td>
                                    <td>
                                        <button onClick={() => handleGrantAccessClick(doctor.doctor)}>Grant Access</button>
                                        <button onClick={() => handleRevokeAccess(doctor.doctor)}>Revoke Access</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Private Key Input Form (Modal) */}
                    {showPrivateKeyForm && (
                        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px' }}>
                                <h3>Enter Your Private Key</h3>
                                <input
                                    type="password"
                                    value={privateKey}
                                    onChange={(e) => setPrivateKey(e.target.value)}
                                    placeholder="Private Key"
                                    style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
                                />
                                <button onClick={handleGrantAccess} style={{ marginRight: '10px' }}>Submit</button>
                                <button onClick={() => setShowPrivateKeyForm(false)}>Cancel</button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PatientPage;

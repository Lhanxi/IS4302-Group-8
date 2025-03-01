//track edits (done from the frontend by accessing event logs)

import { ethers } from "ethers";
import {HEALTH_RECORD_MANAGER_CONTRACT_ADDRESS, HEALTH_RECORD_MANAGER_CONTRACT_ABI} from "../contractConfig.js"

// Query for past events
export const editLogs = async (patientAddress) => {
    if (!window.ethereum) {
        alert("Please install MetaMask.");
        return null;
    }

    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(HEALTH_RECORD_MANAGER_CONTRACT_ADDRESS, HEALTH_RECORD_MANAGER_CONTRACT_ABI, provider);
        const logs = await contract.queryFilter(
            contract.filters.PatientDataUploaded(patientAddress, null),
            0,
            "latest"
        );
        return logs
    } catch (error) {
        console.error("Could not retrieve logs: ", error);
        return null;
    }
};
import { ethers } from "ethers";

export const connectWallet = async () => {
    if (!window.ethereum) {
        alert("Please install MetaMask.");
        return null;
    }

    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const accounts = await provider.send("eth_requestAccounts", []);

        return { account: accounts[0], provider, signer };
    } catch (error) {
        console.error("Wallet connection failed:", error);
        return null;
    }
};

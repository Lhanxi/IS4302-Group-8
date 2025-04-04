async function decryptPatientDataCopy(encryptedFileData, aesKey) {
    try {
        // Convert Base64 strings back to ArrayBuffers
        console.log(encryptedFileData);
        console.log(encryptedFileData.iv);
        const ivBuffer = base64ToArrayBuffer(encryptedFileData.iv);
        const encryptedDataBuffer = base64ToArrayBuffer(encryptedFileData.encryptedData);
        //const aesKeyBuffer = base64ToArrayBuffer(aesKey); // Convert base64 to ArrayBuffer


        // Import the AES key into a CryptoKey object
        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            aesKey,
            { name: "AES-GCM" },
            false,
            ["decrypt"]
        );

        console.log("hi");
        // Decrypt the data using AES-GCM
        const decryptedData = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: ivBuffer },
            cryptoKey,
            encryptedDataBuffer
        );

        // Convert the decrypted data back into a string
        const decoder = new TextDecoder();
        const decryptedString = decoder.decode(decryptedData);
        console.log("bye");

        // Parse the decrypted string back to a JSON object
        const patientData = JSON.parse(decryptedString);

        return patientData;
    } catch (err) {
        console.error("Error decrypting patient data:", err);
        throw new Error("Failed to decrypt patient data");
    }
}

// Helper function to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

export default decryptPatientDataCopy;

async function encryptPatientData(patientData, aesKey) {
    // Convert patient data to a JSON string
    const patientDataString = JSON.stringify(patientData);

    // Convert the string into a Uint8Array (binary format)
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(patientDataString);

    // Generate a random IV (Initialization Vector) for AES-GCM
    const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM typically uses a 12-byte IV

    // Import the AES key into a CryptoKey object
    const cryptoKey = await crypto.subtle.importKey(
        "raw", 
        new TextEncoder().encode(aesKey), 
        { name: "AES-GCM" }, 
        false, 
        ["encrypt"]
    );

    // Encrypt the data using AES-GCM
    const encryptedData = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        cryptoKey,
        dataBuffer
    );

    // Convert the encrypted data into a base64 string for easier storage
    const encryptedDataBase64 = arrayBufferToBase64(encryptedData);

    // Convert the IV into a base64 string
    const ivBase64 = arrayBufferToBase64(iv);

    // Create a JSON object to store the encrypted data and IV
    const encryptedFileData = {
        iv: ivBase64,
        encryptedData: encryptedDataBase64,
    };

    // Convert the object to a Blob to create a JSON file
    const jsonBlob = new Blob([JSON.stringify(encryptedFileData)], { type: "application/json" });

    // Create a File object from the Blob (this will be the file you save)
    const jsonFile = new File([jsonBlob], "encrypted_patient_data.json", { type: "application/json" });

    console.log("Encrypted JSON File Created:", jsonFile);

    return jsonFile;
}

// Helper function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}


export default encryptPatientData;
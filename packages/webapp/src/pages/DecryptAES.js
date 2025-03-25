import forge from 'node-forge';

export function decryptAESKey(encryptedAESKeyBase64, privateKeyPem) {
    try {
        console.log("pk", privateKeyPem);
        const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

        // Decode from Base64
        const encryptedBytes = forge.util.decode64(encryptedAESKeyBase64);

        // Decrypt using RSA private key
        const decryptedAESKey = privateKey.decrypt(encryptedBytes, "RSA-OAEP");

        // Convert back to a Uint8Array
        return new Uint8Array([...decryptedAESKey].map(c => c.charCodeAt(0)));
    } catch (error) {
        console.error("Error decrypting AES key:", error);
        throw new Error("Failed to decrypt AES key");
    }
}

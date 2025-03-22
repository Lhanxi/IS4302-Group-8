import forge from "node-forge";

async function encryptAESKey(aesKey, publicKeyPem) {
    // Convert PEM to Forge public key
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);

    // Convert AES key to a binary string
    const aesKeyBuffer = new Uint8Array(aesKey);
    const aesKeyString = String.fromCharCode(...aesKeyBuffer);

    // Encrypt the AES key with the RSA public key
    const encryptedAESKey = publicKey.encrypt(aesKeyString, "RSA-OAEP");

    // Convert encrypted key to base64 for easy storage/transmission
    return forge.util.encode64(encryptedAESKey);
}

export default encryptAESKey;

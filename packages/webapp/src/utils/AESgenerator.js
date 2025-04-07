export async function generateAESKey(length = 256) {
    if (![128, 192, 256].includes(length)) {
        throw new Error("Invalid key size. Use 128, 192, or 256 bits.");
    }
    
    const key = await crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: length
        },
        true, // extractable
        ["encrypt", "decrypt"]
    );

    // Export key as raw bytes
    const exportedKey = await crypto.subtle.exportKey("raw", key);
    
    return { key, exportedKey }; // Return correct variables
}

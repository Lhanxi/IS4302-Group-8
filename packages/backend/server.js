const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors({origin: "http://localhost:3000"}));
const PORT = 5001;
app.use(express.json());


// MongoDB connection setup
const uri = "mongodb://localhost:27017"; 
const dbName = "keyManager";
let db;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const connectToDatabase = async () => {
  try {
    await client.connect();
    db = client.db(dbName);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
};

connectToDatabase();

app.get("/fetch-ipfs", async (req, res) => {
    try {
        const { cid } = req.query;
        if (!cid) return res.status(400).json({ error: "Missing CID" });

        const ipfsUrl = `https://fuchsia-genetic-pelican-990.mypinata.cloud/ipfs/${cid}`;
        const response = await fetch(ipfsUrl);
        if (!response.ok) throw new Error("Failed to fetch IPFS data");

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to store address and private key in MongoDB
app.post('/store-address', async (req, res) => {
  const { address, pin, privateKeyP } = req.body;
  console.log("hi");
  console.log("pin", pin);

  if (!address || !privateKeyP) {
    return res.status(400).send("Address and private key are required.");
  }

  try {
    const collection = db.collection('keys');
    
    // Check if the address already exists
    const existingUser = await collection.findOne({ address });

    if (!existingUser) {
      // Insert new record
      await collection.insertOne({ address, pin, privateKeyP });
      res.status(201).send("Address and private key stored successfully.");
    } else {
      // Update existing record
      await collection.updateOne(
        { address },
        { $set: { pin, privateKeyP } }
      );
      res.status(200).send("Address already exists. Private key and pin updated.");
    }
  } catch (err) {
    console.error("Error storing/updating address and private key in MongoDB:", err);
    res.status(500).send("Error storing address.");
  }
});


  app.get('/get-private-key/:address/:pin', async (req, res) => {
    try {
        console.log("test");
        const { address, pin } = req.params;
        
        if (!address || !pin) {
            return res.status(400).json({ error: "Address and PIN are required." });
        }

        const collection = db.collection('keys');

        // Find the address in the database
        const user = await collection.findOne({ address });
        console.log("address", address); 
        console.log("useradd", user.address);

        if (!user) {
            return res.status(404).json({ error: "Address not found." });
        }

        // Check if the PIN matches the address
        console.log("pin", pin); 
        console.log("userpin", user.pin); 
        console.log(pin == user.pin);

        if (pin != user.pin) {
            return res.status(401).json({ error: "Invalid PIN." });
        }

        // Return the private key
        res.json({ privateKey: user.privateKeyP });

    } catch (error) {
        console.error("Error retrieving private key:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
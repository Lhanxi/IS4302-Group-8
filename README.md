 # IS4302-Group-8
IS4302 Group 8

## Instructions to get started

1. Execute `npm i` in the root folder to install dependencies.

2. Open a new terminal and navigate to the `packages/hardhat` directory:
    ```bash
    cd packages/hardhat
    ```

3. Start the Hardhat node:
    ```bash
    npx hardhat node
    ```

4. Go back to the original terminal and deploy the contract:
    ```bash
    cd packages/hardhat
    npx hardhat run scripts/deploy.js --network localhost
    ```

5. Copy the address that the contract is deployed to and update the contract address in `/IS4302-Group-8/packages/webapp/src/contractConfig.js`.

6. Navigate to the `webapp` directory and start the application:
    ```bash
    cd ../webapp
    npm start
    ```
import { ethers } from 'ethers';
import contractDeployment from '../../contract-deployment.json';

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Network type definition
type NetworkConfig = {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer?: string;
  currency?: string;
};

// BGVReportStorage contract ABI from deployment
export const BGV_CONTRACT_ABI = contractDeployment.abi;

// Contract Configuration
export const CONTRACT_CONFIG = {
  // Contract addresses for different networks
  addresses: {
    sepolia: "", // Example address
    mainnet: "", // Example address
    eduChain: contractDeployment.address, // Address from deployment
  },
  
  // Infura API key for Ethereum networks
  infuraApiKey: "",
  
  // Networks configuration
  networks: {
    sepolia: {
      chainId: 11155111,
      name: "Sepolia",
      rpcUrl: "",
      blockExplorer: "https://sepolia.etherscan.io"
    } as NetworkConfig,
    mainnet: {
      chainId: 1,
      name: "Ethereum Mainnet",
      rpcUrl: "",
      blockExplorer: "https://etherscan.io"
    } as NetworkConfig,
    eduChain: contractDeployment.network as NetworkConfig
  },
  
  // Default network
  defaultNetwork: "eduChain"
};

// Helper function to get contract provider
export const getProvider = (network = CONTRACT_CONFIG.defaultNetwork) => {
  const networkConfig = CONTRACT_CONFIG.networks[network as keyof typeof CONTRACT_CONFIG.networks];
  return new ethers.providers.JsonRpcProvider(networkConfig.rpcUrl);
};

// Helper function to get contract instance (read-only)
export const getContractInstance = (network = CONTRACT_CONFIG.defaultNetwork) => {
  const provider = getProvider(network);
  const address = CONTRACT_CONFIG.addresses[network as keyof typeof CONTRACT_CONFIG.addresses];
  return new ethers.Contract(address, BGV_CONTRACT_ABI, provider);
};

// Helper function to get contract instance with signer (for transactions)
export const getSignedContractInstance = async (signer: ethers.Signer, network = CONTRACT_CONFIG.defaultNetwork) => {
  const address = CONTRACT_CONFIG.addresses[network as keyof typeof CONTRACT_CONFIG.addresses];
  return new ethers.Contract(address, BGV_CONTRACT_ABI, signer);
};

// Helper function to get a Web3Provider from window.ethereum
export const getWeb3Provider = () => {
  if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
    return new ethers.providers.Web3Provider(window.ethereum);
  }
  throw new Error('MetaMask is not installed. Please install it to use this application.');
};

// Helper function to connect to wallet via MetaMask
export const connectWallet = async () => {
  try {
    const provider = getWeb3Provider();
    await provider.send('eth_requestAccounts', []);
    return provider.getSigner();
  } catch (error) {
    console.error('Error connecting to wallet:', error);
    throw error;
  }
};

// Utility functions for working with report hashes
export const hashFunctions = {
  // Convert string to bytes32 hash
  stringToBytes32: (str: string): string => {
    // Create a hash from a string
    return ethers.utils.id(str);
  },
  
  // Create a bytes32 hash from a file
  fileToBytes32: async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (!event.target || !event.target.result) {
          reject(new Error('Failed to read file'));
          return;
        }
        
        // Hash file content
        const fileContent = event.target.result as ArrayBuffer;
        const hashArray = ethers.utils.arrayify(
          ethers.utils.keccak256(new Uint8Array(fileContent))
        );
        
        // Convert to bytes32 string
        const bytes32Hash = ethers.utils.hexlify(hashArray);
        resolve(bytes32Hash);
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }
}; 

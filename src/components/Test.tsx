import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { UniswapV3TwapOracle } from '@/utils/uniswap';
import { useEthersProvider } from '@/context/WalletContext';


// Common Uniswap V3 pool addresses on Ethereum mainnet
const COMMON_POOLS = {
  'USDC/WBTC (0.05%)': '0x99ac8cA7087fA4A2A1FB6357269965A2014ABc35',
  'USDC/ETH (0.3%)': '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
  'WBTC/WETH (0.3%)': '0xcbcdf9626bc03e24f779434178a73a0b4bad62ed',
  'ETH/USDT (0.3%)': '0x4e68ccd3e89f51c3074ca5072bbac773960dfa36',
};

function UniswapTwapOracle() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [poolAddress, setPoolAddress] = useState('');
  const [customPoolAddress, setCustomPoolAddress] = useState('');
  const [currentPrice, setCurrentPrice] = useState<any>();
  const [twaps, setTwaps] = useState({});
  const [oracle, setOracle] = useState<any>();

  // Connect wallet
  const connectWallet = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask or another Ethereum wallet');
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      
      console.log(`Connected to network: ${network.name} (${network.chainId})`);
      setConnected(true);
    } catch (err) {
      console.error('Connection error:', err);
    //   setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initialize oracle with selected pool
  const initializeOracle = async () => {
    if (!connected || !poolAddress) return;
    
    setLoading(true);
    setError(null);
    setCurrentPrice(null);
    setTwaps({});
    
    try {
      const provider = useEthersProvider()
      const twapOracle = new UniswapV3TwapOracle({provider, poolAddress});
      await twapOracle.initialize();
      
      setOracle(twapOracle);
      
      // Get current price
      const price = await twapOracle.getCurrentPrice();
      console.log(price)
      setCurrentPrice(price?.price!);
    } catch (err) {
      console.error('Oracle initialization error:', err);
    //   setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate TWAP for given time window
  const calculateTwap = async (seconds:number) => {
    if (!oracle) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const twap = await oracle?.getTwap(seconds);
      setTwaps(prev => ({
        ...prev,
        [seconds]: twap
      }));
    } catch (err) {
      console.error(`TWAP calculation error for ${seconds} seconds:`, err);
    //   setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate multiple TWAPs
  const calculateAllTwaps = async () => {
    if (!oracle) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const timeWindows = [
        5 * 60,       // 5 minutes
        15 * 60,      // 15 minutes
        60 * 60,      // 1 hour
        4 * 60 * 60,  // 4 hours
        24 * 60 * 60  // 24 hours
      ];
      
      const results = await oracle.getMultipleTimeWindowTwaps(timeWindows);
      setTwaps(results);
    } catch (err) {
      console.error('Multiple TWAP calculation error:', err);
    //   setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle pool selection
  const handlePoolSelect = (e:any) => {
    setPoolAddress(e.target.value);
  };

  // Handle custom pool address
  const handleCustomPoolSubmit = () => {
    if (ethers.isAddress(customPoolAddress)) {
      setPoolAddress(customPoolAddress);
    } else {
    //   setError('Invalid pool address');
    }
  };

  // Initialize oracle when pool address changes
  useEffect(() => {
    if (poolAddress && connected) {
      initializeOracle();
    }
  }, [poolAddress, connected]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Uniswap V3 TWAP Oracle</h1>
      
      {!connected ? (
        <button 
          onClick={connectWallet}
          className="px-4 py-2 bg-blue-600 text-white rounded mb-4"
          disabled={loading}
        >
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="mb-6">
          <div className="flex items-center">
            <span className="text-green-600 mr-2">✓</span>
            <span>Wallet Connected</span>
          </div>
          
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">Select Pool</h2>
            
            <div className="mb-4">
              <select 
                value={poolAddress} 
                onChange={handlePoolSelect}
                className="border rounded p-2 w-full mb-2"
              >
                <option value="">-- Select a pool --</option>
                {Object.entries(COMMON_POOLS).map(([name, address]) => (
                  <option key={address} value={address}>
                    {name} ({address.slice(0, 6)}...{address.slice(-4)})
                  </option>
                ))}
              </select>
              
              <div className="flex mt-2">
                <input
                  type="text"
                  placeholder="Custom pool address"
                  value={customPoolAddress}
                  onChange={(e) => setCustomPoolAddress(e.target.value)}
                  className="border rounded p-2 flex-1 mr-2"
                />
                <button
                  onClick={handleCustomPoolSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Use
                </button>
              </div>
            </div>
            
            {currentPrice !== null && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">Current Price</h2>
                <div className="bg-gray-100 p-4 rounded">
                  {currentPrice?.toFixed(6)}
                </div>
                
                <h2 className="text-xl font-semibold mt-6 mb-2">TWAP Calculations</h2>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <button 
                    onClick={() => calculateTwap(5 * 60)}
                    className="px-3 py-1 bg-gray-200 rounded"
                    disabled={loading}
                  >
                    5 min
                  </button>
                  <button 
                    onClick={() => calculateTwap(15 * 60)}
                    className="px-3 py-1 bg-gray-200 rounded"
                    disabled={loading}
                  >
                    15 min
                  </button>
                  <button 
                    onClick={() => calculateTwap(60 * 60)}
                    className="px-3 py-1 bg-gray-200 rounded"
                    disabled={loading}
                  >
                    1 hour
                  </button>
                  <button 
                    onClick={() => calculateTwap(4 * 60 * 60)}
                    className="px-3 py-1 bg-gray-200 rounded"
                    disabled={loading}
                  >
                    4 hours
                  </button>
                  <button 
                    onClick={() => calculateTwap(24 * 60 * 60)}
                    className="px-3 py-1 bg-gray-200 rounded"
                    disabled={loading}
                  >
                    24 hours
                  </button>
                  <button 
                    onClick={calculateAllTwaps}
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                    disabled={loading}
                  >
                    Calculate All
                  </button>
                </div>
                
                {Object.keys(twaps).length > 0 && (
                  <div className="bg-gray-100 p-4 rounded">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left">Time Window</th>
                          <th className="text-right">TWAP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(twaps).map(([seconds, price]) => (
                          <tr key={seconds}>
                            <td>{formatSeconds(Number(seconds))}</td>
                            <td className="text-right">{Number(price).toFixed(6)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {loading && <div className="text-blue-600">Loading...</div>}
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
}

// Helper function to format seconds into human-readable time
function formatSeconds(seconds:number) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export default UniswapTwapOracle;
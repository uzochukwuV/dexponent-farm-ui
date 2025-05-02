import { ethers, Contract, FallbackProvider, JsonRpcProvider } from 'ethers'; // Import necessary types from ethers
import { abi as IUniswapV3PoolABI } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import { useEthersProvider } from '@/context/WalletContext';

// Define an interface for the constructor parameters
interface UniswapV3TwapOracleParams {
    provider: JsonRpcProvider | FallbackProvider | undefined; // Use Provider type from ethers
    poolAddress: string;
}

// Define interfaces for the return types
interface CurrentPriceResult {
    tick: number;
    price: number;
    sqrtPriceX96: bigint; // Use bigint for uq112x112 values in modern ethers.js
}

interface MultipleTimeWindowTwapsResult {
    [key: number]: number; // Maps time window in seconds to TWAP price
}

/**
 * Uniswap V3 TWAP Oracle Implementation
 *
 * This class provides functionality to calculate Time-Weighted Average Prices
 * from Uniswap V3 pools using their built-in oracle capabilities.
 */
class UniswapV3TwapOracle {
    private provider: JsonRpcProvider | FallbackProvider | undefined;
    private poolAddress: string;
    private poolContract: Contract;
    private token0Address: string | undefined; // Use string for addresses
    private token1Address: string | undefined;
    private token0Decimals: number | undefined; // Use number for decimals
    private token1Decimals: number | undefined;

    constructor({ provider, poolAddress }: UniswapV3TwapOracleParams) {
        this.provider = provider;
        this.poolAddress = poolAddress;
        this.poolContract = new ethers.Contract(poolAddress, IUniswapV3PoolABI, provider);
    }

    /**
     * Initialize the oracle by fetching pool data
     */
    public async initialize(): Promise<void> {
        try {
            // Get token0 and token1 addresses
            this.token0Address = await this.poolContract.token0();
            this.token1Address = await this.poolContract.token1();

            // Get decimals for both tokens
            const token0Contract = new ethers.Contract(
                this.token0Address!,
                ['function decimals() view returns (uint8)'], // Minimal ABI for decimals
                this.provider
            );
            const token1Contract = new ethers.Contract(
                this.token1Address!,
                ['function decimals() view returns (uint8)'], // Minimal ABI for decimals
                this.provider
            );

            this.token0Decimals = Number(await token0Contract.decimals()); // Convert BigInt to number
            this.token1Decimals = Number(await token1Contract.decimals());

            console.log(`Pool initialized: ${this.token0Address}/${this.token1Address}`);
            console.log(`Decimals: ${this.token0Decimals}/${this.token1Decimals}`);
        } catch (error: any) {
            console.error('Error initializing TWAP oracle:', error);
            throw error;
        }
    }

    /**
     * Fetch the current tick and price from the pool
     * @returns {Promise<CurrentPriceResult>} The current tick, price, and sqrtPriceX96
     */
    public async getCurrentPrice(): Promise<CurrentPriceResult> {
        try {
            // Ensure decimals are initialized
            if (this.token0Decimals === undefined || this.token1Decimals === undefined) {
                await this.initialize(); // Initialize if not already done
            }

            const slot0 = await this.poolContract.slot0();
            // slot0 returns a struct-like object, access elements by index or name if available in ABI
            // Assuming slot0[0] is sqrtPriceX96 and slot0[1] is tick based on common V3 ABIs
            const sqrtPriceX96: bigint = slot0[0];
            const currentTick: number = Number(slot0[1]); // Convert BigInt tick to number

            // Convert sqrtPriceX96 to price
            const price = this.sqrtPriceX96ToPrice(sqrtPriceX96);

            return {
                tick: currentTick,
                price: price,
                sqrtPriceX96: sqrtPriceX96
            };
        } catch (error: any) {
            console.error('Error fetching current price:', error);
            throw error;
        }
    }

    /**
   * Get historical TWAP prices for multiple time windows
   * @param {number[]} timeWindows Array of time windows in seconds
   * @returns {Promise<Object>} Object with time windows as keys and TWAPs as values
   */
    async getMultipleTimeWindowTwaps(timeWindows:any) {
        try {
            // Sort time windows in ascending order
            const sortedWindows = [...timeWindows].sort((a, b) => a - b);

            // Create an array with 0 at the beginning for current time
            const observeWindows = [0, ...sortedWindows];

            // Call observe with all time windows at once
            const observations = await this.poolContract.observe(observeWindows);

            // Extract tickCumulatives from the returned proxied array
            const tickCumulatives = observations[0];

            const result = {};
            // Calculate TWAP for each time window
            for (let i = 0; i < sortedWindows.length; i++) {
                const window = sortedWindows[i];
                // tickCumulatives[0] is the current cumulative tick
                // tickCumulatives[i+1] is the cumulative tick `window` seconds ago
                const tickCumulativesDelta = Number(tickCumulatives[0] - tickCumulatives[i + 1]);
                const arithmeticMeanTick = tickCumulativesDelta / window;
                const price = this.tickToPrice(Math.floor(arithmeticMeanTick));

                (result as any)[window] = price;
            }

            return result;
        } catch (error) {
            console.error('Error calculating multiple TWAPs:', error);
            throw error;
        }
    }


    /**
     * Calculate TWAP over a specified time window
     * @param {number} secondsAgo Time window in seconds
     * @returns {Promise<number>} The time-weighted average price
     */
    public async getTwap(secondsAgo: number): Promise<number> {
        try {
            // Make sure secondsAgo is an integer
            secondsAgo = Math.floor(secondsAgo);

            if (secondsAgo <= 0) {
                throw new Error('secondsAgo must be positive');
            }

            // Ensure decimals are initialized
            if (this.token0Decimals === undefined || this.token1Decimals === undefined) {
                await this.initialize(); // Initialize if not already done
            }

            // Call observe to get the cumulative ticks at the current time (0) and secondsAgo
            const observations: { tickCumulative: bigint; secondsPerLiquidityCumulativeX128: bigint; }[] =
                await this.poolContract.observe([0, secondsAgo]);

            const currentTickCumulative: bigint = observations[0].tickCumulative;
            const pastTickCumulative: bigint = observations[1].tickCumulative;

            // Calculate the difference in cumulative ticks
            const tickCumulativesDelta: bigint = currentTickCumulative - pastTickCumulative;

            // Calculate the arithmetic mean tick
            // Convert delta to number for division if safe, or use BigInt division if available/needed
            const tickDeltaNumber = Number(tickCumulativesDelta); // Potential precision loss
            const arithmeticMeanTick = tickDeltaNumber / secondsAgo;

            // Convert to price using the tickToPrice helper
            const price = this.tickToPrice(Math.floor(arithmeticMeanTick));

            console.log(`TWAP over ${secondsAgo} seconds: ${price}`);
            return price;
        } catch (error: any) {
            console.error('Error calculating TWAP:', error);
            throw error;
        }
    }

    /**
     * Converts a tick value to a price (token1/token0)
     * @param {number} tick The tick value
     * @returns {number} The price (token1/token0)
     */
    private tickToPrice(tick: number): number {
        // Price = 1.0001^tick
        const price = Math.pow(1.0001, tick);

        // Adjust for decimals
        // Ensure decimals are numbers before using in Math.pow
        const token0Decimals = this.token0Decimals !== undefined ? this.token0Decimals : 18; // Default if not initialized
        const token1Decimals = this.token1Decimals !== undefined ? this.token1Decimals : 18; // Default if not initialized

        const adjustedPrice = price * Math.pow(10, token0Decimals - token1Decimals);

        return adjustedPrice;
    }

    /**
     * Converts a sqrtPriceX96 value to a price (token1/token0)
     * @param {bigint} sqrtPriceX96 The sqrt price as a Q64.96 BigInt
     * @returns {number} The price (token1/token0)
     */
    private sqrtPriceX96ToPrice(sqrtPriceX96: bigint): number {
        // Ensure decimals are initialized
        if (this.token0Decimals === undefined || this.token1Decimals === undefined) {
            // This method is called from getCurrentPrice which initializes, but good practice to check
            // In a real scenario, you might throw an error or initialize here if needed.
            console.warn("Decimals not initialized when converting sqrtPriceX96 to price.");
            // Fallback to default decimals if not initialized
        }

        // Convert sqrtPriceX96 (UQ112.112) to price (token1 / token0)
        // Price = (sqrtPriceX96 / 2^96)^2
        // Using BigInt for accurate division before converting to Number
        const priceX96 = (sqrtPriceX96 * sqrtPriceX96) / (2n ** 192n); // (2^96)^2 = 2^192

        // Convert the price (which is now in a UQ format relative to token decimals) to a standard number
        // Need to account for the 1e18 scaling factor often used in Solidity for fixed-point math
        // And the token decimals difference.
        // The raw price from tick/sqrtPrice is P = (token1_units / token0_units) * (10^decimals0 / 10^decimals1)
        // We want price in standard units, so we divide by 10^(decimals0 - decimals1)
        // The priceX96 is P * 2^192.
        // So P = priceX96 / 2^192.
        // To get the price in standard units: P_standard = P * (10^decimals0 / 10^decimals1)
        // P_standard = (priceX96 / 2^192) * (10^decimals0 / 10^decimals1)

        // A simpler way based on common implementations:
        // The price from sqrtPriceX96 directly relates to the price in terms of token units.
        // P = (sqrt(price) * 2^96)^2 / (2^96)^2 = price
        // The price returned by the pool is token1 per token0.
        // To get the price in terms of standard units (e.g., USD per ETH), you need to account for decimals.
        // Price (in standard units) = Raw Price * (10^decimals0 / 10^decimals1)
        // Raw Price = (sqrtPriceX96 / 2^96)^2

        const Q96 = 2n ** 96n;
        const priceRaw = Number(sqrtPriceX96) / Number(Q96); // Convert to number for Math.pow
        const price = Math.pow(priceRaw, 2);

        // Adjust for decimals
        const token0Decimals = this.token0Decimals !== undefined ? this.token0Decimals : 18;
        const token1Decimals = this.token1Decimals !== undefined ? this.token1Decimals : 18;
        console.log(price, token0Decimals, token1Decimals)
        const adjustedPrice = price * Math.pow(10, token0Decimals - token1Decimals);

        console.log(adjustedPrice)
        return adjustedPrice;
    }
}

export { UniswapV3TwapOracle, type CurrentPriceResult, type MultipleTimeWindowTwapsResult };

import { ethers } from 'ethers'; // Assuming ethers is still used for potential interactions or types

// Define interfaces for the expected structure of the TWAP oracle dependency
interface IUniswapV3TwapOracle {
    getCurrentPrice(): Promise<{ price: number }>; // Assuming it returns an object with a 'price' property
    getTwap(seconds: number): Promise<number>;
    getMultipleTimeWindowTwaps(timeWindows: number[]): Promise<{ [key: number]: number }>;
}

// Define interfaces for the data structures used and returned by the analyzer
interface PriceData {
    current: number;
    twaps: { [key: number]: number };
    hourlyPrices: number[];
}

interface VolatilityMetrics {
    hourlyVolatility: number;
    dailyVolatility: number;
    annualizedVolatility: number;
    twapVolatility: number;
    shortTermVolatility: number;
}

interface Returns {
    raw: { [key: number]: number };
    annualized: { [key: number]: number };
}

interface ImpermanentLossRisk {
    potentialImpermanentLoss: { [key: number]: number };
    probabilityOfSignificantMove: number;
    riskLevel: string;
}

interface RebalancingRecommendation {
    daysInterval: number;
    description: string;
}

interface PositionSizingRecommendation {
    maxPositionPct: number;
    description: string;
}

interface LiquidityGuidance {
    impermanentLossRisk: ImpermanentLossRisk;
    rebalancingFrequency: RebalancingRecommendation;
    positionSizing: PositionSizingRecommendation;
    recommendation: string;
}

interface FeeStructure {
    volatilityBand: string | null;
    annualizedVolatility: number;
    managementFee: number;
    performanceFee: number;
    swapFee: number;
    optimalTickRange: {
        lowerPriceMultiplier: number;
        upperPriceMultiplier: number;
        lowerTick: number;
        upperTick: number;
        tickSpread: number;
    };
    explanation: string;
}

interface BenchmarkComparison {
    benchmarkSharpe: number;
    relativeDifference: number;
    betterThan: boolean;
}

interface BenchmarkResults {
    expectedSharpe: number;
    sharpeCategory: string;
    benchmarkComparisons: { [key: string]: BenchmarkComparison };
}

interface AnalysisResults {
    priceData: PriceData;
    volatilityMetrics: VolatilityMetrics;
    returns: Returns;
    sharpeRatios: { [key: number | string]: number }; // Sharpe ratios can have number or string keys ('expected')
    feeStructure: FeeStructure;
    liquidityGuidance: LiquidityGuidance;
    benchmark: BenchmarkResults;
}


/**
 * SharpeAndFeeAnalyzer - A class that analyzes TWAP data to provide:
 * 1. Expected Sharpe ratio benchmarks
 * 2. Recommended fee structures based on volatility
 * 3. Immediate feedback on expected performance
 */
class SharpeAndFeeAnalyzer {
    private twapOracle: IUniswapV3TwapOracle;
    private riskFreeRate: number;
    private annualizationFactor: number;
    private lookbackPeriods: number[]; // Days for historical analysis - Note: not used in current implementation
    private volBands: {
        [key: string]: { max: number; minFee: number; maxFee: number };
    };

    constructor(twapOracle: IUniswapV3TwapOracle) {
        this.twapOracle = twapOracle;
        this.riskFreeRate = 0.03; // Assumed 3% annual risk-free rate, can be adjusted
        this.annualizationFactor = Math.sqrt(365); // For daily returns to annual
        this.lookbackPeriods = [1, 7, 30, 90]; // Days for historical analysis - Note: not used in current implementation
        this.volBands = {
            veryLow: { max: 0.10, minFee: 0.0010, maxFee: 0.0020 }, // 10% vol
            low: { max: 0.20, minFee: 0.0020, maxFee: 0.0040 },     // 20% vol
            medium: { max: 0.40, minFee: 0.0040, maxFee: 0.0075 },  // 40% vol
            high: { max: 0.60, minFee: 0.0075, maxFee: 0.0125 },    // 60% vol
            veryHigh: { max: Infinity, minFee: 0.0125, maxFee: 0.0250 } // >60% vol
        };
    }

    /**
     * Calculate multiple metrics in one call to provide immediate feedback
     * @returns {Promise<AnalysisResults>} Comprehensive analysis results
     */
    public async analyzeAsset(): Promise<AnalysisResults> {
        try {
            // Get price data for various time windows
            const priceData: PriceData = await this.getPriceDataForAnalysis();

            // Calculate volatility metrics
            const volatilityMetrics: VolatilityMetrics = this.calculateVolatilityMetrics(priceData);

            // Calculate returns
            const returns: Returns = this.calculateReturns(priceData);

            // Calculate Sharpe ratios for different time periods
            const sharpeRatios: { [key: number | string]: number } = this.calculateSharpeRatios(returns, volatilityMetrics);

            // Determine appropriate fee structure
            const feeStructure: FeeStructure = this.determineFeeStructure(volatilityMetrics);

            // Provide trading liquidity guidance
            const liquidityGuidance: LiquidityGuidance = this.provideLiquidityGuidance(volatilityMetrics);

            // Benchmark against other assets
            const benchmark: BenchmarkResults = this.benchmarkPerformance(sharpeRatios);

            return {
                priceData,
                volatilityMetrics,
                returns,
                sharpeRatios,
                feeStructure,
                liquidityGuidance,
                benchmark
            };
        } catch (error: any) {
            console.error('Error in asset analysis:', error);
            throw error;
        }
    }

    /**
     * Get price data for different time periods
     * @returns {Promise<PriceData>} Price data for analysis
     */
    private async getPriceDataForAnalysis(): Promise<PriceData> {
        try {
            // Get current price
            const current = await this.twapOracle.getCurrentPrice();

            // Collect historical TWAPs at various intervals
            const timeWindows = [
                5 * 60,           // 5 minutes
                15 * 60,          // 15 minutes
                60 * 60,          // 1 hour
                4 * 60 * 60,      // 4 hours
                24 * 60 * 60,     // 1 day
                7 * 24 * 60 * 60, // 1 week
            ];

            const twaps = await this.twapOracle.getMultipleTimeWindowTwaps(timeWindows);

            // Get hourly prices for the last 24 hours (if available)
            const hourlyPrices: number[] = [];
            for (let i = 1; i <= 24; i++) {
                try {
                    const hourlyTwap = await this.twapOracle.getTwap(i * 60 * 60);
                    hourlyPrices.push(hourlyTwap);
                } catch (e: any) {
                    // Some pools might not have enough history
                    console.warn(`Could not get hourly TWAP for hour ${i}:`, e);
                    break; // Stop if we hit a period with no data
                }
            }

            return {
                current: current.price,
                twaps,
                hourlyPrices
            };
        } catch (error: any) {
            console.error('Error getting price data:', error);
            throw error;
        }
    }

    /**
     * Calculate volatility metrics from price data
     * @param {PriceData} priceData Price data object
     * @returns {VolatilityMetrics} Volatility metrics
     */
    private calculateVolatilityMetrics(priceData: PriceData): VolatilityMetrics {
        // Calculate price volatility for different timeframes
        const hourlyReturns = this.calculateHourlyReturns(priceData.hourlyPrices);

        // Daily volatility (from hourly returns)
        const hourlyVolatility = this.calculateStandardDeviation(hourlyReturns);
        const dailyVolatility = hourlyVolatility * Math.sqrt(24); // Scale hourly to daily

        // Annualized volatility
        const annualizedVolatility = dailyVolatility * this.annualizationFactor;

        // Calculate historical volatility from TWAPs
        // Note: This calculation method from TWAPs might not be statistically rigorous
        // for volatility across different time windows compared to using daily returns.
        // Consider using daily price points or daily returns for more standard volatility calculation.
        const twapKeys = Object.keys(priceData.twaps).map(Number).sort((a, b) => a - b);
        const twapReturns: number[] = [];

        for (let i = 1; i < twapKeys.length; i++) {
            const prev = priceData.twaps[twapKeys[i - 1]];
            const curr = priceData.twaps[twapKeys[i]];
            if (prev !== 0) { // Avoid division by zero
                 twapReturns.push((curr - prev) / prev);
            }
        }

        const twapVolatility = this.calculateStandardDeviation(twapReturns);

        // Calculate short-term volatility (for fee adjustment)
        // Assuming short term is 6 hours, scaling hourly vol
        const shortTermVolatility = hourlyVolatility * Math.sqrt(6);

        return {
            hourlyVolatility,
            dailyVolatility,
            annualizedVolatility,
            twapVolatility, // Consider if this is the best representation of historical volatility
            shortTermVolatility
        };
    }

    /**
     * Calculate hourly returns from hourly prices
     * @param {number[]} hourlyPrices Array of hourly prices
     * @returns {number[]} Hourly returns
     */
    private calculateHourlyReturns(hourlyPrices: number[]): number[] {
        if (hourlyPrices.length <= 1) {
            return [];
        }

        const returns: number[] = [];
        for (let i = 1; i < hourlyPrices.length; i++) {
            if (hourlyPrices[i - 1] !== 0) { // Avoid division by zero
                returns.push((hourlyPrices[i] - hourlyPrices[i - 1]) / hourlyPrices[i - 1]);
            }
        }

        return returns;
    }

    /**
     * Calculate returns over various timeframes
     * @param {PriceData} priceData Price data object
     * @returns {Returns} Returns for different timeframes
     */
    private calculateReturns(priceData: PriceData): Returns {
        const current = priceData.current;
        const rawReturns: { [key: number]: number } = {};

        // Calculate returns for each TWAP timeframe
        for (const secondsStr in priceData.twaps) {
            if (Object.prototype.hasOwnProperty.call(priceData.twaps, secondsStr)) {
                const seconds = Number(secondsStr);
                const price = priceData.twaps[seconds];
                 if (price !== 0) { // Avoid division by zero
                    rawReturns[seconds] = (current - price) / price;
                 } else {
                     rawReturns[seconds] = 0; // Or handle as an error/infinity
                 }
            }
        }

        const annualizedReturns: { [key: number]: number } = {};
        for (const secondsStr in rawReturns) {
             if (Object.prototype.hasOwnProperty.call(rawReturns, secondsStr)) {
                 const seconds = Number(secondsStr);
                 const returnValue = rawReturns[seconds];

                 // Convert seconds to years for annualization
                 const yearFraction = seconds / (365 * 24 * 60 * 60);

                 // Only annualize if we have a meaningful time period and valid return
                 if (yearFraction > 0 && returnValue !== -1) { // Avoid division by zero and log(0) issues
                     // Annualize using compound return formula
                     // Ensure 1 + returnValue is positive for Math.pow
                     if (1 + returnValue > 0) {
                         annualizedReturns[seconds] = Math.pow(1 + returnValue, 1 / yearFraction) - 1;
                     } else {
                          annualizedReturns[seconds] = -1; // Indicate invalid annualization
                     }
                 } else {
                      annualizedReturns[seconds] = returnValue; // Cannot annualize, keep raw return
                 }
             }
        }

        return {
            raw: rawReturns,
            annualized: annualizedReturns
        };
    }

    /**
     * Calculate Sharpe ratios for different time periods
     * @param {Returns} returns Returns object
     * @param {VolatilityMetrics} volatilityMetrics Volatility metrics
     * @returns {{ [key: number | string]: number }} Sharpe ratios
     */
    private calculateSharpeRatios(returns: Returns, volatilityMetrics: VolatilityMetrics): { [key: number | string]: number } {
        const sharpeRatios: { [key: number | string]: number } = {};

        // Use annualized returns and annualized volatility for standard Sharpe calculation
        const annualizedVol = volatilityMetrics.annualizedVolatility;

        for (const secondsStr in returns.annualized) {
             if (Object.prototype.hasOwnProperty.call(returns.annualized, secondsStr)) {
                 const seconds = Number(secondsStr);
                 const annualizedReturn = returns.annualized[seconds];

                  // Ensure annualizedReturn is valid and annualizedVol is positive for calculation
                 if (annualizedReturn !== -1 && annualizedVol > 0) {
                     // Calculate excess return (over risk-free rate)
                     const excessReturn = annualizedReturn - this.riskFreeRate;
                     const sharpe = excessReturn / annualizedVol;
                     sharpeRatios[seconds] = sharpe;
                 } else {
                     sharpeRatios[seconds] = 0; // Cannot calculate Sharpe
                 }
             }
        }


        // Add expected Sharpe based on all available data
        const weightedSharpe = this.calculateWeightedSharpe(sharpeRatios);
        sharpeRatios.expected = weightedSharpe; // Use a string key for the expected value

        return sharpeRatios;
    }

    /**
     * Calculate weighted Sharpe ratio (giving more weight to longer timeframes)
     * @param {{ [key: number | string]: number }} sharpeRatios Sharpe ratios for different timeframes
     * @returns {number} Weighted Sharpe ratio
     */
    private calculateWeightedSharpe(sharpeRatios: { [key: number | string]: number }): number {
        const entries = Object.entries(sharpeRatios)
            .filter(([key]) => !isNaN(Number(key))) // Filter out non-numeric keys like 'expected'
            .map(([seconds, sharpe]) => ({ seconds: Number(seconds), sharpe: sharpe as number }))
            .sort((a, b) => a.seconds - b.seconds);

        if (entries.length === 0) {
            return 0;
        }

        let totalWeight = 0;
        let weightedSum = 0;

        for (const { seconds, sharpe } of entries) {
            // Weight is proportional to square root of time period (in seconds)
            // Only include valid Sharpe ratios in the weighted calculation
            if (!isNaN(sharpe) && isFinite(sharpe)) {
                 const weight = Math.sqrt(seconds);
                 weightedSum += sharpe * weight;
                 totalWeight += weight;
            }
        }

        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }

    /**
     * Determine appropriate fee structure based on volatility
     * @param {VolatilityMetrics} volatilityMetrics Volatility metrics
     * @returns {FeeStructure} Recommended fee structure
     */
    private determineFeeStructure(volatilityMetrics: VolatilityMetrics): FeeStructure {
        const { annualizedVolatility, shortTermVolatility } = volatilityMetrics;

        // Determine volatility band
        let volBandKey: string | null = null;
        for (const bandKey in this.volBands) {
             if (Object.prototype.hasOwnProperty.call(this.volBands, bandKey)) {
                 const band = this.volBands[bandKey];
                 if (annualizedVolatility <= band.max) {
                     volBandKey = bandKey;
                     break;
                 }
             }
        }

        // Default to 'veryHigh' if no band is matched (shouldn't happen with Infinity max)
        const selectedVolBand = volBandKey ? this.volBands[volBandKey] : this.volBands.veryHigh;
        const actualVolBandKey = volBandKey || 'veryHigh';


        // Get fee range based on volatility band
        const { minFee, maxFee } = selectedVolBand;

        // Calculate management fee (base fee) - often at the lower end of the range
        const baseFee = minFee;

        // Calculate performance fee (varies with short-term volatility)
        // Higher short-term volatility = higher performance fee
        // Normalize short-term volatility relative to a reasonable range (e.g., 0 to 0.1 annualized)
        const normalizedShortTermVol = Math.min(Math.max(shortTermVolatility, 0), 0.1) / 0.1;
        const performanceFee = minFee + normalizedShortTermVol * (maxFee - minFee);

        // Calculate swap fee for DEX liquidity provision
        // Higher volatility = higher swap fee
        const swapFee = this.calculateOptimalSwapFee(annualizedVolatility);

        // Calculate optimal liquidity concentration range
        const optimalTickRange = this.calculateOptimalTickRange(annualizedVolatility);

        return {
            volatilityBand: actualVolBandKey,
            annualizedVolatility: annualizedVolatility,
            managementFee: baseFee,
            performanceFee: performanceFee,
            swapFee: swapFee,
            optimalTickRange: optimalTickRange,
            explanation: this.generateFeeExplanation(actualVolBandKey, baseFee, performanceFee, swapFee)
        };
    }

    /**
     * Calculate optimal swap fee based on volatility
     * @param {number} volatility Annualized volatility
     * @returns {number} Optimal swap fee
     */
    private calculateOptimalSwapFee(volatility: number): number {
        // Basic formula: higher volatility = higher swap fee
        if (volatility <= 0.10) return 0.0005; // 0.05% for very low volatility
        if (volatility <= 0.20) return 0.0010; // 0.1% for low volatility
        if (volatility <= 0.40) return 0.0030; // 0.3% for medium volatility
        if (volatility <= 0.60) return 0.0050; // 0.5% for high volatility
        return 0.0100; // 1% for very high volatility
    }

    /**
     * Calculate optimal tick range for concentrated liquidity
     * @param {number} volatility Annualized volatility
     * @returns {{ lowerPriceMultiplier: number; upperPriceMultiplier: number; lowerTick: number; upperTick: number; tickSpread: number; }} Optimal tick range info
     */
    private calculateOptimalTickRange(volatility: number): { lowerPriceMultiplier: number; upperPriceMultiplier: number; lowerTick: number; upperTick: number; tickSpread: number; } {
        // Convert annualized volatility to daily
        const dailyVol = volatility / this.annualizationFactor;

        // Calculate price range based on 2 standard deviations (approx 95% confidence interval for a normal distribution)
        // This is a simplification for crypto markets which are often not normally distributed.
        // Using exp(sigma * sqrt(T)) for price change multiplier
        const priceRangeMultiplier = Math.exp(2 * dailyVol); // For a one-day move
        const upperBound = priceRangeMultiplier;
        const lowerBound = 1 / priceRangeMultiplier;

        // Calculate tick values (Uniswap ticks are in ln(1.0001) increments for a base price of 1)
        // The actual tick calculation depends on the current price and the token order (token0/token1)
        // This is a simplified calculation based on price multipliers relative to the current price.
        // Need to consider the base price (P = token1 / token0) and tick spacing for the specific pool fee tier.
        const tickSpacing = 60; // Common tick spacing for 0.3% pools (adjust based on fee tier)
        const logBase = Math.log(1.0001);

        // Calculate ticks relative to a price of 1
        const lowerTickRelative = Math.log(lowerBound) / logBase;
        const upperTickRelative = Math.log(upperBound) / logBase;

        // Quantize to the nearest tick spacing
        const lowerTick = Math.floor(lowerTickRelative / tickSpacing) * tickSpacing;
        const upperTick = Math.ceil(upperTickRelative / tickSpacing) * tickSpacing;


        return {
            lowerPriceMultiplier: lowerBound,
            upperPriceMultiplier: upperBound,
            lowerTick: lowerTick, // These are relative ticks, need current price to get absolute ticks
            upperTick: upperTick, // These are relative ticks, need current price to get absolute ticks
            tickSpread: upperTick - lowerTick
        };
    }

    /**
     * Generate explanation for fee structure
     * @param {string | null} volBand Volatility band key
     * @param {number} baseFee Base fee
     * @param {number} performanceFee Performance fee
     * @param {number} swapFee Swap fee
     * @returns {string} Explanation
     */
    private generateFeeExplanation(volBand: string | null, baseFee: number, performanceFee: number, swapFee: number): string {
        const volatilityDescription: { [key: string]: string } = {
            veryLow: "very low",
            low: "low",
            medium: "moderate",
            high: "high",
            veryHigh: "very high"
        };
        const description = volBand ? volatilityDescription[volBand] : "unknown";

        return `Based on ${description} volatility, a management fee of ${(baseFee * 100).toFixed(2)}%
        with a performance fee of ${(performanceFee * 100).toFixed(2)}% is recommended.
        For liquidity provision, a swap fee of ${(swapFee * 100).toFixed(2)}% is optimal
        to balance fee revenue against impermanent loss risk.`;
    }

    /**
     * Provide guidance on liquidity provision
     * @param {VolatilityMetrics} volatilityMetrics Volatility metrics
     * @returns {LiquidityGuidance} Liquidity guidance
     */
    private provideLiquidityGuidance(volatilityMetrics: VolatilityMetrics): LiquidityGuidance {
        const { annualizedVolatility, dailyVolatility } = volatilityMetrics;

        // Calculate impermanent loss risk
        const ilRisk: ImpermanentLossRisk = this.calculateImpermanentLossRisk(annualizedVolatility);

        // Calculate rebalancing frequency recommendation
        const rebalancingFrequency: RebalancingRecommendation = this.calculateRebalancingFrequency(dailyVolatility);

        // Calculate position size recommendation
        const positionSizing: PositionSizingRecommendation = this.calculatePositionSizing(annualizedVolatility);

        return {
            impermanentLossRisk: ilRisk,
            rebalancingFrequency,
            positionSizing,
            recommendation: this.generateLiquidityRecommendation(
                ilRisk, rebalancingFrequency, positionSizing
            )
        };
    }

    /**
     * Calculate impermanent loss risk
     * @param {number} annualizedVolatility Annualized volatility
     * @returns {ImpermanentLossRisk} Impermanent loss risk metrics
     */
    private calculateImpermanentLossRisk(annualizedVolatility: number): ImpermanentLossRisk {
        // Calculate expected IL for different price movements
        const priceChanges = [0.05, 0.10, 0.25, 0.5, 1.0]; // 5%, 10%, 25%, 50%, 100%
        const ilResults: { [key: number]: number } = {};

        for (const change of priceChanges) {
            // Formula: IL = 2*sqrt(k) / (1+k) - 1, where k is the price ratio
            // k = 1 + change (for price increase) or 1 / (1 + change) (for price decrease)
            // Impermanent loss is symmetric for price increases and decreases of the same magnitude
            const priceRatio = 1 + change;
            const il = 2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1;
            ilResults[change] = Math.abs(il); // IL is typically expressed as a positive value
        }

        // Calculate probability of significant price movement based on volatility
        // Using annualized volatility for a 1-year probability
        const prob50PercentMove = this.calculateProbabilityOfMove(annualizedVolatility, 0.5);

        return {
            potentialImpermanentLoss: ilResults,
            probabilityOfSignificantMove: prob50PercentMove,
            riskLevel: this.categorizeILRisk(annualizedVolatility)
        };
    }

    /**
     * Calculate probability of a price move of given magnitude
     * @param {number} volatility Annualized volatility
     * @param {number} moveSize Size of move as a fraction (e.g., 0.5 for 50%)
     * @returns {number} Probability of such a move in a year (assuming log-normal distribution)
     */
    private calculateProbabilityOfMove(volatility: number, moveSize: number): number {
        // Using properties of the log-normal distribution for asset prices
        // The log return ln(P_t / P_0) is assumed to be normally distributed with mean (mu - sigma^2/2)*t and std dev sigma*sqrt(t)
        // For a move of size `moveSize`, the price ratio is 1 + `moveSize`.
        // We want the probability that P_t / P_0 >= 1 + moveSize or P_t / P_0 <= 1 / (1 + moveSize)
        // This requires estimating the expected return (mu), which is hard.
        // A simplification is to calculate the probability of a log return >= ln(1+moveSize) or <= ln(1/(1+moveSize))
        // using a normal distribution with mean 0 and std dev = volatility (for t=1 year).
        // This is a rough approximation.

        if (volatility <= 0 || moveSize <= 0) return 0; // Cannot calculate probability with zero or negative volatility/move

        const logMoveSize = Math.log(1 + moveSize);

        // Calculate z-score for the positive move
        const zScorePositive = logMoveSize / volatility;
        // Calculate z-score for the negative move (price goes down by moveSize)
        const zScoreNegative = Math.log(1 / (1 + moveSize)) / volatility; // This will be negative

        // Use the cumulative distribution function (CDF) of the standard normal distribution
        // Probability of a move >= logMoveSize is 1 - CDF(zScorePositive)
        // Probability of a move <= logMoveSize (negative) is CDF(zScoreNegative)
        // Total probability is (1 - CDF(zScorePositive)) + CDF(zScoreNegative)

        // Implementing a simple approximation of the standard normal CDF (e.g., using the error function)
        // CDF(x) ≈ 0.5 * (1 + erf(x / sqrt(2)))
        const standardNormalCDF = (x: number): number => {
             // Approximation of the error function erf(x)
             const erf = (x: number): number => {
                 // constants
                 const a1 = 0.254829592;
                 const a2 = -0.284496736;
                 const a3 = 1.421413741;
                 const a4 = -1.453152027;
                 const a5 = 1.061405429;
                 const p = 0.3275911;

                 // Save the sign of x
                 const sign = x < 0 ? -1 : 1;
                 x = Math.abs(x);

                 // A&S formula 7.1.26
                 const t = 1.0 / (1.0 + p * x);
                 const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

                 return sign * y;
             };
             return 0.5 * (1 + erf(x / Math.sqrt(2)));
        };

        const probPositiveMove = 1 - standardNormalCDF(zScorePositive);
        const probNegativeMove = standardNormalCDF(zScoreNegative);

        // Total probability of a move of magnitude >= moveSize in either direction
        const totalProbability = probPositiveMove + probNegativeMove;

        return totalProbability;
    }


    /**
     * Categorize impermanent loss risk
     * @param {number} volatility Annualized volatility
     * @returns {string} Risk category
     */
    private categorizeILRisk(volatility: number): string {
        if (volatility <= 0.15) return "Very Low";
        if (volatility <= 0.30) return "Low";
        if (volatility <= 0.50) return "Moderate";
        if (volatility <= 0.75) return "High";
        return "Very High";
    }

    /**
     * Calculate recommended rebalancing frequency
     * @param {number} dailyVolatility Daily volatility
     * @returns {RebalancingRecommendation} Rebalancing recommendation
     */
    private calculateRebalancingFrequency(dailyVolatility: number): RebalancingRecommendation {
        // Higher volatility = more frequent rebalancing
        let daysInterval: number;
        let description: string;

        if (dailyVolatility >= 0.05) { // 5% daily vol or more
            daysInterval = 1;
            description = "Daily";
        } else if (dailyVolatility >= 0.03) { // 3% daily vol or more
            daysInterval = 3;
            description = "Every 3 days";
        } else if (dailyVolatility >= 0.02) { // 2% daily vol or more
            daysInterval = 7;
            description = "Weekly";
        } else if (dailyVolatility >= 0.01) { // 1% daily vol or more
            daysInterval = 14;
            description = "Bi-weekly";
        } else { // Less than 1% daily vol
            daysInterval = 30;
            description = "Monthly";
        }

        return { daysInterval, description };
    }

    /**
     * Calculate position sizing recommendation
     * @param {number} volatility Annualized volatility
     * @returns {PositionSizingRecommendation} Position sizing recommendation
     */
    private calculatePositionSizing(volatility: number): PositionSizingRecommendation {
        // Higher volatility = smaller recommended maximum position size as a percentage of total portfolio
        let maxPositionPct: number;
        let description: string;

        if (volatility >= 0.75) { // 75% annualized vol or more
            maxPositionPct = 0.05;
            description = "Very Small (5% max)";
        } else if (volatility >= 0.50) { // 50% annualized vol or more
            maxPositionPct = 0.10;
            description = "Small (10% max)";
        } else if (volatility >= 0.30) { // 30% annualized vol or more
            maxPositionPct = 0.15;
            description = "Moderate (15% max)";
        } else if (volatility >= 0.15) { // 15% annualized vol or more
            maxPositionPct = 0.25;
            description = "Standard (25% max)";
        } else { // Less than 15% annualized vol
            maxPositionPct = 0.40;
            description = "Large (40% max)";
        }

        return { maxPositionPct, description };
    }

    /**
     * Generate liquidity provision recommendation
     * @param {ImpermanentLossRisk} ilRisk Impermanent loss risk
     * @param {RebalancingRecommendation} rebalancing Rebalancing recommendation
     * @param {PositionSizingRecommendation} positionSizing Position sizing recommendation
     * @returns {string} Recommendation
     */
    private generateLiquidityRecommendation(ilRisk: ImpermanentLossRisk, rebalancing: RebalancingRecommendation, positionSizing: PositionSizingRecommendation): string {
        return `This asset has ${ilRisk.riskLevel.toLowerCase()} impermanent loss risk.
        Recommended maximum position size is ${positionSizing.description.toLowerCase()},
        with ${rebalancing.description.toLowerCase()} rebalancing of your position.`;
    }

    /**
     * Benchmark performance against common assets
     * @param {{ [key: number | string]: number }} sharpeRatios Calculated Sharpe ratios
     * @returns {BenchmarkResults} Benchmark comparison
     */
    private benchmarkPerformance(sharpeRatios: { [key: number | string]: number }): BenchmarkResults {
        const expectedSharpe = sharpeRatios.expected !== undefined ? sharpeRatios.expected : 0; // Use 0 if expected is not calculated

        // Common benchmark Sharpe ratios (approximate historical values)
        const benchmarks: { [key: string]: number } = {
            "S&P 500": 0.4,
            "US Bonds": 0.2,
            "Gold": 0.3,
            "Bitcoin": 1.0,
            "Ethereum": 0.8,
            "60/40 Portfolio": 0.35
        };

        // Compare against benchmarks
        const comparisons: { [key: string]: BenchmarkComparison } = {};
        for (const name in benchmarks) {
             if (Object.prototype.hasOwnProperty.call(benchmarks, name)) {
                 const benchmarkSharpe = benchmarks[name];
                 const relativeDifference = benchmarkSharpe !== 0 ? (expectedSharpe - benchmarkSharpe) / benchmarkSharpe : Infinity; // Handle division by zero
                 const betterThan = expectedSharpe > benchmarkSharpe;

                 comparisons[name] = {
                     benchmarkSharpe: benchmarkSharpe,
                     relativeDifference: relativeDifference,
                     betterThan: betterThan
                 };
             }
        }

        // Categorize the asset's Sharpe ratio
        let sharpeCategory: string;
        if (expectedSharpe <= 0) sharpeCategory = "Poor";
        else if (expectedSharpe <= 0.3) sharpeCategory = "Below Average";
        else if (expectedSharpe <= 0.6) sharpeCategory = "Average";
        else if (expectedSharpe <= 1.0) sharpeCategory = "Good";
        else if (expectedSharpe <= 1.5) sharpeCategory = "Very Good";
        else sharpeCategory = "Excellent";

        return {
            expectedSharpe,
            sharpeCategory,
            benchmarkComparisons: comparisons
        };
    }

    /**
     * Utility function to calculate standard deviation
     * @param {number[]} array Array of values
     * @returns {number} Standard deviation
     */
    private calculateStandardDeviation(array: number[]): number {
        if (array.length <= 1) return 0;

        const mean = array.reduce((sum, val) => sum + val, 0) / array.length;
        // Use n-1 for sample standard deviation (more common in statistics)
        const variance = array.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (array.length - 1);

        // Ensure variance is non-negative before taking sqrt
        return Math.sqrt(Math.max(0, variance));
    }
}

/**
 * Example usage function to demonstrate the analyzer
 * @param {IUniswapV3TwapOracle} twapOracle Instance of UniswapV3TwapOracle (or compatible interface)
 * @returns {Promise<AnalysisResults>} Analysis results
 */
async function analyzeSharpeAndFees(twapOracle: IUniswapV3TwapOracle): Promise<AnalysisResults> {
    try {
        // Create analyzer with TWAP oracle
        const analyzer = new SharpeAndFeeAnalyzer(twapOracle);

        // Run full analysis
        const analysis = await analyzer.analyzeAsset();

        // Log key results
        console.log('=== Asset Analysis Results ===');
        console.log(`Annualized Volatility: ${(analysis.volatilityMetrics.annualizedVolatility * 100).toFixed(2)}%`);
        console.log(`Expected Sharpe Ratio: ${analysis.sharpeRatios.expected.toFixed(2)} (${analysis.benchmark.sharpeCategory})`);
        console.log(`Recommended Management Fee: ${(analysis.feeStructure.managementFee * 100).toFixed(2)}%`);
        console.log(`Recommended Performance Fee: ${(analysis.feeStructure.performanceFee * 100).toFixed(2)}%`);
        console.log(`Optimal Swap Fee: ${(analysis.feeStructure.swapFee * 100).toFixed(2)}%`);
        console.log(`Impermanent Loss Risk: ${analysis.liquidityGuidance.impermanentLossRisk.riskLevel}`);
        console.log(`Rebalancing Frequency: ${analysis.liquidityGuidance.rebalancingFrequency.description}`);

        // Return full results for further processing
        return analysis;
    } catch (error: any) {
        console.error('Error analyzing Sharpe and fees:', error);
        throw error;
    }
}

export { SharpeAndFeeAnalyzer, analyzeSharpeAndFees, type IUniswapV3TwapOracle, type AnalysisResults,type FeeStructure, type LiquidityGuidance, type BenchmarkResults };

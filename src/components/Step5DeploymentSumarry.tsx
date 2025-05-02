
import { useFormContext } from 'react-hook-form';
import StepController from './Controller'; // Assuming your controller component is in './Controller'
import type { FarmFormValues } from '@/utils/types';



function Step5DeploymentSummary() {
    // Access form state and methods from the context provider
    const { register, watch, formState: { errors } } = useFormContext<FarmFormValues>();

    // Watch all form values to display them in the summary
    const formValues = watch();

    // Helper function to render a section title and its fields
    const renderSection = (title: string, fields: Array<{ key: keyof FarmFormValues, label: string, format?: (value: any) => string }>) => (
        <div className="mb-6">
            <h3 className="text-[var(--primary)] text-lg font-semibold mb-3">{title}</h3>
            <div className="space-y-2">
                {fields.map(({ key, label, format }) => {
                    const value = formValues[key];
                    // Handle potential undefined or null values gracefully
                    const displayValue = value !== undefined && value !== null
                        ? (format ? format(value) : (typeof value === 'object' ? JSON.stringify(value) : String(value)))
                        : 'Not set';

                    return (
                        <div key={key} className="flex justify-between border-b border-[var(--primary)]/10 pb-2">
                            <span className="text-[var(--primary)]/70">{label}:</span>
                            <span className="text-[var(--primary)] font-medium">{displayValue}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className='text-[var(--primary)]/80 border-1 text-sm space-y-6 border-[var(--primary)]/20 rounded-3xl p-6'>
            <div>
                <p className="text-[var(--primary)] text-xl font-bold">Deployment Summary</p>
                <p className="text-[var(--primary)]/70 mt-1">Review all your settings before deploying the Farm.</p>
            </div>

            {/* Render each section using the helper function */}
            {renderSection("Farm Configuration", [
                { key: 'farmName', label: 'Farm Name' },
                { key: 'asset', label: 'Principal Asset' },
                { key: 'strategyType', label: 'Strategy Type', format: (value: string) => value.charAt(0).toUpperCase() + value.slice(1) }, // Capitalize type
                { key: 'verifierIncentiveSplit', label: 'Verifiers Split (%)', format: (value: number) => `${value}%` },
                { key: 'yieldYodaIncentiveSplit', label: 'Yield Yodas Split (%)', format: (value: number) => `${value}%` },
                // LP split is implicitly 100 - verifier - yoda, or you can add it if stored separately
                { key: 'lpIncentiveSplit', label: 'LPs Split (%)', format: (value: number) => `${value}%` },
            ])}

            {renderSection("Strategy Parameters", [
                { key: 'targetAPY', label: 'Target APY (%)', format: (value: number) => `${value}%` },
                { key: 'maturityDays', label: 'Maturity Period (days)', format: (value: number) => `${value} days` },
                // Displaying collateralAssets array might need a more complex format function depending on desired output
                { key: 'collateralAssets', label: 'Collateral Assets', format: (assets: FarmFormValues['collateralAssets']) =>
                    assets && assets.length > 0 ? assets.map(a => `${a.address} (${a.allocation}%)`).join(', ') : 'None specified'
                },
                { key: 'maxDrawdown', label: 'Max Drawdown Tolerance (%)', format: (value: number) => `${value}%` },
                { key: 'volatilityThreshold', label: 'Volatility Threshold', format: (value: number | undefined) => value !== undefined ? String(value) : 'Not set' },
            ])}

            {renderSection("Verifier Requirements", [
                { key: 'minVerifierStake', label: 'Min Verifier Stake (DXP)', format: (value: number) => `${value} DXP` },
                { key: 'stakeLockupDays', label: 'Stake Lockup Period (days)', format: (value: number) => `${value} days` },
                { key: 'minVerifierScore', label: 'Min Verifier Score' },
                { key: 'requiredExperience', label: 'Required Experience', format: (exp: string[] | undefined) => exp && exp.length > 0 ? exp.join(', ') : 'None specified' },
            ])}

            {renderSection("Fee Structure", [
                { key: 'performanceFee', label: 'Performance Fee (%)', format: (value: number) => `${value}%` },
                { key: 'managementFee', label: 'Management Fee (%)', format: (value: number) => `${value}%` },
                { key: 'feeRecipient', label: 'Fee Recipient Address' },
                { key: 'feeDistribution', label: 'Fee Distribution', format: (value: string) => value.charAt(0).toUpperCase() + value.slice(1) }, // Capitalize type
            ])}

            {/* Add the Claim Token and Farm Owner fields */}
             {renderSection("Deployment Details", [
                { key: 'claimTokenName', label: 'Claim Token Name' },
                { key: 'claimTokenSymbol', label: 'Claim Token Symbol' },
                { key: 'farmOwner', label: 'Farm Owner Address' },
             ])}


            {/* Terms Acceptance */}
            <div className="flex items-center mt-6">
                <input
                    id="termsAccepted"
                    type="checkbox"
                    {...register('termsAccepted', {
                        required: 'You must accept the terms to proceed',
                    })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="termsAccepted" className="ml-2 block text-sm text-[var(--primary)]/80">
                    I have reviewed and accept the terms and conditions.
                </label>
            </div>
            {errors.termsAccepted && (
                <span className="text-red-500 text-xs">{errors.termsAccepted.message as string}</span>
            )}

            {/* Navigation Buttons */}
            <StepController />
        </div>
    );
}

export default Step5DeploymentSummary;

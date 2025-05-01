import { useFormContext } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import StepController from './Controller';
// import { fetchUniswapPrice } from '../api/uniswap';


function Step2FarmConfig() {
    const { register, watch, formState: { errors } } = useFormContext();
    const asset = watch('asset');

    const { data: assetPrice } = useQuery(
        {
            queryKey: ["uniswap-asset"],
            queryFn: () => 4,

        }
    );
    return (
        <div className=' text-white/80 border-1 text-sm space-y-4 border-white/20 rounded-3xl p-6'>
            <div>
                <p className=" text-white">Set Strategy Parameters</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block mb-2">Target APY (%)</label>
                    <input
                        type="number"
                        step="0.1"
                        {...register('targetAPY', {
                            required: 'Required',
                            min: { value: 0.1, message: 'Minimum 0.1%' },
                            max: { value: 100, message: 'Maximum 100%' }
                        })}
                        className="w-full p-2 py-4 bg-white/15 rounded-xl"
                    />
                    {errors.targetAPY && (
                        <span className="text-red-500">{errors.targetAPY.message as string}</span>
                    )}
                </div>
                <div>
                    <label className="block mb-2">Maturity Period (days)</label>
                    <input
                        type="number"
                        {...register('maturityDays', {
                            required: 'Required',
                            min: { value: 7, message: 'Minimum 7 days' }
                        })}
                        className="w-full p-2 py-4 bg-white/15 rounded-xl"
                    />
                </div>
            </div>
            <div>
                <label className="block mb-2">Collateral Assets</label>
                <div className=" ">
                    {assetPrice && (
                        <p className="text-sm text-gray-600">
                            Current price: {assetPrice} USD
                        </p>
                    )}
                    {/* Asset selection component would go here */}
                </div>
            </div>
            <div>
                <label className="block mb-2">Max Drawdown Tolerance (%)</label>
                <input
                    type="number"
                    step="0.1"
                    {...register('maxDrawdown', {
                        required: 'Required',
                        min: { value: 0, message: 'Minimum 0%' },
                        max: { value: 100, message: 'Maximum 100%' }
                    })}
                    className="w-full p-2 py-4 bg-white/15 rounded-xl"
                />
            </div>
            <StepController />
        </div>
    )
}



export default Step2FarmConfig

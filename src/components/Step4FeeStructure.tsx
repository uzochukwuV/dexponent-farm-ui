import { useFormContext } from "react-hook-form";
import StepController from "./Controller";


export function Step4FeeStructure() {
    const { register, watch } = useFormContext();
    const performanceFee = watch('performanceFee') || 0;
    const managementFee = watch('managementFee') || 0;

    return (
        <div className=' text-white/80 border-1 text-sm space-y-4 border-white/20 rounded-3xl p-6'>
            <div>
                <p className=" text-white">Set Fee Structure</p>
            </div>
            <div>
                <label className="block mb-2">Performance Fee ({performanceFee}%)</label>
                <input
                    type="range"
                    min="0"
                    max="30"
                    step="0.1"
                    {...register('performanceFee')}
                    className="w-full p-2 py-4 l"
                />
                <p className="text-sm text-gray-600">
                    Charged on profits above target APY
                </p>
            </div>
            <div>
                <label className="block mb-2">Management Fee ({managementFee}%)</label>
                <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    {...register('managementFee')}
                    className="w-full"
                />
                <p className="text-sm text-gray-600">
                    Annual fee charged on total assets
                </p>
            </div>
            <div>
                <label className="block mb-2">Fee Recipient Address</label>
                <input
                    {...register('feeRecipient', {
                        required: 'Required',
                        pattern: {
                            value: /^0x[a-fA-F0-9]{40}$/,
                            message: 'Invalid Ethereum address'
                        }
                    })}
                    className="w-full p-2 py-4 bg-white/15 rounded-xl"
                    placeholder="0x..."
                />
            </div>
            <StepController />
        </div>
    )
}
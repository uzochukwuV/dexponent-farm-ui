import { useFormContext } from "react-hook-form";
import StepController from "./Controller";


export function Step3VerifierSettings() {
    const { register } = useFormContext();

    return (
        <div className=' text-white/80 border-1 text-sm space-y-4 border-white/20 rounded-3xl p-6'>
            <div>
                <p className=" text-white">Set Verifier Settings</p>
            </div>
            <div>
                <label className="block mb-2">Minimum Verifier Stake (DXP)</label>
                <input
                    type="number"
                    {...register('minVerifierStake', {
                        required: 'Required',
                        min: { value: 100, message: 'Minimum 100 DXP' }
                    })}
                    className="w-full p-2 py-4 bg-white/15 rounded-xl"
                />
            </div>
            <div>
                <label className="block mb-2">Stake Lockup Period (days)</label>
                <input
                    type="number"
                    {...register('stakeLockupDays', {
                        required: 'Required',
                        min: { value: 1, message: 'Minimum 1 day' }
                    })}
                    className="w-full p-2 py-4 bg-white/15 rounded-xl"
                />
            </div>
            <div>
                <label className="block mb-2">Minimum Verifier Score</label>
                <input
                    type="number"
                    {...register('minVerifierScore', {
                        required: 'Required',
                        min: { value: 1, message: 'Minimum score 1' },
                        max: { value: 10, message: 'Maximum score 10' }
                    })}
                    className="w-full p-2 py-4 bg-white/15 rounded-xl"
                />
            </div>
            <StepController />
        </div>
    )
}
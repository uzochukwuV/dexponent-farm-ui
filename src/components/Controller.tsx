import { useStepStore } from '@/context/StepContext';

function StepController() {
    const { step, next, prev, } = useStepStore();
    return (
        <div>
            <div className=" flex  justify-between">
                {
                    step > 1 ? <button onClick={() => prev()} type="button" className=" px-6 py-2 bg-white rounded-xl text-black font-semibold">Previous</button> : <div></div>
                }
                {
                    step < 5 ? <button onClick={() => next()} type="button" className=" px-6 py-2 bg-white rounded-xl text-black font-semibold">Next</button> : <div></div>
                }
                {
                    step == 5 && <button onClick={() => next()} type="button" className=" px-6 py-2 bg-white rounded-xl text-black font-semibold">Deploy</button>
                }
            </div>
        </div>
    )
}

export default StepController
import { Link } from '@tanstack/react-router'
import { ConnectButton } from './connectButton'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 py-4   flex  text-white justify-center items-center ">
      <nav className="flex flex-row justify-between items-center px-6 h-12 bg-white/5 backdrop-blur-2xl w-full max-w-[760px] rounded-3xl">
        <div className="px-2 font-bold">
          <Link to="/">Home</Link>
        </div>

        <div className="px-2 font-bold">
          <ConnectButton />
        </div>
      </nav>
    </header>
  )
}

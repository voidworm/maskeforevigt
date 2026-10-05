import { useRef } from 'react'
import Confetti from './Confetti.jsx'

export default function App() {
  const confettiRef = useRef(null)

  return (
    <>
      <Confetti ref={confettiRef} />
      <button className="party-button" onClick={() => confettiRef.current.fire()}>
        Celebrate
      </button>
    </>
  )
}

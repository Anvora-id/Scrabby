import MenuBar from './shell/MenuBar.tsx'
import StepBar from './shell/StepBar.tsx'
import Steps from './shell/Steps.tsx'
import Onboarding from './shell/Onboarding.tsx'
import { askStore, greetingStore } from './onboarding.ts'
import styles from './App.module.css'

export default function App() {
  // Behind the greeting or a warning, nothing can be reached: Tab stays in the card.
  const blocked = greetingStore.use() || askStore.use() !== null
  return (
    <>
      <div className={styles.app} inert={blocked}>
        <MenuBar />
        <StepBar />
        <main className={styles.page}>
          <Steps />
        </main>
      </div>
      <Onboarding />
    </>
  )
}

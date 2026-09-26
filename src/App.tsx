import MenuBar from './shell/MenuBar.tsx'
import StepBar from './shell/StepBar.tsx'
import Steps from './shell/Steps.tsx'
import Onboarding from './shell/Onboarding.tsx'
import styles from './App.module.css'

export default function App() {
  return (
    <div className={styles.app}>
      <MenuBar />
      <StepBar />
      <main className={styles.page}>
        <Steps />
      </main>
      <Onboarding />
    </div>
  )
}

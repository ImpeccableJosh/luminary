import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import TeacherScene from './scenes/TeacherScene'
import TopicsScene from './scenes/TopicsScene'
import NotesScene from './scenes/NotesScene'

const scene = new URLSearchParams(window.location.search).get('scene')
const activeScene = scene ?? 'app'

document.documentElement.dataset.luminaryScene = activeScene
document.body.dataset.luminaryScene = activeScene

let root
if (scene === 'teacher') {
  root = <TeacherScene />
} else if (scene === 'topics') {
  root = <TopicsScene />
} else if (scene === 'notes') {
  root = <NotesScene />
} else {
  root = <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{root}</StrictMode>,
)

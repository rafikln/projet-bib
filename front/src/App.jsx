import { Link, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import Login from './pages/Login.jsx'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-100 text-slate-900">
      <header className="border-b border-white/60 bg-white/80 backdrop-blur">
       
      </header>
      <main className="">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

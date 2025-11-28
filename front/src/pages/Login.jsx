"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../services/api"

const demoAccounts = [
  {
    email: "biblio@universite.com",
    password: "biblio123",
    role: "Bibliothécaire",
  },
 
]

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!email || !password) return
    setError("")
    setLoading(true)

    try {
      const user = await api.login({ email, password })
      navigate("/dashboard", {
        state: {
          role: user.role,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
          },
        },
      })
    } catch (err) {
      setError(err.message || "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-8 rounded-3xl border border-gray-200 bg-white/95 p-10 shadow-xl shadow-gray-100">
      <header className="space-y-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-gray-500">Espace privé</p>
        <h1 className="text-3xl font-semibold text-gray-900">Connexion Bibliothèque</h1>
        <p className="text-base text-gray-600">Accédez à votre espace personnel et gérez vos emprunts de livres.</p>
      </header>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-5 rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-600">
          <p className="font-semibold text-gray-800">Comptes de démonstration :</p>
          <ul className="space-y-4">
            {demoAccounts.map((account, index) => (
              <li key={account.email} className="rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                  0{index + 1} · {account.role}
                </p>
                <p className="mt-2 text-gray-900">
                  <span className="font-semibold">Email :</span> {account.email}
                </p>
                <p className="text-gray-900">
                  <span className="font-semibold">Mot de passe :</span> {account.password}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <form className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-6" onSubmit={handleSubmit}>
          <label className="text-sm font-semibold text-gray-700" htmlFor="email">
            Adresse e-mail
          </label>
          <input
            id="email"
            type="email"
            placeholder="prenom.nom@universite.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-2xl border border-gray-200 px-4 py-3 text-base text-gray-800 transition focus:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100"
            autoComplete="email"
          />
          <label className="text-sm font-semibold text-gray-700" htmlFor="password">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-2xl border border-gray-200 px-4 py-3 text-base text-gray-800 transition focus:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100"
            autoComplete="current-password"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-2xl bg-gray-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
          <p className="text-center text-xs text-gray-500">
            Accès réservé aux membres de la bibliothèque universitaire.
          </p>
        </form>
      </div>
    </section>
  )
}

export default Login

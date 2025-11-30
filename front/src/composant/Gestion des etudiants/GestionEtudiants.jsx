"use client"

import { useEffect, useMemo, useState } from "react"
import { api } from "../../services/api"

const generatePassword = () => `etu-${Math.random().toString(36).slice(-6)}`
const emptyForm = { fullName: "", email: "", password: "" }

const toStudentView = (student) => ({
  id: student.id,
  displayId: `ETU-${String(student.id).padStart(3, "0")}`,
  fullName: student.full_name,
  email: student.email,
})

function GestionEtudiants({ role }) {
  const [students, setStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [generatedCredentials, setGeneratedCredentials] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    api
      .listUsers({ role: "etudiant" })
      .then((data) => {
        if (isMounted) {
          setStudents(data.map(toStudentView))
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Impossible de charger les étudiants.")
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students
    const query = searchTerm.toLowerCase()
    return students.filter(
      (student) =>
        student.displayId.toLowerCase().includes(query) ||
        student.fullName.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query),
    )
  }, [students, searchTerm])

  const handleDelete = async (id) => {
    try {
      await api.deleteUser(id)
      setStudents((prev) => prev.filter((student) => student.id !== id))
      if (generatedCredentials?.id === id) {
        setGeneratedCredentials(null)
      }
      if (editingId === id) {
        resetForm()
      }
    } catch (err) {
      setError(err.message || "Suppression impossible.")
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData(emptyForm)
  }

  const handleSelectForEdit = (student) => {
    setEditingId(student.id)
    setFormData({ fullName: student.fullName, email: student.email, password: "" })
    setGeneratedCredentials((prev) =>
      prev && prev.id === student.id ? prev : { id: student.id, email: student.email },
    )
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formData.fullName || !formData.email) return
    setIsSubmitting(true)
    setError("")
    const normalizedEmail = formData.email.toLowerCase()

    try {
      if (editingId) {
        const payload = {
          fullName: formData.fullName,
          email: normalizedEmail,
        }
        if (formData.password) {
          payload.password = formData.password
        }
        const updated = await api.updateUser(editingId, payload)
        setStudents((prev) =>
          prev.map((student) =>
            student.id === editingId ? toStudentView(updated) : student,
          ),
        )
      } else {
        const password = formData.password || generatePassword()
        const created = await api.createUser({
          fullName: formData.fullName,
          email: normalizedEmail,
          password,
          role: "etudiant",
        })
        setStudents((prev) => [...prev, toStudentView(created)])
        setGeneratedCredentials({ id: created.id, email: created.email, password })
      }

      resetForm()
    } catch (err) {
      setError(err.message || "Enregistrement impossible.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (role !== "bibliothecaire") {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Étudiants</p>
        <h2 className="mt-2 text-2xl font-bold text-gray-900">Consultation des étudiants</h2>
        <p className="mt-4 text-sm text-gray-600">
          Merci de contacter un bibliothécaire pour créer ou modifier des comptes étudiants.
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Étudiants</p>
            <h2 className="text-2xl font-bold text-gray-900">Gestion des étudiants</h2>
            <p className="text-sm text-gray-600">
              Ajoutez de nouveaux comptes et distribuez automatiquement leurs identifiants.
            </p>
          </div>
          <input
            type="search"
            placeholder="Rechercher un étudiant..."
            className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 transition focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 md:w-80"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <p className="px-6 py-8 text-center text-sm text-gray-500">Chargement des étudiants...</p>
        ) : (
          <table className="w-full table-auto text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-3 font-semibold">ID</th>
                <th className="px-6 py-3 font-semibold">Nom complet</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-t border-gray-100 text-gray-800">
                  <td className="px-6 py-4 font-semibold text-gray-900">{student.displayId}</td>
                  <td className="px-6 py-4">{student.fullName}</td>
                  <td className="px-6 py-4">{student.email}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleSelectForEdit(student)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredStudents.length && (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-sm text-gray-500">
                    Aucun étudiant ne correspond à cette recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            {editingId ? "Modifier un étudiant" : "Ajouter un étudiant"}
          </p>
          <p className="text-sm text-gray-600">
            {editingId
              ? "Mettez à jour les informations de l'étudiant sélectionné."
              : "Créez un nouveau compte étudiant. Un mot de passe sécurisé est généré automatiquement."}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase text-gray-500" htmlFor="student-name">
              Nom complet
            </label>
            <input
              id="student-name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Salma Khelifi"
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-800 transition focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-gray-500" htmlFor="student-email">
              Email universitaire
            </label>
            <input
              id="student-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="prenom.nom@universite.com"
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-800 transition focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold uppercase text-gray-500" htmlFor="student-password">
              Mot de passe {editingId ? "(laisser vide pour conserver)" : "(optionnel, généré sinon)"}
            </label>
            <input
              id="student-password"
              name="password"
              type="text"
              value={formData.password}
              onChange={handleChange}
              placeholder="etu-abc123"
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-800 transition focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            className="rounded-xl bg-gray-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!formData.fullName || !formData.email || isSubmitting}
          >
            {editingId ? "Mettre à jour" : "Créer le compte"}
          </button>
        </div>
        {generatedCredentials && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-700">
            <p className="font-semibold text-gray-900">Identifiants générés</p>
            <p>Email : {generatedCredentials.email}</p>
            {generatedCredentials.password && <p>Mot de passe : {generatedCredentials.password}</p>}
            <p className="text-xs text-gray-500">
              Communiquez ces informations à l'étudiant pour qu'il puisse se connecter.
            </p>
          </div>
        )}
      </form>
    </section>
  )
}

export default GestionEtudiants


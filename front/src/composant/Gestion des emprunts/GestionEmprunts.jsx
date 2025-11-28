import { useEffect, useMemo, useState } from "react"
import { api } from "../../services/api"

const statusStyles = {
  "En cours": "bg-amber-100 text-amber-800",
  Retourné: "bg-emerald-100 text-emerald-800",
  Retard: "bg-rose-100 text-rose-700",
}

function GestionEmprunts({ role, user, isStudentView }) {
  const [loans, setLoans] = useState([])
  const [studentOptions, setStudentOptions] = useState([])
  const [bookOptions, setBookOptions] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    studentId: "",
    bookId: "",
    startDate: "",
    endDate: "",
    status: "En cours",
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    Promise.all([api.listLoans(), api.listUsers({ role: "etudiant" }), api.listBooks()])
      .then(([loansData, studentsData, booksData]) => {
        if (!isMounted) return
        setLoans(
          loansData.map((loan) => ({
            id: loan.id,
            studentId: loan.utilisateur_id,
            studentName: loan.utilisateur_nom,
            studentEmail: loan.utilisateur_email,
            bookId: loan.livre_id,
            bookTitle: loan.livre_titre,
            startDate: loan.date_emprunt,
            endDate: loan.date_retour_prevue,
            status: loan.statut,
            returnedDate: loan.date_retour_effective,
          })),
        )
        setStudentOptions(
          studentsData.map((student) => ({
            id: student.id,
            fullName: student.full_name,
            email: student.email,
          })),
        )
        setBookOptions(
          booksData.map((book) => ({
            id: book.id,
            title: book.titre,
            status: book.statut,
          })),
        )
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Impossible de charger les emprunts.")
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const selectedStudent = studentOptions.find((student) => String(student.id) === formData.studentId)
  const selectedBook = bookOptions.find((book) => book.id === formData.bookId)
  const selectableBooks = editingId
    ? bookOptions
    : bookOptions.filter((book) => book.status === "Disponible")

  const filteredLoans = useMemo(() => {
    const baseList =
      isStudentView && user?.email ? loans.filter((loan) => loan.studentEmail === user.email) : loans

    if (!searchTerm.trim()) return baseList
    const query = searchTerm.toLowerCase()

    return baseList.filter((loan) => {
      const haystack = [
        loan.id,
        String(loan.studentId ?? ""),
        loan.studentName,
        loan.studentEmail,
        loan.bookId,
        loan.bookTitle,
        loan.status,
      ]
      return haystack.some((value) => value?.toLowerCase().includes(query))
    })
  }, [isStudentView, loans, searchTerm, user])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      studentId: "",
      bookId: "",
      startDate: "",
      endDate: "",
      status: "En cours",
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formData.studentId || !formData.bookId || !formData.startDate || !formData.endDate) return

    setIsSubmitting(true)
    setError("")

    try {
      const payloadBase = {
        dateRetourPrevue: formData.endDate,
        dateRetourEffective: formData.status === "Retourné" ? formData.endDate : null,
        statut: formData.status,
      }

      if (editingId) {
        const updated = await api.updateLoan(editingId, payloadBase)
        setLoans((prev) =>
          prev.map((loan) =>
            loan.id === editingId
              ? {
                  id: updated.id,
                  studentId: updated.utilisateur_id,
                  studentName: updated.utilisateur_nom,
                  studentEmail: updated.utilisateur_email,
                  bookId: updated.livre_id,
                  bookTitle: updated.livre_titre,
                  startDate: updated.date_emprunt,
                  endDate: updated.date_retour_prevue,
                  status: updated.statut,
                  returnedDate: updated.date_retour_effective,
                }
              : loan,
          ),
        )
      } else {
        const utilisateurId = Number(formData.studentId)
        const created = await api.createLoan({
          utilisateurId,
          livreId: formData.bookId,
          dateEmprunt: formData.startDate,
          dateRetourPrevue: formData.endDate,
          statut: formData.status,
        })
        setLoans((prev) => [
          ...prev,
          {
            id: created.id,
            studentId: created.utilisateur_id,
            studentName: created.utilisateur_nom,
            studentEmail: created.utilisateur_email,
            bookId: created.livre_id,
            bookTitle: created.livre_titre,
            startDate: created.date_emprunt,
            endDate: created.date_retour_prevue,
            status: created.statut,
            returnedDate: created.date_retour_effective,
          },
        ])
      }

      resetForm()
    } catch (err) {
      setError(err.message || "Enregistrement de l'emprunt impossible.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (loan) => {
    setEditingId(loan.id)
    setFormData({
      studentId: String(loan.studentId),
      bookId: loan.bookId,
      startDate: loan.startDate,
      endDate: loan.endDate,
      status: loan.status,
    })
  }

  const handleDelete = async (id) => {
    try {
      await api.deleteLoan(id)
      setLoans((prev) => prev.filter((loan) => loan.id !== id))
      if (editingId === id) {
        resetForm()
      }
    } catch (err) {
      setError(err.message || "Suppression impossible.")
    }
  }

  if (role !== "bibliothecaire" && !isStudentView) {
    return null
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              {isStudentView ? "Mes emprunts" : "Suivi des emprunts"}
            </p>
            <h2 className="text-2xl font-bold text-gray-900">
              {isStudentView ? "Historique personnel" : "Gestion des prêts"}
            </h2>
            <p className="text-sm text-gray-600">
              {isStudentView
                ? "Filtre tes emprunts par identifiant, livre ou statut."
                : "Recherche par étudiant, livre, statut ou identifiant d&apos;emprunt."}
            </p>
          </div>
          <input
            type="search"
            placeholder="Rechercher un emprunt..."
            className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 transition focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 md:w-80"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <p className="px-6 py-8 text-center text-sm text-gray-500">Chargement des emprunts...</p>
        ) : (
          <table className="w-full table-auto text-sm text-gray-800">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-5 py-3 text-left font-semibold">ID</th>
                <th className="px-5 py-3 text-left font-semibold">Étudiant</th>
                <th className="px-5 py-3 text-left font-semibold">Livre</th>
                <th className="px-5 py-3 text-left font-semibold">Date emprunt</th>
                <th className="px-5 py-3 text-left font-semibold">Date retour</th>
                <th className="px-5 py-3 text-left font-semibold">Statut</th>
                {role === "bibliothecaire" && <th className="px-5 py-3 text-right font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredLoans.map((loan) => (
                <tr key={loan.id} className="border-t border-gray-100">
                  <td className="px-5 py-4 font-semibold text-gray-900">{loan.id}</td>
                  <td className="px-5 py-4">
                    <p className="font-medium">{loan.studentName}</p>
                    <p className="text-xs text-gray-500">{loan.studentEmail}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium">{loan.bookTitle}</p>
                    <p className="text-xs text-gray-500">{loan.bookId}</p>
                  </td>
                  <td className="px-5 py-4">{loan.startDate}</td>
                  <td className="px-5 py-4">{loan.endDate}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        statusStyles[loan.status] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {loan.status}
                    </span>
                  </td>
                  {role === "bibliothecaire" && (
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(loan)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(loan.id)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {!filteredLoans.length && (
                <tr>
                  <td colSpan={role === "bibliothecaire" ? 7 : 6} className="px-5 py-6 text-center text-sm text-gray-500">
                    Aucun emprunt enregistré pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {role === "bibliothecaire" && (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              {editingId ? "Modifier un emprunt" : "Ajouter un emprunt"}
            </p>
            <p className="text-sm text-gray-600">Sélectionnez un étudiant, un livre, puis la période d'emprunt.</p>
          </div>

      <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500" htmlFor="student-select">
                Étudiant
              </label>
              <select
                id="student-select"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                disabled={Boolean(editingId)}
                className={`mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-800 transition focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 ${
                  editingId ? "cursor-not-allowed bg-gray-50" : ""
                }`}
              >
                <option value="">Choisir un étudiant...</option>
                {studentOptions.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName} ({student.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500" htmlFor="book-select">
                Livre
              </label>
              <select
                id="book-select"
                name="bookId"
                value={formData.bookId}
                onChange={handleChange}
                disabled={Boolean(editingId)}
                className={`mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-800 transition focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 ${
                  editingId ? "cursor-not-allowed bg-gray-50" : ""
                }`}
              >
                <option value="">Choisir un livre...</option>
                {selectableBooks.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title} ({book.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500" htmlFor="start-date">
                Date d'emprunt
              </label>
              <input
                id="start-date"
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                disabled={Boolean(editingId)}
                className={`mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-800 transition focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 ${
                  editingId ? "cursor-not-allowed bg-gray-50" : ""
                }`}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500" htmlFor="end-date">
                Date de retour prévue
              </label>
              <input
                id="end-date"
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-800 transition focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-gray-500" htmlFor="status">
                Statut
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-800 transition focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100"
              >
                <option value="En cours">En cours</option>
                <option value="Retourné">Retourné</option>
                <option value="Retard">Retard</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
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
              disabled={!formData.studentId || !formData.bookId || !formData.startDate || !formData.endDate || isSubmitting}
            >
              {editingId ? "Mettre à jour l'emprunt" : "Ajouter l'emprunt"}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

export default GestionEmprunts


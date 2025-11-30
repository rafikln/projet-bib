import { useEffect, useMemo, useState } from "react"
import { api } from "../../services/api"

const emptyForm = { id: "", title: "", category: "", status: "Disponible" }

function GestionLivres({ role }) {
  const isLibrarian = role === "bibliothecaire"
  const [books, setBooks] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    api
      .listBooks()
      .then((data) => {
        if (isMounted) {
          setBooks(
            data.map((book) => ({
              id: book.id,
              title: book.titre,
              category: book.categorie || "",
              status: book.statut,
            })),
          )
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Impossible de charger les livres.")
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const visibleBooks = useMemo(
    () => (isLibrarian ? books : books.filter((book) => book.status === "Disponible")),
    [books, isLibrarian],
  )

  const filteredBooks = useMemo(() => {
    if (!searchTerm.trim()) return visibleBooks
    const query = searchTerm.toLowerCase()
    return visibleBooks.filter(
      (book) =>
        book.id.toLowerCase().includes(query) ||
        book.title.toLowerCase().includes(query) ||
        book.category.toLowerCase().includes(query),
    )
  }, [visibleBooks, searchTerm])

  const handleDelete = async (id) => {
    try {
      await api.deleteBook(id)
      setBooks((prev) => prev.filter((book) => book.id !== id))
    } catch (err) {
      setError(err.message || "Suppression impossible.")
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmitBook = async (event) => {
    event.preventDefault()
    if (!formData.id || !formData.title || !formData.category) return
    setIsSubmitting(true)
    setError("")
    if (!formData.id || !formData.title || !formData.category) return
    try {
      if (editingId) {
        const payload = {
          titre: formData.title,
          categorie: formData.category,
          statut: formData.status,
        }
        const updated = await api.updateBook(editingId, payload)
        setBooks((prev) =>
          prev.map((book) =>
            book.id === editingId
              ? { id: updated.id, title: updated.titre, category: updated.categorie || "", status: updated.statut }
              : book,
          ),
        )
      } else {
        const created = await api.createBook({
          id: formData.id,
          titre: formData.title,
          categorie: formData.category,
          statut: formData.status,
        })
        setBooks((prev) => [
          ...prev,
          { id: created.id, title: created.titre, category: created.categorie || "", status: created.statut },
        ])
      }
      setFormData(emptyForm)
      setEditingId(null)
    } catch (err) {
      setError(err.message || "Enregistrement impossible.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectForEdit = (book) => {
    setEditingId(book.id)
    setFormData(book)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData(emptyForm)
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Catalogue
            </p>
            <h2 className="text-2xl font-bold text-gray-900">
              {isLibrarian ? "Gestion des livres" : "Livres disponibles"}
            </h2>
            <p className="text-sm text-gray-600">
              {isLibrarian
                ? "Recherchez, ajoutez et mettez à jour les ouvrages disponibles."
                : "Consultez ici tous les ouvrages disponibles à l'emprunt."}
            </p>
          </div>
          <input
            type="search"
            placeholder={isLibrarian ? "Rechercher un livre..." : "Rechercher un livre disponible..."}
            className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 transition focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 md:w-80"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <p className="px-6 py-8 text-center text-sm text-gray-500">Chargement des livres...</p>
        ) : (
        <table className="w-full table-auto text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-3 font-semibold">ID</th>
              <th className="px-6 py-3 font-semibold">Nom du livre</th>
              <th className="px-6 py-3 font-semibold">Catégorie</th>
              <th className="px-6 py-3 font-semibold">Disponibilité</th>
              {isLibrarian && <th className="px-6 py-3 font-semibold text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredBooks.map((book) => (
              <tr key={book.id} className="border-t border-gray-100 text-gray-800">
                <td className="px-6 py-4 font-semibold text-gray-900">{book.id}</td>
                <td className="px-6 py-4">{book.title}</td>
                <td className="px-6 py-4">{book.category}</td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      book.status === "Disponible"
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {book.status}
                  </span>
                </td>
                {isLibrarian && (
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleSelectForEdit(book)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(book.id)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {!filteredBooks.length && (
              <tr>
                <td colSpan={isLibrarian ? 5 : 4} className="px-6 py-6 text-center text-sm text-gray-500">
                  {isLibrarian ? "Aucun livre trouvé pour cette recherche." : "Aucun livre disponible ne correspond."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        )}
      </div>

      {isLibrarian && (
        <form onSubmit={handleSubmitBook} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            {editingId ? "Modifier un livre" : "Ajouter un livre"}
          </p>
          <p className="text-sm text-gray-600">
            {editingId
              ? "Mettez à jour les informations du livre sélectionné."
              : "Renseignez les informations minimales pour créer une nouvelle fiche."}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase text-gray-500" htmlFor="book-id">
              Identifiant
            </label>
            <input
              id="book-id"
              name="id"
              value={formData.id}
              onChange={handleChange}
              placeholder="LIV-005"
              disabled={Boolean(editingId)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-800 transition focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-gray-500" htmlFor="book-title">
              Nom du livre
            </label>
            <input
              id="book-title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Architecture des ordinateurs"
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-800 transition focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100"
            />
          </div>
          <div>
            <label
              className="text-xs font-semibold uppercase text-gray-500"
              htmlFor="book-category"
            >
              Catégorie
            </label>
            <input
              id="book-category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="Informatique"
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-800 transition focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-gray-500" htmlFor="book-status">
              Disponibilité
            </label>
            <select
              id="book-status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-800 transition focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100"
            >
              <option value="Disponible">Disponible</option>
              <option value="Emprunté">Emprunté</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-xl border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            className="rounded-xl bg-gray-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!formData.id || !formData.title || !formData.category || isSubmitting}
          >
            {editingId ? "Mettre à jour le livre" : "Ajouter le livre"}
          </button>
        </div>
      </form>
      )}
    </section>
  )
}

export default GestionLivres


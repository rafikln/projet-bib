import { useEffect, useState } from "react"
import { Link, Navigate, useLocation } from "react-router-dom"
import { api } from "../services/api"
import GestionLivres from "../composant/Gestion des livres/GestionLivres.jsx"
import GestionEtudiants from "../composant/Gestion des etudiants/GestionEtudiants.jsx"
import GestionEmprunts from "../composant/Gestion des emprunts/GestionEmprunts.jsx"

const menuConfig = {
  bibliothecaire: [
    { id: 1, label: "Accueil", path: "/dashboard" },
    { id: 2, label: "Gestion des livres", path: "/dashboard/livres" },
    { id: 3, label: "Gestion des étudiants", path: "/dashboard/etudiants" },
    { id: 4, label: "Gestion des emprunts", path: "/dashboard/emprunts" },
  ],
  etudiant: [
    { id: 1, label: "Accueil", path: "/dashboard" },
    { id: 2, label: "Consulter les livres", path: "/dashboard/livres" },
    { id: 3, label: "Mes emprunts", path: "/dashboard/mes-emprunts" },
  ],
}

function Dashboard() {
  const location = useLocation()
  const userRole = location.state?.role
  const user = location.state?.user
  const [stats, setStats] = useState({
    books: 0,
    availableBooks: 0,
    students: 0,
    activeLoans: 0,
    myLoans: 0,
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState("")

  if (!userRole) {
    return <Navigate to="/login" replace />
  }

  const menuItems = menuConfig[userRole] || []
  const currentPath = location.pathname
  const isLivresView = currentPath.startsWith("/dashboard/livres")
  const isEtudiantsView = currentPath.startsWith("/dashboard/etudiants")
  const isEmpruntsView =
    currentPath.startsWith("/dashboard/emprunts") || currentPath.startsWith("/dashboard/mes-emprunts")
  const isStudentView = userRole === "etudiant"

  useEffect(() => {
    let isMounted = true
    const fetchStats = async () => {
      setStatsLoading(true)
      try {
        const [booksData, loansData, studentsData] = await Promise.all([
          api.listBooks(),
          api.listLoans(),
          userRole === "bibliothecaire" ? api.listUsers({ role: "etudiant" }) : Promise.resolve([]),
        ])

        const availableBooks = booksData.filter((book) => book.statut === "Disponible").length
        const activeLoans = loansData.filter((loan) => loan.statut !== "Retourné").length
        const myLoans =
          isStudentView && user?.email
            ? loansData.filter((loan) => loan.utilisateur_email === user.email).length
            : 0

        if (isMounted) {
          setStats({
            books: booksData.length,
            availableBooks,
            students: studentsData.length,
            activeLoans,
            myLoans,
          })
          setStatsError("")
        }
      } catch (error) {
        if (isMounted) {
          setStatsError(error.message || "Impossible de charger les statistiques.")
        }
      } finally {
        if (isMounted) {
          setStatsLoading(false)
        }
      }
    }

    fetchStats()
    return () => {
      isMounted = false
    }
  }, [isStudentView, user?.email, userRole])

  const renderDefaultCards = () => (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Livres</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {statsLoading ? "..." : stats.books}
            </p>
          </div>
          <div className="rounded-full bg-blue-100 p-3" />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">
              {isStudentView ? "Livres disponibles" : "Étudiants inscrits"}
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {statsLoading
                ? "..."
                : isStudentView
                ? stats.availableBooks
                : stats.students}
            </p>
          </div>
          <div className="rounded-full bg-green-100 p-3" />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">
              {isStudentView ? "Mes emprunts" : "Emprunts en cours"}
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {statsLoading
                ? "..."
                : isStudentView
                ? stats.myLoans
                : stats.activeLoans}
            </p>
          </div>
          <div className="rounded-full bg-orange-100 p-3" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-[calc(100vh-120px)]">
      <aside className="w-64 border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Bibliothèque
          </h2>
          <p className="text-sm font-medium text-gray-700">
            {user?.fullName || user?.email || "Utilisateur connecté"}
          </p>
          <p className="text-xs uppercase text-gray-500">{userRole}</p>
        </div>

        <nav className="p-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = currentPath === item.path

              return (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    state={{ role: userRole, user }}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="absolute bottom-0 w-64 border-t border-gray-200 p-3">
          <Link
            to="/login"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-red-50 hover:text-red-600"
          >
            <span>Déconnexion</span>
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-gradient-to-br from-sky-50 via-white to-slate-100 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {isLivresView
                ? "Gestion des livres"
                : isEtudiantsView
                ? "Gestion des étudiants"
                : isEmpruntsView
                ? userRole === "bibliothecaire"
                  ? "Gestion des emprunts"
                  : "Mes emprunts"
                : userRole === "bibliothecaire"
                ? "Tableau de bord Bibliothécaire"
                : "Mon espace Étudiant"}
            </h1>
            <p className="mt-2 text-gray-600">
              {isLivresView
                ? "Ajoutez, modifiez et suivez les ouvrages de la bibliothèque."
                : isEtudiantsView
                ? "Créez des comptes étudiants et diffusez leurs identifiants."
                : isEmpruntsView
                ? "Attribuez les prêts, suivez les retours et changez le statut en un clic."
                : "Bienvenue sur votre espace de gestion de bibliothèque"}
            </p>
          </div>
          {statsError && (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {statsError}
            </p>
          )}

          {isLivresView ? (
            <GestionLivres role={userRole} />
          ) : isEtudiantsView ? (
            <GestionEtudiants role={userRole} />
          ) : isEmpruntsView ? (
            <GestionEmprunts
              role={userRole}
              user={user}
              isStudentView={currentPath.startsWith("/dashboard/mes-emprunts")}
            />
          ) : (
            renderDefaultCards()
          )}
        </div>
      </main>
    </div>
  )
}

export default Dashboard


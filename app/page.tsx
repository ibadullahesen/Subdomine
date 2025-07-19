"use client"

import { useState, useEffect } from "react"
import { auth, db } from "./firebase"
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "firebase/auth"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  setDoc,
  updateDoc,
  writeBatch, // Import writeBatch for atomic updates
} from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  Users,
  Building2,
  UserPlus,
  LogOut,
  Phone,
  MessageCircle,
  Trash2,
  Wrench,
  Home,
  AlertCircle,
  Plus,
  CheckCircle,
  Clock,
  Briefcase,
  Edit,
  ArrowRightLeft,
  X,
  Calendar,
  User,
} from "lucide-react"

interface UserType {
  id: string
  email: string
  role: "admin" | "company" | "worker"
  name: string
  surname?: string
  phone?: string
  workerId?: string
  companyName?: string
  currentCompany?: string
  assignedDate?: Date
}

interface Job {
  id: string
  title: string
  description: string
  companyId: string
  companyName: string
  workerId: string
  workerName: string
  stages: Stage[]
  createdAt: Date
  status: "active" | "completed"
}

interface Stage {
  id: string
  name: string // Will be the same as description for simplicity
  description: string
  completed: boolean
  completedAt?: Date
  order: number
}

export default function UstalarMMC() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState("home")
  const [loginType, setLoginType] = useState<"admin" | "company" | "worker">("admin")
  const [loginId, setLoginId] = useState("")
  const [password, setPassword] = useState("")
  const [firebaseError, setFirebaseError] = useState<string | null>(null)

  // Data states
  const [workers, setWorkers] = useState<UserType[]>([])
  const [companies, setCompanies] = useState<UserType[]>([])
  const [jobs, setJobs] = useState<Job[]>([])

  // Form states
  const [newWorker, setNewWorker] = useState({ workerId: "", name: "", surname: "", phone: "" })
  const [newCompany, setNewCompany] = useState({ name: "", email: "", password: "" })
  // Updated newJob state to include stages
  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
    companyId: "",
    workerId: "",
    stages: [] as Omit<Stage, "id">[],
  })
  // Local state for adding stages within the "Add Job" dialog
  const [currentNewJobStageText, setCurrentNewJobStageText] = useState("")

  // For managing stages in "Manage Stages" dialog
  const [newStageText, setNewStageText] = useState("")

  // Dialog states
  const [showAddWorker, setShowAddWorker] = useState(false)
  const [showAddCompany, setShowAddCompany] = useState(false)
  const [showAddJob, setShowAddJob] = useState(false)
  const [showTransferWorker, setShowTransferWorker] = useState(false)
  const [showManageStages, setShowManageStages] = useState(false)

  // Selected items for dialogs
  const [selectedWorker, setSelectedWorker] = useState<UserType | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [transferToCompany, setTransferToCompany] = useState("")

  // Firebase connection check
  useEffect(() => {
    if (!auth || !db) {
      setFirebaseError("Firebase bağlantısı qurulmadı")
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setCurrentUser(null)
          setLoading(false)
          return
        }

        console.log("User authenticated:", user.email)
        await new Promise((resolve) => setTimeout(resolve, 1000))

        let firestoreUser: UserType | null = null

        try {
          const userDocRef = doc(db, "users", user.uid)
          const snap = await getDoc(userDocRef)

          if (snap.exists()) {
            firestoreUser = { id: user.uid, ...snap.data() } as UserType
            console.log("User data loaded from Firestore:", firestoreUser)
          } else {
            // Fallback for users authenticated but not in Firestore (e.g., newly created company users)
            const userData = {
              email: user.email || "",
              name: user.email?.split("@")[0] || "İstifadəçi",
              role: user.email === "admin@ustalarmmc.az" ? "admin" : "company", // Default to company if not admin
              createdAt: new Date(),
            }

            // If it's a company email, try to find existing company data by email
            const companyQuery = query(collection(db, "users"), where("email", "==", user.email))
            const companySnapshot = await getDocs(companyQuery)

            if (!companySnapshot.empty) {
              const existingCompanyData = companySnapshot.docs[0].data() as UserType
              firestoreUser = { id: user.uid, ...existingCompanyData }
              await setDoc(userDocRef, firestoreUser) // Link auth UID to existing company data
              console.log("Linked existing company data to new auth user:", firestoreUser)
            } else {
              // If no existing company data, create a new one
              await setDoc(userDocRef, userData)
              firestoreUser = { id: user.uid, ...userData } as UserType
              console.log("Created new user document for authenticated user:", firestoreUser)
            }
          }
        } catch (firestoreError: any) {
          console.error("Firestore error during user data fetch/create:", firestoreError)
          // Fallback for Firestore access issues (e.g., rules preventing read)
          firestoreUser = {
            id: user.uid,
            email: user.email || "",
            name: user.email?.split("@")[0] || "İstifadəçi",
            role: user.email === "admin@ustalarmmc.az" ? "admin" : "worker", // Default to worker if Firestore fails
          } as UserType
          console.log("Using fallback user data due to Firestore error:", firestoreUser)
        }

        setCurrentUser(firestoreUser)
      } catch (error) {
        console.error("Auth state change error:", error)
        setFirebaseError("İstifadəçi məlumatları yüklənərkən xəta baş verdi")
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  // Setup real-time listeners
  useEffect(() => {
    if (!currentUser || !db) return

    console.log("Setting up real-time listeners for user:", currentUser.role)

    const setupListeners = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000))

        if (currentUser.role === "admin") {
          const workersQuery = query(collection(db, "users"), where("role", "==", "worker"))
          const companiesQuery = query(collection(db, "users"), where("role", "==", "company"))

          const unsubWorkers = onSnapshot(
            workersQuery,
            (snapshot) => {
              const workersData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as UserType[]
              setWorkers(workersData)
              console.log("Workers data updated:", workersData.length)
            },
            (error) => {
              console.error("Workers listener error:", error)
            },
          )

          const unsubCompanies = onSnapshot(
            companiesQuery,
            (snapshot) => {
              const companiesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as UserType[]
              setCompanies(companiesData)
              console.log("Companies data updated:", companiesData.length)
            },
            (error) => {
              console.error("Companies listener error:", error)
            },
          )

          const unsubJobs = onSnapshot(
            collection(db, "jobs"), // Admin sees all jobs
            (snapshot) => {
              const jobsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
              })) as Job[]
              setJobs(jobsData)
              console.log("Jobs data updated:", jobsData.length)
            },
            (error) => {
              console.error("Jobs listener error:", error)
            },
          )

          return () => {
            unsubWorkers()
            unsubCompanies()
            unsubJobs()
          }
        } else if (currentUser.role === "worker") {
          const workerJobsQuery = query(collection(db, "jobs"), where("workerId", "==", currentUser.id))

          const unsubWorkerJobs = onSnapshot(
            workerJobsQuery,
            (snapshot) => {
              const jobsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
              })) as Job[]
              setJobs(jobsData)
              console.log("Worker jobs updated:", jobsData.length)
            },
            (error) => {
              console.error("Worker jobs listener error:", error)
            },
          )

          return () => {
            unsubWorkerJobs()
          }
        } else if (currentUser.role === "company") {
          // Company needs to see jobs they created AND jobs assigned to their workers
          const jobsByCompanyQuery = query(collection(db, "jobs"), where("companyId", "==", currentUser.id))
          const workersOfCompanyQuery = query(
            collection(db, "users"),
            where("role", "==", "worker"),
            where("currentCompany", "==", currentUser.companyName),
          )

          let jobsCreatedByCompany: Job[] = []
          let jobsAssignedToCompanyWorkers: Job[] = []

          const unsubJobsByCompany = onSnapshot(
            jobsByCompanyQuery,
            (snapshot) => {
              jobsCreatedByCompany = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
              })) as Job[]
              const combinedJobs = [...jobsCreatedByCompany, ...jobsAssignedToCompanyWorkers]
              setJobs(Array.from(new Map(combinedJobs.map((item) => [item["id"], item])).values())) // Remove duplicates
              console.log("Company's own jobs updated:", jobsCreatedByCompany.length)
            },
            (error) => {
              console.error("Company's own jobs listener error:", error)
            },
          )

          const unsubWorkersOfCompany = onSnapshot(
            workersOfCompanyQuery,
            async (workerSnapshot) => {
              const companyWorkers = workerSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as UserType[]
              const workerIds = companyWorkers.map((w) => w.id)

              if (workerIds.length > 0) {
                // Firestore 'in' query limit is 10. If more than 10 workers, this needs batching or client-side filtering.
                // For simplicity, assuming max 10 workers for 'in' query.
                // For larger scale, consider fetching all jobs and filtering client-side or multiple batched queries.
                const jobsByWorkerQuery = query(collection(db, "jobs"), where("workerId", "in", workerIds))
                const unsubJobsByWorker = onSnapshot(
                  jobsByWorkerQuery,
                  (snapshot) => {
                    jobsAssignedToCompanyWorkers = snapshot.docs.map((doc) => ({
                      id: doc.id,
                      ...doc.data(),
                      createdAt: doc.data().createdAt?.toDate(),
                    })) as Job[]
                    const combinedJobs = [...jobsCreatedByCompany, ...jobsAssignedToCompanyWorkers]
                    setJobs(Array.from(new Map(combinedJobs.map((item) => [item["id"], item])).values())) // Remove duplicates
                    console.log("Jobs assigned to company workers updated:", jobsAssignedToCompanyWorkers.length)
                  },
                  (error) => {
                    console.error("Jobs by worker listener error:", error)
                  },
                )
                return unsubJobsByWorker // Return this unsubscribe function
              } else {
                jobsAssignedToCompanyWorkers = []
                const combinedJobs = [...jobsCreatedByCompany, ...jobsAssignedToCompanyWorkers]
                setJobs(Array.from(new Map(combinedJobs.map((item) => [item["id"], item])).values())) // Remove duplicates
              }
            },
            (error) => {
              console.error("Company workers listener error:", error)
            },
          )

          return () => {
            unsubJobsByCompany()
            unsubWorkersOfCompany()
          }
        }
      } catch (error) {
        console.error("Listeners setup error:", error)
      }
    }

    const cleanup = setupListeners()
    return () => {
      if (cleanup instanceof Promise) {
        cleanup.then((fn) => fn && fn())
      }
    }
  }, [currentUser])

  const handleLogin = async () => {
    if (!auth || !db) {
      toast({ title: "Xəta", description: "Firebase bağlantısı yoxdur!", variant: "destructive" })
      return
    }

    try {
      setLoading(true)
      setFirebaseError(null)

      if (loginType === "worker") {
        try {
          const workersQuery = query(collection(db, "users"), where("workerId", "==", loginId))
          const workerSnapshot = await getDocs(workersQuery)

          if (!workerSnapshot.empty) {
            const workerDoc = workerSnapshot.docs[0]
            const workerData = workerDoc.data() as UserType

            setCurrentUser({ id: workerDoc.id, ...workerData })
            toast({ title: "Uğurlu giriş", description: `Xoş gəlmisiniz, ${workerData.name}!` })
            setActiveSection("home")
          } else {
            // Fallback: Create a temporary worker profile if not found in Firestore
            const tempWorker: UserType = {
              id: `temp-${loginId}`,
              email: `${loginId}@worker.local`,
              role: "worker",
              name: "Usta",
              surname: loginId,
              workerId: loginId,
              currentCompany: "Ustalar MMC",
            }

            setCurrentUser(tempWorker)
            toast({ title: "Uğurlu giriş", description: `Xoş gəlmisiniz, ${tempWorker.name}!` })
            setActiveSection("home")
          }
        } catch (error) {
          console.error("Worker login error (Firestore access issue):", error)
          // Fallback: Create a temporary worker profile even if Firestore access fails
          const tempWorker: UserType = {
            id: `temp-${loginId}`,
            email: `${loginId}@worker.local`,
            role: "worker",
            name: "Usta",
            surname: loginId,
            workerId: loginId,
            currentCompany: "Ustalar MMC",
          }

          setCurrentUser(tempWorker)
          toast({ title: "Uğurlu giriş", description: `Xoş gəlmisiniz, ${tempWorker.name}!` })
          setActiveSection("home")
        }
      } else {
        let email = loginId
        if (loginType === "admin" && !loginId.includes("@")) {
          email = "admin@ustalarmmc.az"
        }

        try {
          await signInWithEmailAndPassword(auth, email, password)
          console.log("User signed in successfully")
        } catch (signInError: any) {
          if (signInError.code === "auth/user-not-found" && loginType === "admin") {
            try {
              await createUserWithEmailAndPassword(auth, email, password)
              console.log("Admin user created successfully")
            } catch (createError) {
              console.error("Failed to create admin user:", createError)
              throw signInError
            }
          } else {
            throw signInError
          }
        }

        toast({ title: "Uğurlu giriş", description: "Xoş gəlmisiniz!" })
        setActiveSection("home")
      }
    } catch (error: any) {
      console.error("Login error:", error)
      let errorMessage = "Giriş xətası baş verdi"

      if (error.code === "auth/user-not-found") {
        errorMessage = "İstifadəçi tapılmadı"
      } else if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMessage = "Yanlış şifrə və ya email"
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Yanlış email formatı"
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Şifrə çox zəifdir"
      }

      toast({ title: "Xəta", description: errorMessage, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      if (currentUser?.role !== "worker" && auth) {
        await signOut(auth)
      }
      setCurrentUser(null)
      setActiveSection("home")
      setLoginId("")
      setPassword("")
      setWorkers([])
      setCompanies([])
      setJobs([])
      toast({ title: "Çıxış", description: "Uğurla çıxış etdiniz" })
    } catch (error) {
      console.error("Logout error:", error)
      toast({ title: "Xəta", description: "Çıxış zamanı xəta baş verdi", variant: "destructive" })
    }
  }

  const addWorker = async () => {
    if (!db || !currentUser) {
      toast({ title: "Xəta", description: "Database bağlantısı yoxdur!", variant: "destructive" })
      return
    }

    try {
      if (!newWorker.workerId || !newWorker.name || !newWorker.surname || !newWorker.phone) {
        toast({ title: "Xəta", description: "Bütün sahələri doldurun!", variant: "destructive" })
        return
      }

      const existingWorker = workers.find((w) => w.workerId === newWorker.workerId)
      if (existingWorker) {
        toast({ title: "Xəta", description: "Bu ID artıq mövcuddur!", variant: "destructive" })
        return
      }

      await addDoc(collection(db, "users"), {
        ...newWorker,
        role: "worker",
        currentCompany: "Ustalar MMC", // Default company
        assignedDate: new Date(),
        createdAt: new Date(),
      })

      setNewWorker({ workerId: "", name: "", surname: "", phone: "" })
      setShowAddWorker(false)
      toast({ title: "Uğur", description: "Yeni usta əlavə edildi!" })
    } catch (error) {
      console.error("Add worker error:", error)
      toast({ title: "Xəta", description: "Usta əlavə edilərkən xəta baş verdi", variant: "destructive" })
    }
  }

  const addCompany = async () => {
    if (!db || !auth || !currentUser) {
      toast({ title: "Xəta", description: "Firebase bağlantısı yoxdur!", variant: "destructive" })
      return
    }

    try {
      if (!newCompany.name || !newCompany.email || !newCompany.password) {
        toast({ title: "Xəta", description: "Bütün sahələri doldurun!", variant: "destructive" })
        return
      }

      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, newCompany.email, newCompany.password)
      const uid = userCredential.user.uid

      // 2. Add company data to Firestore
      await setDoc(doc(db, "users", uid), {
        name: newCompany.name,
        email: newCompany.email,
        role: "company",
        companyName: newCompany.name,
        createdAt: new Date(),
      })

      setNewCompany({ name: "", email: "", password: "" })
      setShowAddCompany(false)
      toast({ title: "Uğur", description: "Yeni şirkət əlavə edildi və giriş hesabı yaradıldı!" })
    } catch (error: any) {
      console.error("Add company error:", error)
      let errorMessage = "Şirkət əlavə edilərkən xəta baş verdi"
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Bu email artıq istifadə olunur. Başqa email seçin."
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Şifrə ən az 6 simvol olmalıdır."
      }
      toast({ title: "Xəta", description: errorMessage, variant: "destructive" })
    }
  }

  const addJob = async () => {
    if (!db || !currentUser) {
      toast({ title: "Xəta", description: "Database bağlantısı yoxdur!", variant: "destructive" })
      return
    }

    try {
      if (!newJob.title || !newJob.description || !newJob.companyId || !newJob.workerId || newJob.stages.length === 0) {
        toast({
          title: "Xəta",
          description: "Bütün sahələri doldurun və ən az bir mərhələ əlavə edin!",
          variant: "destructive",
        })
        return
      }

      const selectedCompany = companies.find((c) => c.id === newJob.companyId)
      const selectedWorker = workers.find((w) => w.id === newJob.workerId)

      if (!selectedCompany || !selectedWorker) {
        toast({ title: "Xəta", description: "Şirkət və ya usta tapılmadı!", variant: "destructive" })
        return
      }

      // Assign unique IDs and order to stages before saving
      const stagesWithIds = newJob.stages.map((stage, index) => ({
        ...stage,
        id: `stage-${Date.now()}-${index}`,
        order: index + 1,
      }))

      await addDoc(collection(db, "jobs"), {
        title: newJob.title,
        description: newJob.description,
        companyId: newJob.companyId,
        companyName: selectedCompany.companyName || selectedCompany.name,
        workerId: newJob.workerId,
        workerName: `${selectedWorker.name} ${selectedWorker.surname || ""}`.trim(),
        stages: stagesWithIds, // Use dynamically added stages
        status: "active",
        createdAt: new Date(),
      })

      setNewJob({ title: "", description: "", companyId: "", workerId: "", stages: [] }) // Reset stages
      setCurrentNewJobStageText("")
      setShowAddJob(false)
      toast({ title: "Uğur", description: "Yeni iş əlavə edildi!" })
    } catch (error) {
      console.error("Add job error:", error)
      toast({ title: "Xəta", description: "İş əlavə edilərkən xəta baş verdi", variant: "destructive" })
    }
  }

  // Functions for managing stages within the "Add Job" dialog
  const addNewStageToNewJob = () => {
    if (currentNewJobStageText.trim() === "") {
      toast({ title: "Xəta", description: "Mərhələ təsviri boş ola bilməz!", variant: "destructive" })
      return
    }
    const newStageItem: Omit<Stage, "id"> = {
      name: currentNewJobStageText, // Use text for both name and description
      description: currentNewJobStageText,
      completed: false,
      order: newJob.stages.length + 1, // Order will be re-assigned on job creation
    }
    setNewJob((prev) => ({
      ...prev,
      stages: [...prev.stages, newStageItem],
    }))
    setCurrentNewJobStageText("")
  }

  const removeStageFromNewJob = (indexToRemove: number) => {
    setNewJob((prev) => ({
      ...prev,
      stages: prev.stages.filter((_, index) => index !== indexToRemove),
    }))
  }

  const transferWorker = async () => {
    if (!db || !selectedWorker || !transferToCompany) {
      toast({ title: "Xəta", description: "Məlumatlar tam deyil!", variant: "destructive" })
      return
    }

    try {
      const selectedCompanyData = companies.find((c) => c.id === transferToCompany)
      if (!selectedCompanyData) {
        toast({ title: "Xəta", description: "Şirkət tapılmadı!", variant: "destructive" })
        return
      }

      const batch = writeBatch(db)

      // 1. Update worker's current company
      const workerRef = doc(db, "users", selectedWorker.id)
      batch.update(workerRef, {
        currentCompany: selectedCompanyData.companyName || selectedCompanyData.name,
        assignedDate: new Date(),
      })

      // 2. Update active jobs assigned to this worker to reflect the new company
      const workerActiveJobsQuery = query(
        collection(db, "jobs"),
        where("workerId", "==", selectedWorker.id),
        where("status", "==", "active"),
      )
      const workerActiveJobsSnapshot = await getDocs(workerActiveJobsQuery)

      workerActiveJobsSnapshot.forEach((jobDoc) => {
        const jobRef = doc(db, "jobs", jobDoc.id)
        batch.update(jobRef, {
          companyId: selectedCompanyData.id,
          companyName: selectedCompanyData.companyName || selectedCompanyData.name,
        })
      })

      await batch.commit()

      setShowTransferWorker(false)
      setSelectedWorker(null)
      setTransferToCompany("")
      toast({
        title: "Uğur",
        description: `${selectedWorker.name} ${selectedCompanyData.companyName || selectedCompanyData.name} şirkətinə köçürüldü və aktiv işləri yeniləndi!`,
      })
    } catch (error) {
      console.error("Transfer worker error:", error)
      toast({ title: "Xəta", description: "Usta köçürülməsində xəta baş verdi", variant: "destructive" })
    }
  }

  // Functions for managing stages within the "Manage Stages" dialog
  const addStageToJob = async () => {
    if (!db || !selectedJob || !newStageText.trim()) {
      toast({ title: "Xəta", description: "Mərhələ təsviri boş ola bilməz!", variant: "destructive" })
      return
    }

    try {
      const newStageData: Stage = {
        id: `stage-${Date.now()}`,
        name: newStageText, // Use text for both name and description
        description: newStageText,
        completed: false,
        order: selectedJob.stages.length + 1,
      }

      const updatedStages = [...selectedJob.stages, newStageData]

      await updateDoc(doc(db, "jobs", selectedJob.id), {
        stages: updatedStages,
      })

      setNewStageText("")
      toast({ title: "Uğur", description: "Yeni mərhələ əlavə edildi!" })
    } catch (error) {
      console.error("Add stage error:", error)
      toast({ title: "Xəta", description: "Mərhələ əlavə edilərkən xəta baş verdi", variant: "destructive" })
    }
  }

  const removeStageFromJob = async (stageId: string) => {
    if (!db || !selectedJob) return

    try {
      const updatedStages = selectedJob.stages.filter((stage) => stage.id !== stageId)

      await updateDoc(doc(db, "jobs", selectedJob.id), {
        stages: updatedStages,
      })

      toast({ title: "Uğur", description: "Mərhələ silindi!" })
    } catch (error) {
      console.error("Remove stage error:", error)
      toast({ title: "Xəta", description: "Mərhələ silinərkən xəta baş verdi", variant: "destructive" })
    }
  }

  const toggleStage = async (jobId: string, stageId: string, completed: boolean) => {
    if (!db) return

    try {
      const jobRef = doc(db, "jobs", jobId)
      const jobDoc = await getDoc(jobRef)

      if (jobDoc.exists()) {
        const jobData = jobDoc.data() as Job
        const updatedStages = jobData.stages.map((stage) =>
          stage.id === stageId
            ? {
                ...stage,
                completed,
                completedAt: completed ? new Date() : null, // Changed undefined to null
              }
            : stage,
        )

        const allCompleted = updatedStages.every((stage) => stage.completed)
        const status = allCompleted ? "completed" : "active"

        await updateDoc(jobRef, {
          stages: updatedStages,
          status,
        })

        toast({
          title: completed ? "Mərhələ tamamlandı" : "Mərhələ geri alındı",
          description: `${jobData.stages.find((s) => s.id === stageId)?.name} ${completed ? "tamamlandı" : "geri alındı"}`,
        })
      }
    } catch (error) {
      console.error("Toggle stage error:", error)
      toast({ title: "Xəta", description: "Mərhələ yenilənərkən xəta baş verdi", variant: "destructive" })
    }
  }

  const deleteWorker = async (workerId: string) => {
    if (!db) return

    try {
      await deleteDoc(doc(db, "users", workerId))
      toast({ title: "Uğur", description: "Usta silindi!" })
    } catch (error) {
      console.error("Delete worker error:", error)
      toast({ title: "Xəta", description: "Usta silinərkən xəta baş verdi", variant: "destructive" })
    }
  }

  const deleteCompany = async (companyId: string) => {
    if (!db) return

    try {
      // Optionally, delete the user from Firebase Auth as well
      // This requires admin SDK or a callable function, not directly from client-side
      await deleteDoc(doc(db, "users", companyId))
      toast({ title: "Uğur", description: "Şirkət silindi!" })
    } catch (error) {
      console.error("Delete company error:", error)
      toast({ title: "Xəta", description: "Şirkət silinərkən xəta baş verdi", variant: "destructive" })
    }
  }

  const deleteJob = async (jobId: string) => {
    if (!db) return

    try {
      await deleteDoc(doc(db, "jobs", jobId))
      toast({ title: "Uğur", description: "İş silindi!" })
    } catch (error) {
      console.error("Delete job error:", error)
      toast({ title: "Xəta", description: "İş silinərkən xəta baş verdi", variant: "destructive" })
    }
  }

  if (firebaseError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-700 mb-2">Firebase Xətası</h2>
            <p className="text-red-600 mb-4">{firebaseError}</p>
            <Button onClick={() => window.location.reload()} variant="destructive">
              Səhifəni Yenilə
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yüklənir...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-2xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wrench className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold">Ustalar MMC</h1>
                <p className="text-blue-200">Santexnik işlərinin idarəetmə sistemi</p>
              </div>
            </div>
            {currentUser && (
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="px-3 py-1">
                  {currentUser.role === "admin"
                    ? "Admin"
                    : currentUser.role === "company"
                      ? currentUser.companyName
                      : `${currentUser.name} ${currentUser.surname || ""}`}
                </Badge>
                {currentUser.role === "worker" && currentUser.currentCompany && (
                  <Badge variant="outline" className="px-3 py-1">
                    {currentUser.currentCompany}
                  </Badge>
                )}
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Çıxış
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-lg border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveSection("home")}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeSection === "home"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Home className="h-4 w-4 inline mr-2" />
              Ana Səhifə
            </button>
            <button
              onClick={() => setActiveSection("about")}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeSection === "about"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Haqqımızda
            </button>
            <button
              onClick={() => setActiveSection("contact")}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeSection === "contact"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Əlaqə
            </button>
            {!currentUser && (
              <button
                onClick={() => setActiveSection("login")}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeSection === "login"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Giriş
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Home Section */}
        {activeSection === "home" && !currentUser && (
          <div className="text-center py-20">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-5xl font-bold text-gray-900 mb-6">Peşəkar Santexnik Xidmətləri</h2>
              <p className="text-xl text-gray-600 mb-8">
                Ustalar MMC - keyfiyyət və etibarlılıq təminatı ilə santexnik işlərinin idarəetmə sistemi
              </p>
              <Button
                size="lg"
                onClick={() => setActiveSection("login")}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Sistemə Daxil Ol
              </Button>
            </div>
          </div>
        )}

        {/* Dashboard */}
        {activeSection === "home" && currentUser && (
          <div>
            {currentUser.role === "admin" && <AdminDashboard />}
            {currentUser.role === "company" && <CompanyDashboard />}
            {currentUser.role === "worker" && <WorkerDashboard />}
          </div>
        )}

        {/* Login Section */}
        {activeSection === "login" && !currentUser && (
          <div className="max-w-md mx-auto">
            <Card className="shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900">Sistemə Giriş</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="userType">İstifadəçi növü</Label>
                  <Select value={loginType} onValueChange={(value: any) => setLoginType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="company">Şirkət</SelectItem>
                      <SelectItem value="worker">Usta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="loginId">
                    {loginType === "worker" ? "Usta ID" : loginType === "company" ? "Email" : "İstifadəçi adı"}
                  </Label>
                  <Input
                    id="loginId"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder={loginType === "worker" ? "u001" : loginType === "admin" ? "admin" : "Email"}
                  />
                </div>

                {loginType !== "worker" && (
                  <div>
                    <Label htmlFor="password">Şifrə</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Şifrə"
                    />
                  </div>
                )}

                <Button
                  onClick={handleLogin}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={loading}
                >
                  {loading ? "Giriş edilir..." : "Daxil ol"}
                </Button>

                <div className="text-center text-sm text-gray-500 mt-4">
                  <p>Test məlumatları:</p>
                  <p>Admin: admin / admin123</p>
                  <p>Usta: u001 (şifresiz)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* About Section */}
        {activeSection === "about" && (
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-center text-gray-900">Ustalar MMC</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-12">
                <p className="text-xl text-gray-600">Peşəkar santexnik xidmətlərində keyfiyyət və etibarlılıq</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contact Section */}
        {activeSection === "contact" && (
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-center text-gray-900">Əlaqə</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-center space-x-4">
                  <a
                    href="tel:077-358-85-00"
                    className="flex items-center space-x-2 bg-green-100 hover:bg-green-200 px-6 py-3 rounded-lg transition-colors"
                  >
                    <Phone className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">077-358-85-00</span>
                  </a>
                  <a
                    href="https://wa.me/994773588500"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 bg-green-100 hover:bg-green-200 px-6 py-3 rounded-lg transition-colors"
                  >
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">WhatsApp</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-4 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-gray-400">
            Qurucu:{" "}
            <a href="tel:060-600-61-62" className="hover:text-white transition-colors cursor-pointer">
              İbadulla Həsənov
            </a>
          </p>
        </div>
      </footer>

      <Toaster />

      {/* All Dialogs */}
      {currentUser?.role === "admin" && (
        <>
          {/* Add Worker Dialog */}
          <Dialog open={showAddWorker} onOpenChange={setShowAddWorker}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Usta Əlavə Et</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="workerId">Usta ID</Label>
                  <Input
                    id="workerId"
                    value={newWorker.workerId}
                    onChange={(e) => setNewWorker({ ...newWorker, workerId: e.target.value })}
                    placeholder="u001"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Ad</Label>
                  <Input
                    id="name"
                    value={newWorker.name}
                    onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                    placeholder="Ad"
                  />
                </div>
                <div>
                  <Label htmlFor="surname">Soyad</Label>
                  <Input
                    id="surname"
                    value={newWorker.surname}
                    onChange={(e) => setNewWorker({ ...newWorker, surname: e.target.value })}
                    placeholder="Soyad"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={newWorker.phone}
                    onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })}
                    placeholder="055-123-45-67"
                  />
                </div>
                <Button onClick={addWorker} className="w-full">
                  Əlavə Et
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Company Dialog */}
          <Dialog open={showAddCompany} onOpenChange={setShowAddCompany}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Şirkət Əlavə Et</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Şirkət Adı</Label>
                  <Input
                    id="companyName"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    placeholder="Şirkət adı"
                  />
                </div>
                <div>
                  <Label htmlFor="companyEmail">Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={newCompany.email}
                    onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                    placeholder="company@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="companyPassword">Şifrə</Label>
                  <Input
                    id="companyPassword"
                    type="password"
                    value={newCompany.password}
                    onChange={(e) => setNewCompany({ ...newCompany, password: e.target.value })}
                    placeholder="Şifrə"
                  />
                </div>
                <Button onClick={addCompany} className="w-full">
                  Əlavə Et
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Job Dialog */}
          <Dialog open={showAddJob} onOpenChange={setShowAddJob}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Yeni İş Əlavə Et</DialogTitle>
              </DialogHeader>
              {/* Wrapper div for scrollable content */}
              <div className="max-h-[calc(90vh-120px)] overflow-y-auto pr-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="jobTitle">İş Başlığı</Label>
                    <Input
                      id="jobTitle"
                      value={newJob.title}
                      onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                      placeholder="Məsələn: Mətbəx santexnikası"
                    />
                  </div>
                  <div>
                    <Label htmlFor="jobDescription">İş Təsviri</Label>
                    <Textarea
                      id="jobDescription"
                      value={newJob.description}
                      onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                      placeholder="İşin təfərrüatlı təsviri..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="jobCompany">Şirkət</Label>
                    <Select
                      value={newJob.companyId}
                      onValueChange={(value) => setNewJob({ ...newJob, companyId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Şirkət seçin" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.companyName || company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="jobWorker">Usta</Label>
                    <Select
                      value={newJob.workerId}
                      onValueChange={(value) => setNewJob({ ...newJob, workerId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Usta seçin" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {workers.map((worker) => (
                          <SelectItem key={worker.id} value={worker.id}>
                            {worker.name} {worker.surname} ({worker.workerId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dynamic Stage Addition for New Job */}
                  <div className="space-y-3 border-t pt-4">
                    <h4 className="font-medium">Mərhələlər:</h4>
                    {newJob.stages.length > 0 && (
                      <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                        {newJob.stages.map((stage, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 border rounded-lg bg-gray-50"
                          >
                            <div>
                              <p className="font-medium">{stage.name}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeStageFromNewJob(index)}>
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Input
                        id="newJobStageText"
                        value={currentNewJobStageText}
                        onChange={(e) => setCurrentNewJobStageText(e.target.value)}
                        placeholder="Mərhələ təsviri"
                        className="flex-1"
                      />
                      <Button onClick={addNewStageToNewJob} size="icon" className="shrink-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <Button onClick={addJob} className="w-full mt-4">
                {" "}
                {/* Moved button outside scrollable div */}
                İş Əlavə Et
              </Button>
            </DialogContent>
          </Dialog>

          {/* Transfer Worker Dialog */}
          <Dialog open={showTransferWorker} onOpenChange={setShowTransferWorker}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ustanı Köçür</DialogTitle>
              </DialogHeader>
              {selectedWorker && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium">
                      {selectedWorker.name} {selectedWorker.surname}
                    </p>
                    <p className="text-sm text-gray-600">ID: {selectedWorker.workerId}</p>
                    <p className="text-sm text-gray-600">Hazırki şirkət: {selectedWorker.currentCompany}</p>
                  </div>
                  <div>
                    <Label htmlFor="transferCompany">Yeni Şirkət</Label>
                    <Select value={transferToCompany} onValueChange={setTransferToCompany}>
                      <SelectTrigger>
                        <SelectValue placeholder="Şirkət seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.companyName || company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={transferWorker} className="w-full" disabled={!transferToCompany}>
                    Köçür
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Manage Stages Dialog */}
          <Dialog open={showManageStages} onOpenChange={setShowManageStages}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Mərhələləri İdarə Et</DialogTitle>
              </DialogHeader>
              {selectedJob && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium">{selectedJob.title}</p>
                    <p className="text-sm text-gray-600">{selectedJob.description}</p>
                  </div>

                  {/* Existing Stages */}
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                    <h4 className="font-medium">Mövcud Mərhələlər:</h4>
                    {selectedJob.stages.map((stage) => (
                      <div key={stage.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {stage.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <p className="font-medium">{stage.name}</p>
                            {stage.completed && stage.completedAt && (
                              <p className="text-xs text-green-600">
                                Tamamlandı: {new Date(stage.completedAt).toLocaleString("az-AZ")}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStageFromJob(stage.id)}
                          // Removed disabled={stage.completed} to allow deleting completed stages
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Add New Stage */}
                  <div className="space-y-3 border-t pt-4">
                    <h4 className="font-medium">Yeni Mərhələ Əlavə Et:</h4>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="newStageText"
                        value={newStageText}
                        onChange={(e) => setNewStageText(e.target.value)}
                        placeholder="Mərhələ təsviri"
                        className="flex-1"
                      />
                      <Button onClick={addStageToJob} size="icon" className="shrink-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )

  // Admin Dashboard Component
  function AdminDashboard() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Admin Paneli</h2>
          <div className="flex space-x-2">
            <Dialog open={showAddWorker} onOpenChange={setShowAddWorker}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Usta Əlavə Et
                </Button>
              </DialogTrigger>
            </Dialog>
            <Dialog open={showAddCompany} onOpenChange={setShowAddCompany}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Building2 className="h-4 w-4 mr-2" />
                  Şirkət Əlavə Et
                </Button>
              </DialogTrigger>
            </Dialog>
            <Dialog open={showAddJob} onOpenChange={setShowAddJob}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  İş Əlavə Et
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="workers" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="workers">Ustalar ({workers.length})</TabsTrigger>
            <TabsTrigger value="companies">Şirkətlər ({companies.length})</TabsTrigger>
            <TabsTrigger value="jobs">İşlər ({jobs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="workers" className="space-y-4">
            <div className="grid gap-4">
              {workers.length === 0 ? (
                <Card className="shadow-lg">
                  <CardContent className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Hələ heç bir usta əlavə edilməyib</p>
                    <Button onClick={() => setShowAddWorker(true)} className="mt-4 bg-green-600 hover:bg-green-700">
                      <UserPlus className="h-4 w-4 mr-2" />
                      İlk Ustanı Əlavə Et
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                workers.map((worker) => (
                  <Card key={worker.id} className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 p-3 rounded-full">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {worker.name} {worker.surname}
                          </h3>
                          <p className="text-gray-600">ID: {worker.workerId}</p>
                          <p className="text-sm text-gray-500">{worker.phone}</p>
                          {worker.assignedDate && (
                            <p className="text-xs text-gray-400">
                              Təyin tarixi: {new Date(worker.assignedDate).toLocaleDateString("az-AZ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{worker.currentCompany}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedWorker(worker)
                            setShowTransferWorker(true)
                          }}
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteWorker(worker.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="companies" className="space-y-4">
            <div className="grid gap-4">
              {companies.length === 0 ? (
                <Card className="shadow-lg">
                  <CardContent className="text-center py-12">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Hələ heç bir şirkət əlavə edilməyib</p>
                    <Button onClick={() => setShowAddCompany(true)} className="mt-4 bg-blue-600 hover:bg-blue-700">
                      <Building2 className="h-4 w-4 mr-2" />
                      İlk Şirkəti Əlavə Et
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                companies.map((company) => (
                  <Card key={company.id} className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center space-x-4">
                        <div className="bg-green-100 p-3 rounded-full">
                          <Building2 className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{company.companyName}</h3>
                          <p className="text-gray-600">{company.email}</p>
                          <p className="text-sm text-gray-500">
                            Aktiv işlər:{" "}
                            {jobs.filter((job) => job.companyId === company.id && job.status === "active").length}
                          </p>
                        </div>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => deleteCompany(company.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <div className="grid gap-4">
              {jobs.length === 0 ? (
                <Card className="shadow-lg">
                  <CardContent className="text-center py-12">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Hələ heç bir iş əlavə edilməyib</p>
                    <Button onClick={() => setShowAddJob(true)} className="mt-4 bg-purple-600 hover:bg-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      İlk İşi Əlavə Et
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                jobs.map((job) => (
                  <Card key={job.id} className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{job.title}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">{job.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={job.status === "completed" ? "default" : "secondary"}>
                            {job.status === "completed" ? "Tamamlandı" : "Aktiv"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedJob(job)
                              setShowManageStages(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteJob(job.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Şirkət</p>
                          <p className="text-sm text-gray-600">{job.companyName}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Usta</p>
                          <p className="text-sm text-gray-600">{job.workerName}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          Mərhələlər ({job.stages.filter((s) => s.completed).length}/{job.stages.length}):
                        </p>
                        <div className="grid grid-cols-1 gap-1">
                          {job.stages.slice(0, 3).map((stage) => (
                            <div key={stage.id} className="flex items-center space-x-2">
                              {stage.completed ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Clock className="h-4 w-4 text-gray-400" />
                              )}
                              <span className={`text-sm ${stage.completed ? "text-green-700" : "text-gray-600"}`}>
                                {stage.name}
                              </span>
                            </div>
                          ))}
                          {job.stages.length > 3 && (
                            <p className="text-xs text-gray-500">+{job.stages.length - 3} daha çox mərhələ</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // Company Dashboard Component
  function CompanyDashboard() {
    // Filter jobs to show those created by the company OR assigned to its workers
    const companyJobs = jobs.filter((job) => {
      const isJobCreatedByCompany = job.companyId === currentUser?.id
      const isJobAssignedToCompanyWorker = workers.some(
        (worker) => worker.currentCompany === currentUser?.companyName && worker.id === job.workerId,
      )
      return isJobCreatedByCompany || isJobAssignedToCompanyWorker
    })

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">Şirkət Paneli</h2>
          <Badge variant="outline" className="px-3 py-1">
            {companyJobs.length} Aktiv İş
          </Badge>
        </div>
        <div className="grid gap-4">
          {companyJobs.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="text-center py-12">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Sizə təyin edilmiş iş yoxdur</p>
              </CardContent>
            </Card>
          ) : (
            companyJobs.map((job) => (
              <Card key={job.id} className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <p className="text-sm text-gray-600">{job.description}</p>
                    </div>
                    <Badge variant={job.status === "completed" ? "default" : "secondary"}>
                      {job.status === "completed" ? "Tamamlandı" : "Aktiv"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <p className="text-sm font-medium text-gray-700">Usta: {job.workerName}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-600">
                        Başlanma tarixi: {job.createdAt?.toLocaleDateString("az-AZ")}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">İş Gedişatı:</p>
                      <p className="text-sm text-gray-600">
                        {job.stages.filter((s) => s.completed).length}/{job.stages.length} tamamlandı
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(job.stages.filter((s) => s.completed).length / job.stages.length) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="space-y-2">
                      {job.stages.map((stage) => (
                        <div key={stage.id} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
                          {stage.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-gray-400" />
                          )}
                          <div className="flex-1">
                            <p
                              className={`text-sm font-medium ${stage.completed ? "text-green-700" : "text-gray-900"}`}
                            >
                              {stage.name}
                            </p>
                            {stage.completed && stage.completedAt && (
                              <p className="text-xs text-green-600">
                                Tamamlandı: {new Date(stage.completedAt).toLocaleString("az-AZ")}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    )
  }

  // Worker Dashboard Component
  function WorkerDashboard() {
    const workerJobs = jobs.filter((job) => job.workerId === currentUser?.id || job.workerId === currentUser?.workerId)

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Usta Paneli</h2>
            {currentUser?.currentCompany && (
              <p className="text-gray-600 mt-1">Hazırki şirkət: {currentUser.currentCompany}</p>
            )}
            {currentUser?.assignedDate && (
              <p className="text-sm text-gray-500">
                Təyin tarixi: {new Date(currentUser.assignedDate).toLocaleDateString("az-AZ")}
              </p>
            )}
          </div>
          <Badge variant="outline" className="px-3 py-1">
            {workerJobs.length} Təyin Edilmiş İş
          </Badge>
        </div>
        <div className="grid gap-4">
          {workerJobs.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="text-center py-12">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Sizə təyin edilmiş iş yoxdur</p>
                <p className="text-sm text-gray-400 mt-2">Admin tərəfindən iş təyin edildikdə burada görünəcək</p>
              </CardContent>
            </Card>
          ) : (
            workerJobs.map((job) => (
              <Card key={job.id} className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <p className="text-sm text-gray-600">{job.description}</p>
                    </div>
                    <Badge variant={job.status === "completed" ? "default" : "secondary"}>
                      {job.status === "completed" ? "Tamamlandı" : "Aktiv"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <p className="text-sm font-medium text-gray-700">Şirkət: {job.companyName}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-600">
                        Başlanma tarixi: {job.createdAt?.toLocaleDateString("az-AZ")}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">Mərhələlər:</p>
                      <p className="text-sm text-gray-600">
                        {job.stages.filter((s) => s.completed).length}/{job.stages.length} tamamlandı
                      </p>
                    </div>
                    {job.stages.map((stage) => (
                      <div key={stage.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {stage.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <p
                              className={`text-sm font-medium ${stage.completed ? "text-green-700" : "text-gray-900"}`}
                            >
                              {stage.name}
                            </p>
                            {stage.completed && stage.completedAt && (
                              <p className="text-xs text-green-600">
                                Tamamlandı: {new Date(stage.completedAt).toLocaleString("az-AZ")}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={stage.completed ? "outline" : "default"}
                          onClick={() => toggleStage(job.id, stage.id, !stage.completed)}
                          disabled={job.status === "completed"}
                        >
                          {stage.completed ? "Geri Al" : "Tamamla"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    )
  }
}

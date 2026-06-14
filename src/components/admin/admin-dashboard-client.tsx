import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Plus, FileText, Copy, Check, Users, UploadCloud, Settings, Trash2, KeyRound, ChevronDown, ChevronUp, Calendar, Clock, Award, Edit, Sun, Moon, BookOpen, Trash } from "lucide-react";
import { fadeUp, listItem, staggerContainer } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { deleteTest } from "@/app/actions/test";
import { CreateUserForm } from "./create-user-form";
import { ChangePassword } from "../auth/change-password";
import { changeUserPassword, deleteUser as deleteUserAction, updateUser as updateUserAction } from "@/app/actions/admin";
import { uploadNoteAction, deleteNoteAction } from "@/app/actions/notes";
import type { Profile, Attempt } from "@/types/database";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "../ui/textarea";

type TestItem = {
  id: string;
  title: string;
  status: string;
};

export function AdminDashboardClient({
  profile: currentProfile,
  studentCount,
  tests,
  profiles = [],
  attempts = [],
  notes = [],
}: {
  profile: Profile;
  studentCount: number;
  tests: TestItem[];
  profiles?: Profile[];
  attempts?: Attempt[];
  notes?: any[];
}) {
  const reduce = useReducedMotion();
  const { toast } = useToast();
  const router = useRouter();

  // Tab State and URL Synchronization
  const [activeTab, setActiveTab] = useState<"tests" | "users" | "notes" | "upload" | "settings">("tests");
  const [testToDelete, setTestToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // User Management State
  const [selectedProfileForPassword, setSelectedProfileForPassword] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [expandedProfiles, setExpandedProfiles] = useState<Record<string, boolean>>({});

  const [userToEdit, setUserToEdit] = useState<Profile | null>(null);
  const [editFormData, setEditFormData] = useState({ firstName: "", lastName: "", username: "", email: "" });
  const [isEditingUser, setIsEditingUser] = useState(false);

  // Notes state
  const [noteToDelete, setNoteToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingNote, setIsDeletingNote] = useState(false);
  const [isUploadNoteOpen, setIsUploadNoteOpen] = useState(false);
  const [noteUploadData, setNoteUploadData] = useState({
    title: "",
    description: "",
    fileType: "pdf" as "pdf" | "markdown",
    content: "",
  });
  const [noteFile, setNoteFile] = useState<File | null>(null);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark") || "light";
    }
    return "light";
  });

  const toggleTheme = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    const root = document.documentElement;
    if (newTheme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  };

  const toggleProfileExpanded = (profileId: string) => {
    setExpandedProfiles((prev) => ({
      ...prev,
      [profileId]: !prev[profileId],
    }));
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tab = new URLSearchParams(window.location.search).get("tab");
      if (tab === "users" || tab === "notes" || tab === "upload" || tab === "settings" || tab === "tests") {
        setActiveTab(tab as any);
      }
    }
  }, []);

  const handleTabChange = (tab: "tests" | "users" | "notes" | "upload" | "settings") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (tab === "tests") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", tab);
      }
      window.history.pushState({}, "", url.toString());
    }
  };

  const tabs = [
    { id: "tests", label: "Assessments", icon: FileText },
    { id: "users", label: "Users", icon: Users },
    { id: "notes", label: "Notes", icon: BookOpen },
    { id: "upload", label: "Bulk Upload", icon: UploadCloud },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;

  return (
    <>
      {/* Menu / Options tab navigation */}
      <div className="flex flex-wrap gap-1.5 border-b border-white/[0.06] pb-3 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200",
                active
                  ? "text-primary bg-primary/10 shadow-[0_0_15px_-3px_hsla(190,100%,50%,0.15)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              {active && !reduce && (
                <motion.span
                  layoutId="admin-nav-pill"
                  className="absolute inset-0 rounded-xl border border-primary/20 pointer-events-none"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Tests */}
      {activeTab === "tests" && (
        <div className="space-y-6">
          <motion.div
            variants={reduce ? undefined : staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <motion.div variants={fadeUp} className="bento-card p-6 group">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Total Tests
                </p>
                <div className="h-2 w-2 rounded-full bg-accent animate-pulse-glow" />
              </div>
              <p className="text-4xl font-black tabular-nums gradient-text">
                {tests.length}
              </p>
              <p className="mt-2 text-xs text-muted-foreground font-medium">Created assessments</p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Link href="/admin/tests/new" className="block h-full">
                <div className="bento-card h-full p-6 flex flex-col items-center justify-center gap-3 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all group">
                  <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-bold text-primary">Create New Test</p>
                </div>
              </Link>
            </motion.div>
          </motion.div>

          {/* Test List Section */}
          <motion.div
            variants={reduce ? undefined : fadeUp}
            initial="hidden"
            animate="show"
            className="bento-card"
          >
            <div className="border-b border-white/[0.06] p-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight">All Tests</h2>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Manage your assessments</p>
              </div>
              <Badge variant="secondary" className="font-mono">{tests.length}</Badge>
            </div>

            {tests.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-muted-foreground">No tests created yet.</p>
              </div>
            ) : (
              <motion.ul
                variants={reduce ? undefined : staggerContainer}
                initial="hidden"
                animate="show"
                className="divide-y divide-white/[0.04]"
              >
                {tests.map((t) => (
                  <motion.li
                    key={t.id}
                    variants={listItem}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4 px-6 py-5">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/admin/tests/${t.id}`}
                          className="block font-bold text-base group-hover:text-primary transition-colors truncate"
                        >
                          {t.title}
                        </Link>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge
                            variant={
                              t.status === "published"
                                ? "success"
                                : t.status === "draft"
                                  ? "muted"
                                  : "secondary"
                            }
                            className="h-5 text-[10px] uppercase tracking-tighter"
                          >
                            {t.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {(t.status === "published" || t.status === "archived") && (
                          <Button variant="ghost" size="sm" asChild className="h-8 text-xs font-bold text-primary hover:bg-primary/10">
                            <Link href={`/admin/tests/${t.id}/reports`}>
                              Reports
                            </Link>
                          </Button>
                        )}
                        <Button variant="outline" size="sm" asChild className="h-8 text-xs font-bold border-white/10 hover:bg-white/5">
                          <Link href={`/admin/tests/${t.id}`}>
                            Edit
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setTestToDelete({ id: t.id, title: t.title })}
                          className="h-8 w-8 text-destructive hover:text-red-400 hover:bg-red-500/10 rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </motion.div>
        </div>
      )}

      {/* Tab: Users */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column: Stats & Create Form */}
            <div className="lg:col-span-1 space-y-6">
              <motion.div
                variants={reduce ? undefined : staggerContainer}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 gap-4"
              >
                <motion.div variants={fadeUp} className="bento-card p-6 group">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Total Students
                    </p>
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-4xl font-black tabular-nums gradient-text">
                    {studentCount}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground font-medium">Active learners on the platform</p>
                </motion.div>
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="show"
              >
                <CreateUserForm currentUserRole={currentProfile.role} />
              </motion.div>
            </div>

            {/* Right Column: Users List */}
            <div className="lg:col-span-2">
              <motion.div
                variants={reduce ? undefined : fadeUp}
                initial="hidden"
                animate="show"
                className="bento-card h-full flex flex-col"
              >
                <div className="border-b border-white/[0.06] p-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">All Users</h2>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Manage user profiles and track test scores</p>
                  </div>
                  <Badge variant="secondary" className="font-mono">{profiles.length}</Badge>
                </div>

                {profiles.length === 0 ? (
                  <div className="p-12 text-center flex-1 flex flex-col items-center justify-center">
                    <p className="text-sm text-muted-foreground">No users found.</p>
                  </div>
                ) : (
                  <motion.ul
                    variants={reduce ? undefined : staggerContainer}
                    initial="hidden"
                    animate="show"
                    className="divide-y divide-white/[0.04] overflow-y-auto max-h-[600px] scrollbar-thin"
                  >
                    {profiles.map((profile) => {
                      const userAttempts = attempts.filter((a) => a.student_id === profile.id);
                      const isExpanded = expandedProfiles[profile.id];

                      return (
                        <motion.li
                          key={profile.id}
                          variants={listItem}
                          className="group hover:bg-white/[0.01] transition-colors"
                        >
                          <div className="p-6">
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm sm:text-base text-foreground">
                                    {profile.full_name || "No Name"}
                                  </span>
                                  <Badge
                                    variant={
                                      profile.role === "superadmin" || profile.role === "admin"
                                        ? "default"
                                        : profile.role === "teacher"
                                          ? "warning"
                                          : "secondary"
                                    }
                                    className={cn(
                                      "h-5 text-[10px] uppercase tracking-tighter font-semibold",
                                      (profile.role === "superadmin" || profile.role === "admin")
                                        ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                                        : profile.role === "teacher"
                                          ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                                          : "bg-primary/10 text-primary border border-primary/20"
                                    )}
                                  >
                                    {profile.role}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground font-medium">
                                  {profile.username && (
                                    <span>
                                      Username: <strong className="text-foreground/80 font-mono">{profile.username}</strong>
                                    </span>
                                  )}
                                  <span>
                                    Email: <strong className="text-foreground/80">{profile.email}</strong>
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {((currentProfile.role === "superadmin" || currentProfile.role === "admin") ||
                                  (currentProfile.role === "teacher" && profile.created_by === currentProfile.id && profile.role === "student")) &&
                                  profile.id !== currentProfile.id && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedProfileForPassword(profile)}
                                        className="h-8 text-xs font-bold border-white/10 hover:bg-white/5 gap-1.5 rounded-xl"
                                      >
                                        <KeyRound className="h-3.5 w-3.5 text-primary" />
                                        <span className="hidden sm:inline">Password</span>
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setUserToEdit(profile);
                                          const names = (profile.full_name || "").split(" ");
                                          setEditFormData({
                                            firstName: names[0] || "",
                                            lastName: names.slice(1).join(" ") || "",
                                            username: profile.username || "",
                                            email: profile.email || "",
                                          });
                                        }}
                                        className="h-8 text-xs font-bold border-white/10 hover:bg-white/5 gap-1.5 rounded-xl"
                                      >
                                        <Edit className="h-3.5 w-3.5 text-primary" />
                                        <span className="hidden sm:inline">Edit</span>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={async () => {
                                          if (confirm(`Are you sure you want to permanently delete user ${profile.full_name || profile.username || profile.email}? This will delete their profile and all test attempts. This cannot be undone.`)) {
                                            try {
                                              const res = await deleteUserAction(profile.id);
                                              if (res.ok) {
                                                toast({
                                                  title: "User deleted",
                                                  description: "Successfully deleted user profile.",
                                                });
                                                router.refresh();
                                              } else {
                                                toast({
                                                  title: "Error",
                                                  description: res.error || "Failed to delete user",
                                                  variant: "destructive",
                                                });
                                              }
                                            } catch (err) {
                                              toast({
                                                title: "Error",
                                                description: "An unexpected error occurred",
                                                variant: "destructive",
                                              });
                                            }
                                          }
                                        }}
                                        className="h-8 w-8 text-destructive hover:text-red-400 hover:bg-red-500/10 rounded-xl"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                {profile.role === "student" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleProfileExpanded(profile.id)}
                                    className="h-8 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-white/5 gap-1.5 rounded-xl"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <ChevronUp className="h-4 w-4" />
                                        <span className="hidden sm:inline">Hide Attempts</span>
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="h-4 w-4" />
                                        <span className="hidden sm:inline">View Attempts ({userAttempts.length})</span>
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Expanded section: test attempts history */}
                            {isExpanded && profile.role === "student" && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mt-4 pt-4 border-t border-white/[0.04] space-y-3"
                              >
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">Test Attempts History</p>
                                {userAttempts.length === 0 ? (
                                  <p className="text-xs text-muted-foreground italic">No tests taken yet.</p>
                                ) : (
                                  <div className="grid gap-2">
                                    {userAttempts.map((attempt) => {
                                      const testItem = tests.find((t) => t.id === attempt.test_id);
                                      const testTitle = testItem ? testItem.title : "Unknown Test";
                                      const isSubmitted = attempt.status === "submitted";

                                      return (
                                        <div
                                          key={attempt.id}
                                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                                        >
                                          <div className="min-w-0">
                                            <p className="font-bold text-sm truncate text-foreground/90">
                                              {testTitle}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-muted-foreground">
                                              <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(attempt.started_at).toLocaleDateString()}
                                              </span>
                                              <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDuration(attempt.total_time_seconds)}
                                              </span>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-3 self-end sm:self-center">
                                            <Badge
                                              variant={isSubmitted ? "success" : "warning"}
                                              className="h-5 text-[9px] uppercase tracking-tighter font-semibold"
                                            >
                                              {attempt.status}
                                            </Badge>
                                            <div className="flex items-center gap-1 text-xs font-bold">
                                              <Award className="h-3.5 w-3.5 text-primary" />
                                              <span className="gradient-text font-black">
                                                {attempt.total_score !== null ? `${attempt.total_score} / ${attempt.max_score}` : "—"}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </div>
                        </motion.li>
                      );
                    })}
                  </motion.ul>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Bulk Upload */}
      {activeTab === "upload" && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="bento-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold tracking-tight">Bulk Upload Format</h2>
            </div>
            <CSVCopyButton />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Headers</p>
              <code className="block rounded-lg bg-white/5 p-3 text-[10px] font-mono text-primary overflow-x-auto whitespace-nowrap scrollbar-thin">
                type,question,marks,options,correct_answer,explanation,tolerance
              </code>
            </div>
            <div className="space-y-2 min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sample MCQ</p>
              <code className="block rounded-lg bg-white/5 p-3 text-[10px] font-mono text-muted-foreground overflow-x-auto whitespace-nowrap scrollbar-thin">
                {'mcq,"What is 2+2?",1,"4|5|6",4,"Basic math",'}
              </code>
            </div>
            <div className="space-y-2 min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sample MSQ</p>
              <code className="block rounded-lg bg-white/5 p-3 text-[10px] font-mono text-muted-foreground overflow-x-auto whitespace-nowrap scrollbar-thin">
                {'msq,"Primes?",2,"2|3|4|5","2|3|5","2,3,5 are prime",'}
              </code>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab: Notes */}
      {activeTab === "notes" && (
        <div className="space-y-6">
          <motion.div
            variants={reduce ? undefined : staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <motion.div variants={fadeUp} className="bento-card p-6 group">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Total Notes
                </p>
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <p className="text-4xl font-black tabular-nums gradient-text">
                {notes.length}
              </p>
              <p className="mt-2 text-xs text-muted-foreground font-medium">Uploaded study materials</p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <button
                onClick={() => setIsUploadNoteOpen(true)}
                className="w-full h-full text-left focus:outline-none"
              >
                <div className="bento-card h-full p-6 flex flex-col items-center justify-center gap-3 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all group">
                  <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-bold text-primary">Upload Note</p>
                </div>
              </button>
            </motion.div>
          </motion.div>

          <motion.div
            variants={reduce ? undefined : fadeUp}
            initial="hidden"
            animate="show"
            className="bento-card"
          >
            <div className="border-b border-border p-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight">All Notes</h2>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Manage study resources for students</p>
              </div>
              <Badge variant="secondary" className="font-mono">{notes.length}</Badge>
            </div>

            {notes.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-muted-foreground">No notes uploaded yet.</p>
              </div>
            ) : (
              <motion.ul
                variants={reduce ? undefined : staggerContainer}
                initial="hidden"
                animate="show"
                className="divide-y divide-border"
              >
                {notes.map((note) => (
                  <motion.li
                    key={note.id}
                    variants={listItem}
                    className="group hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4 px-6 py-5">
                      <div className="min-w-0 flex-1">
                        <span className="block font-bold text-base truncate text-foreground">
                          {note.title}
                        </span>
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {note.description || "No description"}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge
                            variant={note.file_type === "pdf" ? "default" : "secondary"}
                            className="h-5 text-[10px] uppercase font-semibold"
                          >
                            {note.file_type}
                          </Badge>
                          {note.profiles?.full_name && (
                            <span className="text-xs text-muted-foreground">
                              By {note.profiles.full_name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {note.file_type === "pdf" && note.file_path && (
                          <Button variant="outline" size="sm" asChild className="h-8 text-xs font-bold">
                            <a
                              href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/notes/${note.file_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Download PDF
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setNoteToDelete({ id: note.id, title: note.title })}
                          className="h-8 w-8 text-destructive hover:text-red-400 hover:bg-red-500/10 rounded-xl"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </motion.div>
        </div>
      )}

      {/* Tab: Settings */}
      {activeTab === "settings" && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Display Settings Card */}
          <div className="bento-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sun className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Preferences</h3>
            </div>
            <div className="space-y-4">
              <Label className="text-xs uppercase font-bold text-muted-foreground/60 tracking-wider">Display Theme</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => toggleTheme("light")}
                  className="gap-2 h-11 font-bold border-white/10 hover:bg-white/5 rounded-2xl"
                >
                  <Sun className="h-4 w-4 text-amber-400" />
                  Light Mode
                </Button>
                <Button
                  type="button"
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => toggleTheme("dark")}
                  className="gap-2 h-11 font-bold border-white/10 hover:bg-white/5 rounded-2xl"
                >
                  <Moon className="h-4 w-4 text-cyan-400" />
                  Dark Mode
                </Button>
              </div>
            </div>
          </div>

          <ChangePassword />
        </motion.div>
      )}

      {/* Delete Test Confirmation Dialog */}
      <AlertDialog open={!!testToDelete} onOpenChange={(open) => !open && setTestToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive font-black">Delete Test Permanently?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed pt-2">
              Are you sure you want to delete the test <strong className="text-foreground">&quot;{testToDelete?.title}&quot;</strong>? 
              This will permanently delete this assessment, all questions, and all student attempts and scores. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel disabled={isDeleting} className="border-white/10 hover:bg-white/5">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
              disabled={isDeleting}
              onClick={async (e) => {
                e.preventDefault();
                if (!testToDelete) return;
                setIsDeleting(true);
                try {
                  const res = await deleteTest(testToDelete.id);
                  if (res.ok) {
                    toast({
                      title: "Test deleted",
                      description: `Successfully deleted "${testToDelete.title}"`,
                    });
                    setTestToDelete(null);
                    router.refresh();
                  } else {
                    toast({
                      title: "Error",
                      description: res.error || "Failed to delete test",
                      variant: "destructive",
                    });
                  }
                } catch (err) {
                  toast({
                    title: "Error",
                    description: "An unexpected error occurred",
                    variant: "destructive",
                  });
                } finally {
                  setIsDeleting(false);
                }
              }}
            >
              {isDeleting ? "Deleting..." : "Yes, delete test"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Password Dialog */}
      <Dialog
        open={!!selectedProfileForPassword}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProfileForPassword(null);
            setNewPassword("");
          }
        }}
      >
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle className="font-black text-lg">Change User Password</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Enter a new password for <strong className="text-foreground">{selectedProfileForPassword?.full_name || selectedProfileForPassword?.username || selectedProfileForPassword?.email}</strong>. The password must be at least 6 characters.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!selectedProfileForPassword) return;
              if (newPassword.length < 6) {
                toast({
                  title: "Validation error",
                  description: "Password must be at least 6 characters.",
                  variant: "destructive",
                });
                return;
              }
              setIsUpdatingPassword(true);
              try {
                const res = await changeUserPassword(selectedProfileForPassword.id, newPassword);
                if (res.ok) {
                  toast({
                    title: "Password updated",
                    description: `Successfully updated password for ${selectedProfileForPassword.full_name || selectedProfileForPassword.username || selectedProfileForPassword.email}`,
                  });
                  setSelectedProfileForPassword(null);
                  setNewPassword("");
                  router.refresh();
                } else {
                  toast({
                    title: "Error",
                    description: res.error || "Failed to update password",
                    variant: "destructive",
                  });
                }
              } catch (err) {
                toast({
                  title: "Error",
                  description: "An unexpected error occurred",
                  variant: "destructive",
                });
              } finally {
                setIsUpdatingPassword(false);
              }
            }}
            className="space-y-4 mt-2"
          >
            <div className="space-y-2">
              <Label htmlFor="new-user-password">New Password</Label>
              <Input
                id="new-user-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-black/20"
                minLength={6}
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isUpdatingPassword}
                onClick={() => {
                  setSelectedProfileForPassword(null);
                  setNewPassword("");
                }}
                className="border-white/10 hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdatingPassword}
                className="shine-btn font-bold"
              >
                {isUpdatingPassword ? "Updating..." : "Update Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={!!userToEdit}
        onOpenChange={(open) => {
          if (!open) {
            setUserToEdit(null);
          }
        }}
      >
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle className="font-black text-lg">Edit User Details</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Update name and username details for <strong className="text-foreground">{userToEdit?.full_name || userToEdit?.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!userToEdit) return;
              setIsEditingUser(true);
              try {
                const res = await updateUserAction(userToEdit.id, editFormData);
                if (res.ok) {
                  toast({
                    title: "User updated",
                    description: `Successfully updated user details.`,
                  });
                  setUserToEdit(null);
                  router.refresh();
                } else {
                  toast({
                    title: "Error",
                    description: res.error || "Failed to update user",
                    variant: "destructive",
                  });
                }
              } catch (err) {
                toast({
                  title: "Error",
                  description: "An unexpected error occurred",
                  variant: "destructive",
                });
              } finally {
                setIsEditingUser(false);
              }
            }}
            className="space-y-4 mt-2"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-first-name">First Name</Label>
                <Input
                  id="edit-first-name"
                  required
                  value={editFormData.firstName}
                  onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                  placeholder="John"
                  className="bg-black/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-last-name">Last Name</Label>
                <Input
                  id="edit-last-name"
                  required
                  value={editFormData.lastName}
                  onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                  placeholder="Doe"
                  className="bg-black/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                required
                value={editFormData.username}
                onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                placeholder="johndoe"
                className="bg-black/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email ID</Label>
              <Input
                id="edit-email"
                required
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                placeholder="email@example.com"
                className="bg-black/20"
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isEditingUser}
                onClick={() => {
                  setUserToEdit(null);
                }}
                className="border-white/10 hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isEditingUser}
                className="shine-btn font-bold"
              >
                {isEditingUser ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Note Dialog */}
      <Dialog
        open={isUploadNoteOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsUploadNoteOpen(false);
            setNoteUploadData({ title: "", description: "", fileType: "pdf", content: "" });
            setNoteFile(null);
          }
        }}
      >
        <DialogContent className="glass-strong max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-black text-lg">Publish New Note</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Provide study materials, notes, or references in PDF or Markdown format for students.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!noteUploadData.title.trim()) {
                toast({ title: "Validation Error", description: "Title is required", variant: "destructive" });
                return;
              }
              if (noteUploadData.fileType === "pdf" && !noteFile) {
                toast({ title: "Validation Error", description: "Please upload a PDF file", variant: "destructive" });
                return;
              }

              setIsSubmittingNote(true);
              try {
                const formData = new FormData();
                formData.append("title", noteUploadData.title);
                formData.append("description", noteUploadData.description);
                formData.append("fileType", noteUploadData.fileType);
                if (noteUploadData.fileType === "pdf" && noteFile) {
                  formData.append("file", noteFile);
                } else {
                  formData.append("content", noteUploadData.content);
                }

                const res = await uploadNoteAction(formData);
                if (res.ok) {
                  toast({ title: "Success", description: "Note published successfully" });
                  setIsUploadNoteOpen(false);
                  setNoteUploadData({ title: "", description: "", fileType: "pdf", content: "" });
                  setNoteFile(null);
                  router.refresh();
                } else {
                  toast({ title: "Error", description: res.error || "Failed to publish note", variant: "destructive" });
                }
              } catch (err) {
                console.error("Note upload error:", err);
                toast({ title: "Error", description: "Failed to publish note", variant: "destructive" });
              } finally {
                setIsSubmittingNote(false);
              }
            }}
            className="space-y-4 mt-2"
          >
            <div className="space-y-2">
              <Label htmlFor="note-title">Title</Label>
              <Input
                id="note-title"
                type="text"
                required
                value={noteUploadData.title}
                onChange={(e) => setNoteUploadData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Lecture 1: Calculus Basics"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note-desc">Description</Label>
              <Input
                id="note-desc"
                type="text"
                value={noteUploadData.description}
                onChange={(e) => setNoteUploadData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief summary of the note contents"
              />
            </div>

            <div className="space-y-2">
              <Label>File Format</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="noteFileType"
                    checked={noteUploadData.fileType === "pdf"}
                    onChange={() => setNoteUploadData(prev => ({ ...prev, fileType: "pdf" }))}
                    className="h-4 w-4 text-primary"
                  />
                  PDF Document (.pdf)
                </label>
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="noteFileType"
                    checked={noteUploadData.fileType === "markdown"}
                    onChange={() => setNoteUploadData(prev => ({ ...prev, fileType: "markdown" }))}
                    className="h-4 w-4 text-primary"
                  />
                  Markdown Text
                </label>
              </div>
            </div>

            {noteUploadData.fileType === "pdf" ? (
              <div className="space-y-2">
                <Label htmlFor="note-file">Upload PDF File</Label>
                <Input
                  id="note-file"
                  type="file"
                  accept=".pdf"
                  required
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files[0]) setNoteFile(files[0]);
                  }}
                  className="bg-transparent border border-input cursor-pointer"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="note-content">Markdown Content</Label>
                <Textarea
                  id="note-content"
                  rows={6}
                  value={noteUploadData.content}
                  onChange={(e) => setNoteUploadData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="# Lecture Notes..."
                  className="font-mono text-sm bg-transparent border border-input"
                />
              </div>
            )}

            <DialogFooter className="mt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmittingNote}
                onClick={() => {
                  setIsUploadNoteOpen(false);
                  setNoteUploadData({ title: "", description: "", fileType: "pdf", content: "" });
                  setNoteFile(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingNote}
                className="shine-btn font-bold"
              >
                {isSubmittingNote ? "Uploading..." : "Publish Note"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Note Confirmation Dialog */}
      <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive font-black">Delete Note Permanently?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed pt-2">
              Are you sure you want to delete <strong className="text-foreground">&quot;{noteToDelete?.title}&quot;</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel disabled={isDeletingNote}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
              disabled={isDeletingNote}
              onClick={async (e) => {
                e.preventDefault();
                if (!noteToDelete) return;
                setIsDeletingNote(true);
                try {
                  const res = await deleteNoteAction(noteToDelete.id);
                  if (res.ok) {
                    toast({ title: "Note deleted", description: `Successfully deleted "${noteToDelete.title}"` });
                    setNoteToDelete(null);
                    router.refresh();
                  } else {
                    toast({ title: "Error", description: res.error || "Failed to delete note", variant: "destructive" });
                  }
                } catch (err) {
                  toast({ title: "Error", description: "Failed to delete note", variant: "destructive" });
                } finally {
                  setIsDeletingNote(false);
                }
              }}
            >
              {isDeletingNote ? "Deleting..." : "Delete Note"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CSVCopyButton() {
  const [copied, setCopied] = useState(false);
  const sampleCsv = `type,question,marks,options,correct_answer,explanation,tolerance
mcq,"What is 2+2?",1,"4|5|6",4,"Basic math",
msq,"Prime numbers?",2,"2|3|4|5","2|3|5","2, 3, 5 are prime",
numeric,"Value of pi?",1,,3.14,"Constant",0.01`;

  const copy = () => {
    navigator.clipboard.writeText(sampleCsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 h-8 text-xs font-bold border-white/10 hover:bg-white/5"
      onClick={copy}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-green-500" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy Sample CSV
        </>
      )}
    </Button>
  );
}

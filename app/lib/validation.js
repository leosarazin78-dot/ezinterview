import { z } from "zod";

// ─── Auth ───
export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const signupSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string()
    .min(8, "Min 8 caractères")
    .regex(/[A-Z]/, "Min 1 majuscule")
    .regex(/[0-9]/, "Min 1 chiffre")
    .regex(/[^A-Za-z0-9]/, "Min 1 symbole (@, #, !, etc.)"),
});

// ─── Profile ───
export const profileSchema = z.object({
  firstName: z.string().min(1, "Prénom obligatoire").max(50, "Prénom trop long"),
  lastName: z.string().min(1, "Nom obligatoire").max(50, "Nom trop long"),
  username: z.string().max(50, "Nom d'utilisateur trop long").optional().default(""),
  phone: z.string().max(20).optional().default(""),
  city: z.string().max(100).optional().default(""),
  birthYear: z.string().max(4).optional().default(""),
});

// ─── Job Input ───
export const jobUrlSchema = z.object({
  jobUrl: z.string().optional().default(""),
  jobText: z.string().max(50000).optional().default(""),
  experienceLevel: z.enum(["Junior (0-2 ans)", "Confirmé (3-7 ans)", "Senior (8+ ans)"], {
    errorMap: () => ({ message: "Sélectionne ton niveau d'expérience" }),
  }),
  interviewDate: z.string().min(1, "Indique la date de ton entretien"),
}).refine(
  (data) => data.jobUrl || data.jobText,
  { message: "Colle l'URL de l'offre ou le texte de l'annonce", path: ["jobUrl"] }
);

// ─── CV Input ───
export const cvInputSchema = z.object({
  cvText: z.string().min(30, "CV trop court — colle au moins le texte principal").max(50000, "CV trop long"),
  linkedinUrl: z.string().url("URL LinkedIn invalide").optional().or(z.literal("")),
});

// ─── Plan Generation (server-side) ───
export const planRequestSchema = z.object({
  jobData: z.object({
    title: z.string().min(1),
    company: z.string().min(1),
  }).passthrough(),
  stats: z.object({
    matches: z.array(z.object({ label: z.string(), match: z.string() })).optional(),
  }).passthrough().optional(),
  intensity: z.enum(["Léger", "Standard", "Intensif"]).default("Standard"),
  experienceLevel: z.string().default("Confirmé (3-7 ans)"),
  interviewerRole: z.string().max(200).optional().default(""),
  interviewDate: z.string().optional().default(""),
  daysUntilInterview: z.number().min(1).max(30).optional(),
});

// ─── Feedback ───
export const feedbackSchema = z.object({
  type: z.enum(["Retour général", "Bug", "Nouvelle fonctionnalité", "Amélioration"]).default("Retour général"),
  message: z.string().min(3, "Message trop court").max(2000, "Message trop long"),
  rating: z.number().min(1).max(5).optional(),
  planId: z.string().optional(),
});

// ─── Report ───
export const reportSchema = z.object({
  planId: z.string().min(1, "Plan requis"),
  dayIndex: z.number().min(0),
  itemIndex: z.number().min(0),
  itemTitle: z.string().optional().default(""),
  reason: z.string().min(5, "Décris le problème (min 5 caractères)").max(1000),
});

// ─── Analyze Job (server-side) ───
export const analyzeJobServerSchema = z.object({
  jobUrl: z.string().optional().default(""),
  jobText: z.string().max(50000).optional().default(""),
  experienceLevel: z.string().optional().default(""),
}).refine(
  (data) => data.jobUrl || data.jobText,
  { message: "URL ou texte requis", path: ["jobUrl"] }
);

// ─── Profile API (server-side) ───
export const profileUpdateSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  username: z.string().max(50).optional().default(""),
  phone: z.string().max(20).optional().default(""),
  city: z.string().max(100).optional().default(""),
  birthYear: z.string().max(4).optional().default(""),
});

// ─── Helper : extract first Zod error message ───
export function zodFirstError(err) {
  if (err?.errors?.[0]?.message) return err.errors[0].message;
  if (err?.message) return err.message;
  return "Données invalides";
}

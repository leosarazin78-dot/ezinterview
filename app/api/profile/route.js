import { createServerClient } from "../../lib/supabase";
import { profileUpdateSchema } from "../../lib/validation";

// GET : récupérer le profil utilisateur
export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return Response.json({ error: "Non authentifié" }, { status: 401 });

    return Response.json({
      id: user.id,
      email: user.email,
      firstName: user.user_metadata?.firstName || "",
      lastName: user.user_metadata?.lastName || "",
      phone: user.user_metadata?.phone || "",
      city: user.user_metadata?.city || "",
      birthYear: user.user_metadata?.birthYear || "",
      profileComplete: !!user.user_metadata?.profileComplete,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PUT : mettre à jour le profil utilisateur
export async function PUT(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const body = await request.json();

    let validated;
    try {
      validated = profileUpdateSchema.parse(body);
    } catch (err) {
      return Response.json({ error: "Données invalides", details: err.errors?.map(e => e.message) }, { status: 400 });
    }

    const { firstName, lastName, phone, city, birthYear } = validated;

    if (!firstName?.trim() || !lastName?.trim()) {
      return Response.json({ error: "Nom et prénom obligatoires" }, { status: 400 });
    }

    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        firstName: firstName.trim().slice(0, 50),
        lastName: lastName.trim().slice(0, 50),
        phone: (phone || "").trim().slice(0, 20),
        city: (city || "").trim().slice(0, 100),
        birthYear: birthYear || null,
        profileComplete: true,
      },
    });

    if (error) throw error;
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

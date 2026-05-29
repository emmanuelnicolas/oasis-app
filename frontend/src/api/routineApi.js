const API_BASE_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || "https://oasis-backend-ia5h.onrender.com/api";

export async function getRoutines(token) {
  const response = await fetch(`${API_BASE_URL}/routines`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur chargement routines");
  }

  return await response.json();
}

export async function generateRoutines(token) {
  const response = await fetch(`${API_BASE_URL}/routines/generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Erreur génération routine");
  }

  return await response.json();
}
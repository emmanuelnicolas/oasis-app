const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "https://oasis-backend-ia5h.onrender.com/api"

export async function getProductHistory(token) {
  const response = await fetch(`${API_BASE_URL}/products`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur chargement historique");
  }

  return await response.json();
}
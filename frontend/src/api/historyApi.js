const API_BASE_URL = "http://localhost:8000/api";

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
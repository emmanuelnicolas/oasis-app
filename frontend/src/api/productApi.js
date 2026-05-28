const API_BASE_URL = "http://localhost:8000/api";

export async function analyzeProduct({
  token,
  name,
  ingredientsText,
  imageBase64,
}) {
  const response = await fetch(`${API_BASE_URL}/products/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name,
      ingredients_text: ingredientsText,
      image_base64: imageBase64,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Erreur analyse produit");
  }

  return await response.json();
}
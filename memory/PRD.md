# PRD - Personalized Skincare App (FR)

## Objectif
Application mobile (Expo React Native) qui propose des routines skincare personnalisées (matin/soir/hebdomadaire) selon le profil et les besoins de l'utilisateur.

## Fonctionnalités
- **Auth**: Email/password (JWT) + Google OAuth (Emergent)
- **Onboarding**: Questionnaire de peau (type, préoccupations, âge, sensibilité, allergies)
- **Analyse Selfie IA**: Photo selfie analysée par Gemini 2.5 Pro pour détecter type/problèmes
- **Routines IA**: Générées par Claude Sonnet 4.5 (matin, soir, hebdo) avec étapes détaillées
- **Suivi quotidien**: Cocher les étapes faites
- **Journal**: Photos de progression (base64)
- **Conseils saisonniers**: Astuces selon la saison/météo
- **Analyse Produit + Risques + Décision** (Gemini 2.5 Pro):
  - Entrée par photo INCI ET/OU texte INCI
  - Score 0-100, ingrédients pastillés (vert/orange/rouge)
  - Risques (acné, irritation, allergie, perturbateur, comédogène, parfum, alcool)
  - Compatibilité avec profil utilisateur
  - Décision finale (À utiliser / Avec précaution / À éviter) + justification
  - Critères d'alternatives (pas de marques inventées)
  - Disclaimer médical permanent
  - Fallback si photo illisible → demande texte INCI
  - Historique sauvegardé (user_id, product_name, input_type, ingredients_text, score, decision, risks, created_at)

## Stack
- Frontend: Expo Router, React Native
- Backend: FastAPI, MongoDB
- IA: Claude Sonnet 4.5 (text), Gemini 2.5 Pro (vision) via Emergent LLM key

## Design
- Aesthetic Organique & Earthy (Sage green #7E9A88, Sand #F7F5F0, Bone #FCFBF9)
- Fonts: Cormorant Garamond (titres) + Manrope (corps)
- Coins arrondis, ombres douces, ambiance premium française

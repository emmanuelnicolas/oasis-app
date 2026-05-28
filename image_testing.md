# Image Integration Testing Playbook

## Image Handling Rules
- Always use base64-encoded images (JPEG, PNG, WEBP only).
- Do not use SVG, BMP, HEIC, or animated GIF/APNG.
- Images must contain real visual features (not blank/uniform).
- Re-detect MIME after transformations.
- Resize large images to reasonable bounds.

## Test Endpoints
- POST /api/skin/analyze with `{ "image_base64": "<base64>" }`
  Expected: JSON with `skin_type`, `concerns[]`, `summary`.

export async function fetchSwims() {
  const response = await fetch('/swims.geojson');
  if (!response.ok) {
    throw new Error(`Failed to fetch swims.geojson: ${response.status}`);
  }
  return response.json();
}

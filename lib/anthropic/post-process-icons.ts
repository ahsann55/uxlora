export async function postProcessIcons(
  html: string,
  iconAuthorMap: Record<string, string>
): Promise<string> {
  // Find all data-icon placeholders
  const iconRegex = /<span\s+data-icon="([^"]+)"([^>]*)><\/span>/g;
  const matches = [...html.matchAll(iconRegex)];
  
  if (!matches.length) return html;

  // Get unique icon names
  const uniqueNames = [...new Set(matches.map(m => m[1]))];

  // Fetch all SVGs in parallel
  const svgMap: Record<string, string> = {};
  await Promise.all(uniqueNames.map(async (name) => {
    const author = iconAuthorMap[name];
    if (!author) return;
    try {
      const res = await fetch(
        `https://game-icons.net/icons/ffffff/transparent/1x1/${author}/${name}.svg`
      );
      if (!res.ok) return;
      const svg = await res.text();
      const pathMatch = svg.match(/<path[^>]*\/?>/g);
      if (!pathMatch) return;
      svgMap[name] = pathMatch.join("");
    } catch { /* skip */ }
  }));

  // Replace placeholders with inline SVGs
  let result = html;
  for (const match of matches) {
    const [full, name, attrs] = match;
    const paths = svgMap[name];
    if (!paths) continue;

    // Extract width/height from style if present
    const widthMatch = attrs.match(/width:\s*(\d+)px/);
    const heightMatch = attrs.match(/height:\s*(\d+)px/);
    const colorMatch = attrs.match(/data-icon-color="([^"]+)"/);
    const w = widthMatch?.[1] ?? "24";
    const h = heightMatch?.[1] ?? "24";
    const color = colorMatch?.[1] ?? "#ffffff";

    const coloredPaths = paths.replace(/fill="[^"]*"/g, `fill="${color}"`).replace(/<path(?!.*fill=)/g, `<path fill="${color}"`);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${w}" height="${h}" data-uxlora="vec:icon:game">${coloredPaths}</svg>`;
    result = result.replace(full, svg);
  }

  return result;
}
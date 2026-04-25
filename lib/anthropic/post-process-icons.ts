import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}

export async function postProcessIcons(
  html: string,
  iconAuthorMap: Record<string, string>
): Promise<string> {
  // Match <span data-icon="..."> with ANY content inside (including nested SVG
  // that the model drew despite instructions). We overwrite the entire span
  // content with the correct icon SVG.
  const iconRegex = /<span\b([^>]*?\bdata-icon="([^"]+)"[^>]*)>[\s\S]*?<\/span>/g;
  const matches = [...html.matchAll(iconRegex)];

  if (!matches.length) return html;

  // match[1] = full attributes string, match[2] = icon name
  const uniqueNames = [...new Set(matches.map(m => m[2]))];
  const svgMap: Record<string, string> = {};

  // ── Step 1: try DB first (svg_paths column) ──────────────
  try {
    const admin = getAdminClient();
    const { data: rows, error } = await admin
      .from("icon_libraries")
      .select("name, svg_paths")
      .in("name", uniqueNames);

    if (error) {
      console.warn(`[post-process-icons] DB lookup failed:`, error);
    } else if (rows) {
      for (const row of rows as Array<{ name: string; svg_paths: string | null }>) {
        if (row.svg_paths && row.svg_paths.length > 0) {
          svgMap[row.name] = row.svg_paths;
        }
      }
    }
  } catch (dbError) {
    console.warn(`[post-process-icons] DB query threw:`, dbError);
  }

  const dbHits = Object.keys(svgMap).length;
  const missingAfterDb = uniqueNames.filter(n => !svgMap[n]);

  // ── Step 2: network fallback for anything missing from DB ──
  if (missingAfterDb.length > 0) {
    console.warn(`[post-process-icons] ${missingAfterDb.length}/${uniqueNames.length} icons missing from DB, falling back to network fetch: ${missingAfterDb.join(", ")}`);

    await Promise.all(missingAfterDb.map(async (name) => {
      const author = iconAuthorMap[name];
      if (!author) {
        console.warn(`[post-process-icons] No author mapping for icon: ${name}`);
        return;
      }
      try {
        const url = `https://game-icons.net/icons/ffffff/transparent/1x1/${author}/${name}.svg`;
        const res = await fetch(url);
        if (!res.ok) {
          console.warn(`[post-process-icons] Fetch failed ${res.status} for ${name} at ${url}`);
          return;
        }
        const svg = await res.text();
        const pathMatch = svg.match(/<path[^>]*\/?>/g);
        if (!pathMatch) {
          console.warn(`[post-process-icons] No <path> in SVG response for ${name}. First 200 chars: ${svg.slice(0, 200)}`);
          return;
        }
        svgMap[name] = pathMatch.join("");
      } catch (fetchError) {
        console.warn(`[post-process-icons] Fetch exception for ${name}:`, fetchError);
      }
    }));
  }

  const totalHits = Object.keys(svgMap).length;
  console.log(`[post-process-icons] Resolved ${totalHits}/${uniqueNames.length} icons (${dbHits} from DB, ${totalHits - dbHits} from network)`);

  // ── Step 3: replace placeholders with inline SVGs ─────────
  let result = html;
  let replacedCount = 0;
  let missedCount = 0;

  for (const match of matches) {
    const [full, attrs, name] = match;
    const paths = svgMap[name];
    if (!paths) {
      missedCount++;
      continue;
    }

    const widthMatch = attrs.match(/width:\s*(\d+)px/);
    const heightMatch = attrs.match(/height:\s*(\d+)px/);
    const colorMatch = attrs.match(/data-icon-color="([^"]+)"/);
    const w = widthMatch?.[1] ?? "24";
    const h = heightMatch?.[1] ?? "24";
    const color = colorMatch?.[1] ?? "#ffffff";

    const coloredPaths = paths
      .replace(/fill="[^"]*"/g, `fill="${color}"`)
      .replace(/<path(?!.*fill=)/g, `<path fill="${color}"`);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${w}" height="${h}" data-uxlora="vec:icon:game">${coloredPaths}</svg>`;
    result = result.replace(full, svg);
    replacedCount++;
  }

  console.log(`[post-process-icons] Replaced ${replacedCount} placeholders, missed ${missedCount}`);
  return result;
}
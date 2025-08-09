import { type NextRequest, NextResponse } from "next/server"

// Enhanced metadata extractor (OG/meta + JSON-LD).
// Note: Cross-origin fetch can fail due to CORS in Next.js; clients should handle fallback.

const META_REGEXES = {
  title: [/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i, /<title[^>]*>([^<]+)<\/title>/i],
  description: [
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  ],
  image: [/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i],
  siteName: [/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["'][^>]*>/i],
}

function extract(html: string, key: keyof typeof META_REGEXES): string | null {
  for (const rx of META_REGEXES[key]) {
    const m = html.match(rx)
    if (m?.[1]) return m[1].trim()
  }
  return null
}

function parseJSONLD(html: string) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  const payloads: any[] = []
  for (const m of scripts) {
    try {
      const json = JSON.parse(m[1].trim())
      if (Array.isArray(json)) payloads.push(...json)
      else payloads.push(json)
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return payloads
}

function coalesce<T>(...vals: (T | null | undefined)[]): T | undefined {
  for (const v of vals) if (v !== undefined && v !== null && (typeof v !== "string" || v.trim() !== "")) return v as T
  return undefined
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }
    const res = await fetch(url, { redirect: "follow" })
    const html = await res.text()

    const title = extract(html, "title") || ""
    const description = extract(html, "description") || ""
    const image = extract(html, "image") || ""
    const siteName = extract(html, "siteName") || ""

    // JSON-LD extraction (Course/Product)
    const jsonld = parseJSONLD(html)
    let provider: string | undefined
    let author: string | undefined
    let level: string | undefined
    let rating: number | undefined
    let ratingCount: number | undefined
    let price: string | undefined
    let language: string | undefined
    let imageFromLD: string | undefined

    for (const node of jsonld) {
      const typeList = node?.["@type"]
      const types = Array.isArray(typeList) ? typeList : typeList ? [typeList] : []
      if (types.includes("Course") || types.includes("Product")) {
        provider =
          coalesce(
            node?.provider?.name,
            node?.brand?.name,
            node?.publisher?.name,
            node?.provider,
            node?.brand,
            siteName,
          ) || provider
        author = coalesce(node?.creator?.name, node?.author?.name, node?.instructor?.name, author)
        rating = Number.parseFloat(node?.aggregateRating?.ratingValue) || rating
        ratingCount = Number.parseInt(node?.aggregateRating?.ratingCount || node?.reviewCount, 10) || ratingCount
        price = coalesce(
          node?.offers?.priceCurrency && node?.offers?.price
            ? `${node.offers.priceCurrency} ${node.offers.price}`
            : undefined,
          node?.offers?.price,
          price,
        )
        language = coalesce(node?.inLanguage, language)
        imageFromLD = coalesce(
          typeof node?.image === "string" ? node.image : Array.isArray(node?.image) ? node.image[0] : undefined,
          imageFromLD,
        )
        level = coalesce(node?.educationalLevel, level)
      }
    }

    // Heuristic level detection
    if (!level) {
      const lvl = html.match(/\b(Beginner|Intermediate|Advanced)\b/i)?.[0]
      if (lvl) level = lvl
    }

    const bestImage = imageFromLD || image || ""

    const tags = Array.from(
      new Set([...(title ? title.split(/\s+/) : []), ...(description ? description.split(/\s+/) : [])]),
    )
      .map((t) => t.replace(/[^\w-]/g, "").toLowerCase())
      .filter((t) => t.length > 3)
      .slice(0, 8)

    // Udemy-specific hints
    if ((url.includes("udemy.com") || (provider || "").toLowerCase().includes("udemy")) && !provider) {
      provider = "Udemy"
    }

    return NextResponse.json({
      title: title || null,
      description: description || null,
      image: bestImage || null,
      tags,
      provider: provider || null,
      author: author || null,
      level: level || null,
      rating: typeof rating === "number" && !Number.isNaN(rating) ? rating : null,
      ratingCount: typeof ratingCount === "number" && !Number.isNaN(ratingCount) ? ratingCount : null,
      price: price || null,
      language: language || null,
      siteName: siteName || null,
    })
  } catch {
    return NextResponse.json({ error: "Fetch failed. Use manual entry." }, { status: 500 })
  }
}

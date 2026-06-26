import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase"; // Make sure this path is correct
import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const BLOG_API_SECRET = process.env.BLOG_API_KEY;

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}

function estimateReadTime(content: string): number {
  const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export async function POST(req: Request) {
  // Auth check
  const apiKey = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "");

  if (!BLOG_API_SECRET || apiKey !== BLOG_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized — invalid API key" }, { status: 401 });
  }

  try {
    const body = await req.json();
    let parsed = body;
    let rawText: string | null = null;

    // Smart Parse for OpenAI/n8n structures (same logic as yours)
    if (Array.isArray(body?.output)) {
      for (const outputItem of body.output) {
        if (Array.isArray(outputItem?.content)) {
          const textBlock = outputItem.content.find((c: any) => c.type === "output_text" || c.type === "text");
          if (textBlock?.text) { rawText = textBlock.text; break; }
        }
      }
    }
    if (!rawText && Array.isArray(body?.content)) {
      const textBlock = body.content.find((c: any) => c.type === "output_text" || c.type === "text");
      if (textBlock?.text) rawText = textBlock.text;
    }
    if (!rawText && Array.isArray(body?.choices)) {
      const firstChoice = body.choices[0];
      if (typeof firstChoice?.message?.content === "string") rawText = firstChoice.message.content;
    }
    if (!rawText && typeof body?.raw === "string") rawText = body.raw;

    // Parse raw text into JSON
    if (rawText) {
      const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch {
            return NextResponse.json({ error: "Could not parse JSON", received: cleaned.substring(0, 300) }, { status: 400 });
          }
        } else {
          return NextResponse.json({ error: "No JSON object found", received: cleaned.substring(0, 300) }, { status: 400 });
        }
      }
    }

    const { title, excerpt, content, coverImage, category, tags, author } = parsed;

    if (!title || !content || !excerpt) {
      return NextResponse.json({ error: "Missing required fields", received: Object.keys(parsed) }, { status: 400 });
    }

    const validCategories = ["city-guide", "hidden-gems", "food-drink", "neighborhoods", "seasonal", "history"];
    const postCategory = validCategories.includes(category) ? category : "city-guide";

    let slug = generateSlug(title);
    const postsRef = collection(db, "blog-posts");
    const slugQuery = query(postsRef, where("slug", "==", slug));
    const existing = await getDocs(slugQuery);

    if (!existing.empty) {
      const dateSuffix = new Date().toISOString().slice(0, 10);
      slug = `${slug}-${dateSuffix}`;
    }

    const postData = {
      title: title.trim(),
      slug,
      excerpt: excerpt.trim(),
      content: content.trim(),
      coverImage: coverImage || "",
      category: postCategory,
      tags: Array.isArray(tags) ? tags.map((t: string) => t.trim().toLowerCase()) : ["gothenburg"],
      author: author || "DateSpots",
      readTime: estimateReadTime(content),
      publishedAt: Timestamp.now(),
    };

    const docRef = await addDoc(postsRef, postData);

    return NextResponse.json({ success: true, id: docRef.id, slug, message: "Blog post created successfully" }, { status: 201 });

  } catch (error) {
    console.error("Error creating blog post:", error);
    return NextResponse.json({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

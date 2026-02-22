// pages/api/blog/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebase";
import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";

// ─── API Key Auth ─────────────────────────────
// Set BLOG_API_SECRET in your Vercel env vars
const BLOG_API_SECRET = process.env.BLOG_API_SECRET;

// ─── Slug Generator ───────────────────────────
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // remove special chars
    .replace(/\s+/g, "-") // spaces to hyphens
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-+|-+$/g, "") // trim hyphens
    .substring(0, 80); // max length
}

// ─── Estimate Read Time ───────────────────────
function estimateReadTime(content: string): number {
  const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200)); // ~200 wpm
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Only POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Auth check
  const apiKey =
    req.headers["x-api-key"] ||
    req.headers["authorization"]?.replace("Bearer ", "");
  if (!BLOG_API_SECRET || apiKey !== BLOG_API_SECRET) {
    return res.status(401).json({ error: "Unauthorized — invalid API key" });
  }

  try {
    // ─── Smart Parse ──────────────────────────
    // Accepts multiple formats:
    //   1. Clean JSON body: { "title": "...", "content": "..." }
    //   2. Raw string:      { "raw": "{...}" } or { "raw": "```json\n{...}\n```" }
    //   3. OpenAI Responses API format (full or partial):
    //      { "output": [{ "content": [{ "type": "output_text", "text": "{...}" }], "role": "assistant" }] }
    //      or just the message: { "content": [{ "type": "output_text", "text": "{...}" }] }

    let parsed = req.body;
    let rawText: string | null = null;

    // ── Detect format and extract raw JSON string ──

    // Format 3a: Full OpenAI Responses API — output[].content[].text
    if (Array.isArray(req.body?.output)) {
      for (const outputItem of req.body.output) {
        if (Array.isArray(outputItem?.content)) {
          const textBlock = outputItem.content.find(
            (c: any) => c.type === "output_text" || c.type === "text",
          );
          if (textBlock?.text) {
            rawText = textBlock.text;
            break;
          }
        }
      }
    }

    // Format 3b: Just the message object — content[].text
    if (!rawText && Array.isArray(req.body?.content)) {
      const textBlock = req.body.content.find(
        (c: any) => c.type === "output_text" || c.type === "text",
      );
      if (textBlock?.text) {
        rawText = textBlock.text;
      }
    }

    // Format 3c: OpenAI Chat Completions — choices[].message.content
    if (!rawText && Array.isArray(req.body?.choices)) {
      const firstChoice = req.body.choices[0];
      if (typeof firstChoice?.message?.content === "string") {
        rawText = firstChoice.message.content;
      }
    }

    // Format 2: Raw string
    if (!rawText && typeof req.body?.raw === "string") {
      rawText = req.body.raw;
    }

    // ── Parse the raw text into JSON ──
    if (rawText) {
      // Strip markdown code fences
      const cleaned = rawText
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/gi, "")
        .trim();

      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // Fallback: find first JSON object in the string
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsed = JSON.parse(match[0]);
          } catch {
            return res.status(400).json({
              error: "Could not parse JSON from response",
              received: cleaned.substring(0, 300),
            });
          }
        } else {
          return res.status(400).json({
            error: "No JSON object found in response",
            received: cleaned.substring(0, 300),
          });
        }
      }
    }

    // Format 1: If body already has title/content, parsed = req.body (default)

    const { title, excerpt, content, coverImage, category, tags, author } =
      parsed;

    // ─── Validation ─────────────────────────
    if (!title || !content || !excerpt) {
      return res.status(400).json({
        error: "Missing required fields: title, excerpt, content",
        received: Object.keys(parsed),
      });
    }

    const validCategories = [
      "city-guide",
      "hidden-gems",
      "food-drink",
      "neighborhoods",
      "seasonal",
      "history",
    ];

    const postCategory = validCategories.includes(category)
      ? category
      : "city-guide";

    // ─── Generate unique slug ───────────────
    let slug = generateSlug(title);

    // Check for duplicate slugs
    const postsRef = collection(db, "blog-posts");
    const slugQuery = query(postsRef, where("slug", "==", slug));
    const existing = await getDocs(slugQuery);

    if (!existing.empty) {
      // Append date to make unique
      const dateSuffix = new Date().toISOString().slice(0, 10);
      slug = `${slug}-${dateSuffix}`;
    }

    // ─── Create post ────────────────────────
    const postData = {
      title: title.trim(),
      slug,
      excerpt: excerpt.trim(),
      content: content.trim(), // HTML content
      coverImage: coverImage || "",
      category: postCategory,
      tags: Array.isArray(tags)
        ? tags.map((t: string) => t.trim().toLowerCase())
        : ["gothenburg"],
      author: author || "DateSpots",
      readTime: estimateReadTime(content),
      publishedAt: Timestamp.now(),
    };

    const docRef = await addDoc(postsRef, postData);

    return res.status(201).json({
      success: true,
      id: docRef.id,
      slug,
      message: "Blog post created successfully",
    });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

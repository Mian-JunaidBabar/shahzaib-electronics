import { NextResponse } from "next/server";
import { getTopSellers } from "@/lib/services/product.service";

// The homepage's WeeklyBestSellers section now calls getTopSellers()
// directly as a server component instead of fetching this endpoint client-
// side (see lib/services/product.service.ts for why). This route is kept
// as a thin wrapper in case any other consumer still depends on it.
export async function GET() {
  try {
    const data = await getTopSellers(5);
    return NextResponse.json({ data });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch top sellers" },
      { status: 500 },
    );
  }
}

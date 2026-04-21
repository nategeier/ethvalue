import { NextResponse } from "next/server";
import { fetchEthPrice } from "@/lib/coinbase";

export const revalidate = 30; // Revalidate every 30 seconds
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // `?fresh=1` bypasses the CDN cache so the very first paint never serves
  // stale-while-revalidate data (which can be up to 60s old).
  const fresh = new URL(request.url).searchParams.get("fresh") === "1";
  try {
    const price = await fetchEthPrice();
    return NextResponse.json(price, {
      headers: {
        "Cache-Control": fresh
          ? "no-store, must-revalidate"
          : "s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("ETH price fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ETH price" },
      { status: 500 }
    );
  }
}

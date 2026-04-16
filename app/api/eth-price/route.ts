import { NextResponse } from "next/server";
import { fetchEthPrice } from "@/lib/coinbase";

export const revalidate = 30; // Revalidate every 30 seconds

export async function GET() {
  try {
    const price = await fetchEthPrice();
    return NextResponse.json(price, {
      headers: {
        "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
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

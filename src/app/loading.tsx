"use client";

import React from "react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Hero Skeleton */}
        <div className="h-[300px] sm:h-[450px] w-full rounded-[48px] bg-white border border-gray-100 animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-50/50 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>

        {/* Categories Skeleton */}
        <div className="space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 min-w-[160px] rounded-[32px] bg-white border border-gray-100 animate-pulse" />
            ))}
          </div>
        </div>

        {/* Product Grid Skeleton */}
        <div className="space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded-full animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-[4/5] rounded-[40px] bg-white border border-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

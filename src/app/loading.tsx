"use client";

export default function Loading() {
  return (
    <div className="min-h-[calc(100svh-5rem)] bg-[var(--background)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="h-[320px] animate-pulse rounded-[3rem] bg-[linear-gradient(135deg,rgba(255,216,77,0.22)_0%,rgba(242,106,46,0.14)_100%)]" />

        <div className="space-y-5">
          <div className="h-4 w-36 animate-pulse rounded-full bg-white/70" />
          <div className="grid gap-6 lg:grid-cols-3">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className="aspect-[4/3] animate-pulse rounded-[2rem] bg-white/70"
              />
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="h-4 w-48 animate-pulse rounded-full bg-white/70" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="aspect-[4/4.85] animate-pulse rounded-[2rem] bg-white/70"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

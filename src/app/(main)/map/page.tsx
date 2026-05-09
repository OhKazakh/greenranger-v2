import { DynamicMap } from "@/components/map/DynamicMap";

// Map page takes all remaining viewport height below the navbar (h-14 = 3.5rem).
// Use 100dvh (dynamic viewport height) so iOS Safari accounts for its
// retractable browser chrome — plain 100vh causes the bottom to be hidden.
export default function MapPage() {
  return (
    <div
      className="w-full"
      style={{ height: "calc(100dvh - 3.5rem)" }}
    >
      <DynamicMap />
    </div>
  );
}

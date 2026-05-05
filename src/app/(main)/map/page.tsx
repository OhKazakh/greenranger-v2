import { DynamicMap } from "@/components/map/DynamicMap";

// Map page takes all remaining viewport height below the navbar (h-14 = 3.5rem)
export default function MapPage() {
  return (
    <div className="w-full" style={{ height: "calc(100vh - 3.5rem)" }}>
      <DynamicMap />
    </div>
  );
}

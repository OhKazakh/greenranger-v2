import { redirect } from "next/navigation";

// Root page → redirect to map (the core experience)
export default function RootPage() {
  redirect("/map");
}

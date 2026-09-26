import { EmptyState } from "@/components/ui/States";

export default function NotFound() {
  return <EmptyState title="This title is not here." body="The movie ID may be invalid." href="/movies" action="Browse movies" />;
}

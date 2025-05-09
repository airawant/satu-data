import { redirect } from "next/navigation"

// Nonaktifkan prerendering untuk halaman admin
export const dynamic = "force-dynamic";
export const fetchCache = 'force-no-store';
export const generateStaticParams = () => [];

export default function AdminPage() {
  redirect("/admin/upload-dataset")
}

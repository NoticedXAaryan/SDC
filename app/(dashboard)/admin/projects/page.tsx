import { redirect } from "next/navigation";

export default function AdminProjectsRedirect() {
  redirect("/manage/projects");
}

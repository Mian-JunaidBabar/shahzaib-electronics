import { getCategoryAction } from "@/app/actions/categoryActions";
import { CategoryForm } from "@/components/admin/category-form";
import { notFound } from "next/navigation";

interface EditCategoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCategoryPage({
  params,
}: EditCategoryPageProps) {
  const { id } = await params;

  const result = await getCategoryAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="p-6">
      <CategoryForm initialData={result.data} />
    </div>
  );
}

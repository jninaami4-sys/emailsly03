import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  adminListProducts,
  adminUpsertProduct,
  adminDeleteProduct,
  type DbProduct,
} from "@/lib/products-cms.functions";

type FormState = {
  id?: string;
  slug: string;
  title: string;
  category: string;
  category_color: "violet" | "coral" | "emerald";
  records: number;
  price: number;
  compare_at_price: number | null;
  file_format: string;
  geography: string;
  description: string;
  fields: string; // comma separated in editor
  sample_note: string;
  featured: boolean;
  cover_image: string;
  published: boolean;
  sort_order: number;
};

const EMPTY: FormState = {
  slug: "",
  title: "",
  category: "B2B Leads",
  category_color: "violet",
  records: 1000,
  price: 49,
  compare_at_price: null,
  file_format: "CSV",
  geography: "Global",
  description: "",
  fields: "Name, Email, Company, LinkedIn",
  sample_note: "Free 10-row sample available on request",
  featured: false,
  cover_image: "",
  published: true,
  sort_order: 0,
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toFormState(p: DbProduct): FormState {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    category: p.category,
    category_color: p.categoryColor,
    records: p.records,
    price: p.price,
    compare_at_price: p.compareAtPrice ?? null,
    file_format: p.fileFormat,
    geography: p.geography,
    description: p.description,
    fields: (p.fields || []).join(", "),
    sample_note: p.sampleNote ?? "",
    featured: !!p.featured,
    cover_image: p.coverImage ?? "",
    published: p.published,
    sort_order: p.sortOrder,
  };
}

const CATEGORIES = [
  "B2B Leads",
  "SaaS Leads",
  "Ecommerce Leads",
  "Executive Lists",
  "Startup Founders",
  "Real Estate Agents",
  "Healthcare Providers",
];

export function ProductsAdmin() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListProducts);
  const upsertFn = useServerFn(adminUpsertProduct);
  const deleteFn = useServerFn(adminDeleteProduct);

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => listFn(),
  });

  const [form, setForm] = useState<FormState>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!products) return [];
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [products, search]);

  const upsertMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      upsertFn({ data: payload as never }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["public-products"] });
      toast.success(editing ? "Product updated" : "Product created");
      setForm(EMPTY);
      setEditing(false);
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["public-products"] });
      toast.success("Product deleted");
      if (editing) {
        setForm(EMPTY);
        setEditing(false);
      }
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Failed to delete"),
  });

  function handleSave() {
    if (!form.title.trim()) return toast.error("Title required");
    const slug = form.slug.trim() || slugify(form.title);
    const fields = form.fields
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    upsertMut.mutate({
      id: form.id,
      slug,
      title: form.title.trim(),
      category: form.category,
      category_color: form.category_color,
      records: Number(form.records) || 0,
      price: Number(form.price) || 0,
      compare_at_price:
        form.compare_at_price == null || Number.isNaN(Number(form.compare_at_price))
          ? null
          : Number(form.compare_at_price),
      file_format: form.file_format || "CSV",
      geography: form.geography || "Global",
      description: form.description,
      fields,
      sample_note: form.sample_note.trim() ? form.sample_note.trim() : null,
      featured: form.featured,
      cover_image: form.cover_image.trim() ? form.cover_image.trim() : null,
      published: form.published,
      sort_order: Number(form.sort_order) || 0,
    });
  }

  function startEdit(p: DbProduct) {
    setForm(toFormState(p));
    setEditing(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startNew() {
    setForm(EMPTY);
    setEditing(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Products</h2>
          <p className="text-sm text-muted-foreground font-semibold">
            Add, edit, and delete products shown on the store and homepage.
          </p>
        </div>
        <button
          onClick={startNew}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
        >
          + New product
        </button>
      </div>

      {/* Editor */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black">
            {editing ? "Edit product" : "Create product"}
          </h3>
          {editing && form.id && (
            <button
              onClick={() => {
                if (confirm("Delete this product? This cannot be undone.")) {
                  deleteMut.mutate(form.id!);
                }
              }}
              disabled={deleteMut.isPending}
              className="text-sm font-bold text-destructive hover:underline"
            >
              Delete
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  title: e.target.value,
                  slug: editing ? f.slug : slugify(e.target.value),
                }))
              }
              className="admin-input"
              placeholder="e.g. Series-A Founders — 1,200 Contacts"
            />
          </Field>
          <Field label="Slug (URL)">
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
              className="admin-input"
              placeholder="series-a-founders"
            />
          </Field>

          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="admin-input"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category color">
            <select
              value={form.category_color}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  category_color: e.target.value as FormState["category_color"],
                }))
              }
              className="admin-input"
            >
              <option value="violet">Violet</option>
              <option value="coral">Coral</option>
              <option value="emerald">Emerald</option>
            </select>
          </Field>

          <Field label="Records">
            <input
              type="number"
              min={0}
              value={form.records}
              onChange={(e) =>
                setForm((f) => ({ ...f, records: Number(e.target.value) }))
              }
              className="admin-input"
            />
          </Field>
          <Field label="Price (USD)">
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
              className="admin-input"
            />
          </Field>

          <Field label="Compare-at price (optional)">
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.compare_at_price ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  compare_at_price: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              className="admin-input"
              placeholder="e.g. 199"
            />
          </Field>
          <Field label="File format">
            <input
              value={form.file_format}
              onChange={(e) => setForm((f) => ({ ...f, file_format: e.target.value }))}
              className="admin-input"
            />
          </Field>

          <Field label="Geography">
            <input
              value={form.geography}
              onChange={(e) => setForm((f) => ({ ...f, geography: e.target.value }))}
              className="admin-input"
            />
          </Field>
          <Field label="Sort order (lower = first)">
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))
              }
              className="admin-input"
            />
          </Field>

          <Field label="Cover image URL" className="md:col-span-2">
            <input
              value={form.cover_image}
              onChange={(e) => setForm((f) => ({ ...f, cover_image: e.target.value }))}
              className="admin-input"
              placeholder="https://... (upload via Product Covers or paste any URL)"
            />
          </Field>

          <Field label="Fields (comma separated)" className="md:col-span-2">
            <input
              value={form.fields}
              onChange={(e) => setForm((f) => ({ ...f, fields: e.target.value }))}
              className="admin-input"
              placeholder="Name, Email, Company, LinkedIn"
            />
          </Field>

          <Field label="Description" className="md:col-span-2">
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="admin-input min-h-24"
              placeholder="One or two sentences describing this list."
            />
          </Field>

          <Field label="Sample note" className="md:col-span-2">
            <input
              value={form.sample_note}
              onChange={(e) => setForm((f) => ({ ...f, sample_note: e.target.value }))}
              className="admin-input"
              placeholder="Free 10-row sample available on request"
            />
          </Field>

          <label className="flex items-center gap-2 font-bold">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
            />
            Featured on homepage
          </label>
          <label className="flex items-center gap-2 font-bold">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
            />
            Published (visible to customers)
          </label>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={upsertMut.isPending}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {upsertMut.isPending ? "Saving..." : editing ? "Save changes" : "Create product"}
          </button>
          {editing && (
            <button
              onClick={startNew}
              className="rounded-lg border border-border px-4 py-2 text-sm font-bold hover:bg-secondary"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-lg font-black">All products ({products?.length ?? 0})</h3>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, slug, category..."
            className="admin-input max-w-xs"
          />
        </div>

        {isLoading ? (
          <p className="text-sm font-bold text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm font-bold text-muted-foreground">
            No products yet. Create one above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-2 font-black">Title</th>
                  <th className="p-2 font-black">Category</th>
                  <th className="p-2 font-black">Records</th>
                  <th className="p-2 font-black">Price</th>
                  <th className="p-2 font-black">Status</th>
                  <th className="p-2 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/40">
                    <td className="p-2 font-bold">
                      <div>{p.title}</div>
                      <div className="text-xs text-muted-foreground font-semibold">/{p.slug}</div>
                    </td>
                    <td className="p-2 font-semibold">{p.category}</td>
                    <td className="p-2 font-semibold">{p.records.toLocaleString()}</td>
                    <td className="p-2 font-semibold">${p.price}</td>
                    <td className="p-2 font-semibold">
                      {p.published ? (
                        <span className="text-emerald-500">Live</span>
                      ) : (
                        <span className="text-muted-foreground">Draft</span>
                      )}
                      {p.featured && <span className="ml-2 text-primary">★ Featured</span>}
                    </td>
                    <td className="p-2 text-right">
                      <button
                        onClick={() => startEdit(p)}
                        className="mr-3 font-bold text-primary hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${p.title}"?`)) deleteMut.mutate(p.id);
                        }}
                        className="font-bold text-destructive hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .admin-input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(255 255 255 / 0.10);
          background: rgb(255 255 255 / 0.03);
          padding: 0.5rem 0.75rem;
          font-size: 13px;
          color: inherit;
          outline: none;
        }
        .admin-input:focus {
          border-color: hsl(var(--primary) / 0.6);
          background: rgb(255 255 255 / 0.05);
        }
        .admin-input::placeholder { color: rgb(255 255 255 / 0.30); }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

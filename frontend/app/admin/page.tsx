"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/components/providers/AuthProvider";

interface Project {
  _id?: string;
  title: string;
  category: string;
  image: string;
  description: string;
  isActive: boolean;
  order: number;
}

const projectSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  category: z.string().min(1, "Danh mục không được để trống"),
  image: z.string().url("URL hình ảnh không hợp lệ"),
  description: z.string().min(10, "Mô tả phải có ít nhất 10 ký tự"),
  isActive: z.boolean(),
  order: z.number().min(0),
});

type ProjectFormData = z.infer<typeof projectSchema>;

function AdminPageContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { token, logout } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      isActive: true,
      order: 0,
    },
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (editingProject) {
      setValue("title", editingProject.title);
      setValue("category", editingProject.category);
      setValue("image", editingProject.image);
      setValue("description", editingProject.description);
      setValue("isActive", editingProject.isActive);
      setValue("order", editingProject.order);
      setShowForm(true);
    }
  }, [editingProject, setValue]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else if (response.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn");
        logout();
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách dự án");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProjectFormData) => {
    try {
      const url = editingProject
        ? `${process.env.NEXT_PUBLIC_API_URL}/projects/${editingProject._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/projects`;

      const method = editingProject ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Lưu dự án thất bại");
      }

      toast.success(
        editingProject ? "Cập nhật thành công!" : "Tạo dự án thành công!"
      );
      reset();
      setEditingProject(null);
      setShowForm(false);
      fetchProjects();
    } catch (error) {
      toast.error("Lỗi khi lưu dự án");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa dự án này?")) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Xóa dự án thất bại");
      }

      toast.success("Xóa dự án thành công!");
      fetchProjects();
    } catch (error) {
      toast.error("Lỗi khi xóa dự án");
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
  };

  const handleCancel = () => {
    reset();
    setEditingProject(null);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-background-dark text-white py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Quản Lý Dự Án</h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={logout}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
            >
              Đăng Xuất
            </button>
            <button
              onClick={() => {
                setEditingProject(null);
                reset();
                setShowForm(!showForm);
              }}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              {showForm ? "Đóng Form" : "Thêm Dự Án Mới"}
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white/5 rounded-xl p-6 mb-8 border border-white/10">
            <h2 className="text-xl font-bold mb-4">
              {editingProject ? "Chỉnh Sửa Dự Án" : "Thêm Dự Án Mới"}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tiêu Đề *
                  </label>
                  <input
                    {...register("title")}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập tiêu đề dự án"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Danh Mục *
                  </label>
                  <input
                    {...register("category")}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ví dụ: API Development"
                  />
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.category.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  URL Hình Ảnh *
                </label>
                <input
                  {...register("image")}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://example.com/image.jpg"
                />
                {errors.image && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.image.message}
                  </p>
                )}
                {watch("image") && (
                  <div className="mt-4">
                    <p className="text-sm text-text-dark-secondary mb-2">
                      Preview:
                    </p>
                    <div className="w-full h-48 rounded-lg overflow-hidden border border-white/10">
                      <img
                        src={watch("image")}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Mô Tả *
                </label>
                <textarea
                  {...register("description")}
                  rows={4}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Nhập mô tả dự án"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Thứ Tự
                  </label>
                  <input
                    type="number"
                    {...register("order", { valueAsNumber: true })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("isActive")}
                      className="w-5 h-5 rounded bg-white/5 border-white/10 text-primary focus:ring-primary"
                    />
                    <span>Hiển thị trên website</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {editingProject ? "Cập Nhật" : "Tạo Mới"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Projects List */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-bold mb-4">
            Danh Sách Dự Án ({projects.length})
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-text-dark-secondary">Đang tải...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-dark-secondary">Chưa có dự án nào.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4">Thứ Tự</th>
                    <th className="text-left py-3 px-4">Tiêu Đề</th>
                    <th className="text-left py-3 px-4">Danh Mục</th>
                    <th className="text-left py-3 px-4">Trạng Thái</th>
                    <th className="text-left py-3 px-4">Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr
                      key={project._id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4">{project.order}</td>
                      <td className="py-3 px-4 font-medium">{project.title}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-primary/20 text-primary rounded text-sm">
                          {project.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            project.isActive
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {project.isActive ? "Hiển thị" : "Ẩn"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(project)}
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors text-sm"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() =>
                              project._id && handleDelete(project._id)
                            }
                            className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-sm"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminPageContent />
    </ProtectedRoute>
  );
}

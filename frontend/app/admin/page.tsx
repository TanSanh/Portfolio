"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import Image from "next/image";
import { useAuth } from "@/components/providers/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminShell } from "@/components/admin/AdminShell";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

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
  image: z.string().min(1, "Hình ảnh không được để trống").or(z.literal("")),
  description: z.string().min(10, "Mô tả phải có ít nhất 10 ký tự"),
  isActive: z.boolean(),
  order: z.number().min(0, "Thứ tự không được nhỏ hơn 0"),
});

type ProjectFormData = z.infer<typeof projectSchema>;

function AdminPageContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
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
      image: "",
      isActive: true,
      order: 0,
    },
  });

  useEffect(() => {
    if (editingProject) {
      setValue("title", editingProject.title);
      setValue("category", editingProject.category);
      setValue("image", editingProject.image);
      setValue("description", editingProject.description);
      setValue("isActive", editingProject.isActive);
      setValue("order", editingProject.order);
      setImagePreview(editingProject.image);
      setPreviewError(false);
      setShowForm(true);
    } else {
      setImagePreview(null);
      setPreviewError(false);
    }
  }, [editingProject, setValue]);

  const fetchProjects = useCallback(async () => {
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
  }, [token, logout]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  function clearSelectedImage() {
    if (selectedImageFile?.previewUrl) {
      URL.revokeObjectURL(selectedImageFile.previewUrl);
    }
    setSelectedImageFile(null);
    setPreviewError(false);
  }

  function handleImageSelect(file: File) {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File quá lớn. Vui lòng chọn file nhỏ hơn 20MB");
      return;
    }

    if (!file.type.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
      toast.error("Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, webp)");
      return;
    }

    if (selectedImageFile?.previewUrl) {
      URL.revokeObjectURL(selectedImageFile.previewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedImageFile({ file, previewUrl });
    setImagePreview(previewUrl);
    setPreviewError(false);
    setImagePreview(previewUrl);
    setPreviewError(false);
    setValue("image", "");
    toast.success("Ảnh đã được chọn, nhấn Tạo Mới để tải lên");
  }

  const uploadSelectedImage = async (): Promise<string | null> => {
    if (!selectedImageFile?.file) return null;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedImageFile.file);
      const uploadUrl = `${process.env.NEXT_PUBLIC_API_URL}/projects/upload`;
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Upload thất bại");
      }
      const data = await response.json();
      return `${process.env.NEXT_PUBLIC_API_URL}${data.url}`.trim();
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (formData: ProjectFormData) => {
    try {
      setSaving(true);
      let imageUrl = formData.image?.trim() || "";

      if (selectedImageFile) {
        try {
          const uploadedUrl = await uploadSelectedImage();
          if (!uploadedUrl) {
            throw new Error("Upload thất bại");
          }
          imageUrl = uploadedUrl;
        } catch (error) {
          toast.error("Không thể upload ảnh. Vui lòng thử lại.");
          return;
        }
      }

      if (!imageUrl) {
        toast.error("Vui lòng chọn ảnh hoặc nhập URL hình ảnh");
        return;
      }

      const payload = { ...formData, image: imageUrl };

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
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Lưu dự án thất bại");
      }

      toast.success(
        editingProject ? "Cập nhật thành công!" : "Tạo dự án thành công!"
      );
      clearSelectedImage();
      setImagePreview(null);
      setPreviewError(false);
      reset();
      setEditingProject(null);
      setShowForm(false);
      fetchProjects();
    } catch (error) {
      toast.error("Lỗi khi lưu dự án");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setProjectToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/projects/${projectToDelete}`,
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
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    } catch (error) {
      toast.error("Lỗi khi xóa dự án");
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    }
  };

  function handleEdit(project: Project) {
    clearSelectedImage();
    setEditingProject(project);
  }

  function handleCancel() {
    reset();
    setEditingProject(null);
    setShowForm(false);
    setImagePreview(null);
    setPreviewError(false);
    clearSelectedImage();
  }

  function handleAddProject() {
    clearSelectedImage();
    setEditingProject(null);
    reset();
    setShowForm(true);
  }

  return (
    <AdminShell
      title="Quản Lý Dự Án"
      description="Theo dõi, chỉnh sửa và sắp xếp các dự án hiển thị trên website cá nhân."
    >
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCancel}
          />
          <div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-[#0d1426] rounded-2xl p-4 sm:p-6 border border-white/10 shadow-2xl shadow-black/70 my-auto"
            data-lenis-prevent
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingProject ? "Chỉnh Sửa Dự Án" : "Thêm Dự Án Mới"}
              </h2>
              <button
                onClick={handleCancel}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Đóng"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tiêu Đề *
                  </label>
                  <input
                    {...register("title")}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/70"
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
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/70"
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
                  Hình Ảnh *
                </label>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          handleImageSelect(file);
                          e.target.value = "";
                        }}
                        disabled={uploading}
                      />
                      <div className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        {uploading ? "Đang tải lên..." : "Chọn ảnh từ máy"}
                      </div>
                    </label>
                    <input
                      type="text"
                      {...register("image")}
                      className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/70"
                      placeholder="Hoặc nhập URL hình ảnh"
                      onChange={(e) => {
                        const url = e.target.value.trim();
                        if (selectedImageFile) {
                          clearSelectedImage();
                        }
                        setValue("image", url);
                        setImagePreview(url);
                        setPreviewError(false);
                      }}
                    />
                  </div>
                  {errors.image && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.image.message}
                    </p>
                  )}
                  {(() => {
                    const previewUrl =
                      selectedImageFile?.previewUrl ||
                      imagePreview ||
                      watch("image");
                    return previewUrl ? (
                      <div className="mt-4">
                        <p className="text-sm text-white/60 mb-2">Preview:</p>
                        <div className="w-full max-w-md max-h-40 rounded-lg overflow-hidden border border-white/10 bg-black/20 relative group flex items-center justify-center mx-auto">
                          {!previewError ? (
                            <Image
                              key={previewUrl}
                              src={previewUrl}
                              alt="Preview"
                              fill
                              unoptimized
                              sizes="(max-width: 768px) 80vw, 400px"
                              className="object-contain"
                              onError={() => setPreviewError(true)}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">
                              Không thể tải ảnh
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              clearSelectedImage();
                              setValue("image", "");
                              setImagePreview(null);
                              setPreviewError(false);
                            }}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/90 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                            aria-label="Xóa ảnh"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Mô Tả *
                </label>
                <textarea
                  {...register("description")}
                  rows={4}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/70 resize-none"
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
                    min="0"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/70"
                    placeholder="0"
                  />
                  {errors.order && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.order.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Trạng Thái
                  </label>
                  <div className="flex items-center h-12">
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
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving
                    ? "Đang lưu..."
                    : editingProject
                    ? "Cập Nhật"
                    : "Tạo Mới"}
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
        </div>
      )}

      <div className="bg-white/5 rounded-2xl p-4 sm:p-6 border border-white/10 shadow-inner shadow-black/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-sm text-white/60">Danh sách dự án</p>
            <h2 className="text-xl sm:text-2xl font-bold">
              Hiện có ({projects.length})
            </h2>
          </div>
          <button
            onClick={handleAddProject}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors w-full sm:w-auto"
          >
            <span className="text-lg leading-none">+</span>
            Thêm dự án
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-white/60">Đang tải dữ liệu...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60">Chưa có dự án nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white/10 text-sm text-white/60">
                    <th className="text-left py-3 px-2 sm:px-4 whitespace-nowrap">
                      Thứ Tự
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 whitespace-nowrap">
                      Tiêu Đề
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 whitespace-nowrap">
                      Danh Mục
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 whitespace-nowrap">
                      Trạng Thái
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 whitespace-nowrap">
                      Thao Tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr
                      key={project._id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-2 sm:px-4 text-white/80 text-sm">
                        {project.order}
                      </td>
                      <td className="py-3 px-2 sm:px-4 font-semibold text-sm">
                        <div className="max-w-[150px] sm:max-w-none truncate">
                          {project.title}
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs sm:text-sm font-medium">
                          {project.category}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs sm:text-sm font-semibold ${
                            project.isActive
                              ? "bg-green-500/15 text-green-400"
                              : "bg-red-500/15 text-red-400"
                          }`}
                        >
                          {project.isActive ? "Hiển thị" : "Ẩn"}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(project)}
                            className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
                            aria-label="Sửa"
                            title="Sửa"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              project._id && handleDelete(project._id)
                            }
                            className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                            aria-label="Xóa"
                            title="Xóa"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Xóa dự án"
        message="Bạn có chắc chắn muốn xóa dự án này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        onConfirm={confirmDeleteProject}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setProjectToDelete(null);
        }}
      />
    </AdminShell>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminPageContent />
    </ProtectedRoute>
  );
}

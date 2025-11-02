import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, FileText, Image, Trash2, Download } from "lucide-react";
import { motion } from "framer-motion";

interface UploadedFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  description: string | null;
  created_at: string;
}

const PersonalUploader = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    fetchFiles();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email === "yanzeyucq@163.com") {
      setUser(user);
    }
    setLoading(false);
  };

  const fetchFiles = async () => {
    const { data, error } = await supabase
      .from("personal_uploads")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setFiles(data);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);

    try {
      // Upload to storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("personal-uploads")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save to database
      const { error: dbError } = await supabase.from("personal_uploads").insert({
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        description: description || null,
      });

      if (dbError) throw dbError;

      toast.success(t("Upload Successful", "上传成功"));

      setDescription("");
      fetchFiles();
    } catch (error: any) {
      toast.error(t("Upload Failed", "上传失败") + ": " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string, filePath: string) => {
    try {
      // Delete from storage
      await supabase.storage.from("personal-uploads").remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from("personal_uploads")
        .delete()
        .eq("id", fileId);

      if (error) throw error;

      toast.success(t("Deleted", "已删除"));

      fetchFiles();
    } catch (error: any) {
      toast.error(t("Delete Failed", "删除失败") + ": " + error.message);
    }
  };

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage.from("personal-uploads").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-6"
    >
      <Card className="bg-cosmic-800/30 border-cosmic-700">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-cosmic-50 mb-4">
            {t("Personal Portfolio", "个人作品集")}
          </h3>

          {/* Upload Section */}
          <div className="space-y-4 mb-6">
            <Textarea
              placeholder={t("Add description (optional)", "添加描述（可选）")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-cosmic-900/50 border-cosmic-600 text-cosmic-50"
            />
            <label htmlFor="file-upload">
              <div className="cursor-pointer">
                <Button
                  disabled={uploading}
                  className="w-full"
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? t("Uploading...", "上传中...") : t("Upload File", "上传文件")}
                </Button>
              </div>
            </label>
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="*/*"
            />
          </div>

          {/* Files Grid */}
          {files.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-cosmic-200">
                {t("Uploaded Files", "已上传文件")} ({files.length})
              </h4>
              <div className="grid gap-3">
                {files.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-3 bg-cosmic-900/50 rounded-lg border border-cosmic-700 hover:border-cosmic-600 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {file.file_type.startsWith("image/") ? (
                        <Image className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      ) : (
                        <FileText className="w-5 h-5 text-cosmic-300 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-cosmic-50 truncate">
                          {file.file_name}
                        </p>
                        {file.description && (
                          <p className="text-xs text-cosmic-400 truncate">
                            {file.description}
                          </p>
                        )}
                        <p className="text-xs text-cosmic-500">
                          {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(getPublicUrl(file.file_path), "_blank")}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(file.id, file.file_path)}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PersonalUploader;

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Image, Trash2, Download, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [user, setUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [description, setDescription] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.email === "yanzeyucq@163.com") {
        loadFiles();
      } else {
        setLoading(false);
      }
    });
  }, []);

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from("personal_uploads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error("Error loading files:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Maximum file size is 20MB",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("personal-uploads")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { error: dbError } = await supabase
        .from("personal_uploads")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          description: description || null,
        });

      if (dbError) throw dbError;

      toast.success("Upload successful", {
        description: "Your file has been uploaded",
      });

      setDescription("");
      loadFiles();
    } catch (error: any) {
      toast.error("Upload failed", {
        description: error.message,
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDelete = async (fileId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("personal-uploads")
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("personal_uploads")
        .delete()
        .eq("id", fileId);

      if (dbError) throw dbError;

      toast.success("File deleted", {
        description: "Your file has been removed",
      });

      loadFiles();
    } catch (error: any) {
      toast.error("Delete failed", {
        description: error.message,
      });
    }
  };

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from("personal-uploads")
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <Image className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  if (user?.email !== "yanzeyucq@163.com") {
    return null;
  }

  return (
    <motion.div
      className="mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="p-6 bg-cosmic-900/50 border-cosmic-700">
        <h3 className="text-xl font-semibold text-cosmic-50 mb-4">
          Portfolio & Papers
        </h3>
        
        {/* Upload Section */}
        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="description" className="text-cosmic-200">
              Description (optional)
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this file..."
              className="bg-cosmic-800 border-cosmic-700 text-cosmic-50"
            />
          </div>

          <div>
            <Label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 bg-cosmic-600 hover:bg-cosmic-500 text-white rounded-lg transition-colors w-fit">
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>{uploading ? "Uploading..." : "Upload File"}</span>
              </div>
            </Label>
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <p className="text-xs text-cosmic-400 mt-2">
              Supported: Images, PDFs, Documents (Max 20MB)
            </p>
          </div>
        </div>

        {/* Files List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-cosmic-400" />
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between p-4 bg-cosmic-800/50 rounded-lg border border-cosmic-700"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-cosmic-300">
                      {getFileIcon(file.file_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-cosmic-50 font-medium truncate">
                        {file.file_name}
                      </p>
                      {file.description && (
                        <p className="text-sm text-cosmic-400 truncate">
                          {file.description}
                        </p>
                      )}
                      <p className="text-xs text-cosmic-500">
                        {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(getFileUrl(file.file_path), "_blank")}
                      className="text-cosmic-300 hover:text-cosmic-50"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(file.id, file.file_path)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {files.length === 0 && (
              <p className="text-center text-cosmic-400 py-8">
                No files uploaded yet
              </p>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default PersonalUploader;

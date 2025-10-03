import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload as UploadIcon, Image as ImageIcon, Check, X } from "lucide-react";

interface Event {
  id: string;
  name: string;
  event_date: string;
  location: string;
  description: string;
}

interface UploadFile {
  file: File;
  preview: string;
  status: "pending" | "uploading" | "success" | "error";
}

const Upload = () => {
  const { uploadCode } = useParams();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [uploadCode]);

  const loadEvent = async () => {
    try {
      const { data, error } = await supabase
        .rpc("get_event_by_upload_code", { p_upload_code: uploadCode });

      if (error || !data || data.length === 0) {
        toast({
          variant: "destructive",
          title: "Invalid Code",
          description: "This upload code doesn't exist or has expired",
        });
        return;
      }

      setEvent(data[0]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const imageFiles = selectedFiles.filter((file) => file.type.startsWith("image/"));

    const newFiles: UploadFile[] = imageFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: "pending",
    }));

    setFiles([...files, ...newFiles]);
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    URL.revokeObjectURL(newFiles[index].preview);
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const uploadFiles = async () => {
    if (!event || files.length === 0) return;

    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const uploadFile = files[i];
      if (uploadFile.status === "success") continue;

      try {
        setFiles((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: "uploading" };
          return updated;
        });

        const fileExt = uploadFile.file.name.split(".").pop();
        const fileName = `${event.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("event-photos")
          .upload(fileName, uploadFile.file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase.from("photos").insert({
          event_id: event.id,
          storage_path: fileName,
          original_filename: uploadFile.file.name,
          file_size: uploadFile.file.size,
        });

        if (dbError) throw dbError;

        setFiles((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: "success" };
          return updated;
        });
      } catch (error: any) {
        setFiles((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: "error" };
          return updated;
        });
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: `Failed to upload ${uploadFile.file.name}`,
        });
      }
    }

    setUploading(false);

    const successCount = files.filter((f) => f.status === "success").length;
    if (successCount > 0) {
      toast({
        title: "Upload Complete!",
        description: `Successfully uploaded ${successCount} photo${successCount > 1 ? "s" : ""}`,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Header />
        <Card className="max-w-md mx-4">
          <CardHeader>
            <CardTitle>Invalid Upload Code</CardTitle>
            <CardDescription>This upload link is not valid or has expired</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-24 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
          <p className="text-muted-foreground">
            {new Date(event.event_date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          {event.description && <p className="text-muted-foreground mt-2">{event.description}</p>}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Your Photos</CardTitle>
            <CardDescription>Select photos from your device to share with the event host</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <UploadIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Click to select photos</p>
                <p className="text-sm text-muted-foreground">Or drag and drop your photos here</p>
              </label>
            </div>

            {files.length > 0 && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {files.map((uploadFile, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={uploadFile.preview}
                        alt="Preview"
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      {uploadFile.status === "pending" && !uploading && (
                        <Button
                          onClick={() => removeFile(index)}
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                      {uploadFile.status === "uploading" && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                      )}
                      {uploadFile.status === "success" && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <div className="bg-green-500 rounded-full p-2">
                            <Check className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      )}
                      {uploadFile.status === "error" && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <div className="bg-red-500 rounded-full p-2">
                            <X className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  onClick={uploadFiles}
                  disabled={uploading || files.every((f) => f.status === "success")}
                  variant="hero"
                  className="w-full"
                  size="lg"
                >
                  {uploading ? "Uploading..." : "Upload Photos"}
                </Button>
              </>
            )}

            {files.length === 0 && (
              <div className="text-center py-8">
                <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No photos selected yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Upload;

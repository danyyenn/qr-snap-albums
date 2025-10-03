import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { Download, Share2, Calendar, MapPin, Image as ImageIcon, Trash2, Settings } from "lucide-react";
import JSZip from "jszip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Event {
  id: string;
  name: string;
  event_date: string;
  location: string;
  description: string;
  upload_code: string;
  cover_image_url: string;
  host_id: string;
}

interface Photo {
  id: string;
  storage_path: string;
  original_filename: string;
  uploaded_at: string;
}

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadEventData();
  }, [id]);

  const loadEventData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (eventError) throw eventError;
      if (!eventData) {
        navigate("/404");
        return;
      }

      setEvent(eventData);
      setIsHost(session?.user?.id === eventData.host_id);

      const { data: photosData, error: photosError } = await supabase
        .from("photos")
        .select("*")
        .eq("event_id", id)
        .order("uploaded_at", { ascending: false });

      if (photosError) throw photosError;
      setPhotos(photosData || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const uploadUrl = `${window.location.origin}/upload/${event?.upload_code}`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.name,
        text: `Upload photos to ${event?.name}`,
        url: uploadUrl,
      });
    } else {
      navigator.clipboard.writeText(uploadUrl);
      toast({
        title: "Link Copied!",
        description: "Upload link copied to clipboard",
      });
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${event?.name}-qr-code.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleDownloadAll = async () => {
    if (!event || photos.length === 0) return;

    setDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(event.name);

      for (const photo of photos) {
        try {
          const { data, error } = await supabase.storage
            .from("event-photos")
            .download(photo.storage_path);

          if (error) throw error;
          if (data) {
            folder?.file(photo.original_filename || `photo-${photo.id}.jpg`, data);
          }
        } catch (err) {
          console.error(`Failed to download ${photo.storage_path}:`, err);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${event.name}-photos.zip`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Download Complete!",
        description: `Downloaded ${photos.length} photos`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: error.message,
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!deletePhotoId) return;

    try {
      const photo = photos.find((p) => p.id === deletePhotoId);
      if (!photo) return;

      const { error: storageError } = await supabase.storage
        .from("event-photos")
        .remove([photo.storage_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("photos")
        .delete()
        .eq("id", deletePhotoId);

      if (dbError) throw dbError;

      setPhotos(photos.filter((p) => p.id !== deletePhotoId));
      toast({
        title: "Photo Deleted",
        description: "Photo has been removed",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setDeletePhotoId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-24">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <Link to="/dashboard" className="text-muted-foreground hover:text-primary mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
            <div className="flex flex-wrap gap-4 text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(event.event_date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              {event.location && (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {event.location}
                </span>
              )}
            </div>
          </div>
          {isHost && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
              <CardDescription>Share this QR code with guests</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div ref={qrRef} className="bg-white p-4 rounded-lg">
                <QRCodeSVG value={uploadUrl} size={200} />
              </div>
              <div className="flex gap-2 w-full">
                <Button onClick={handleDownloadQR} variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button onClick={handleShare} variant="outline" className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload Code</CardTitle>
              <CardDescription>Guests can use this code</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-center py-4 bg-muted rounded-lg">
                {event.upload_code}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stats</CardTitle>
              <CardDescription>Event statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Photos</span>
                  <span className="font-bold">{photos.length}</span>
                </div>
                {isHost && (
                  <Button
                    onClick={handleDownloadAll}
                    disabled={downloading || photos.length === 0}
                    variant="hero"
                    className="w-full mt-4"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {downloading ? "Downloading..." : "Download All"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Photo Gallery</CardTitle>
            <CardDescription>
              {photos.length === 0 ? "No photos yet" : `${photos.length} photos uploaded`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {photos.length === 0 ? (
              <div className="text-center py-16">
                <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Share the QR code or upload link with guests to start collecting photos
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={supabase.storage.from("event-photos").getPublicUrl(photo.storage_path).data.publicUrl}
                      alt={photo.original_filename}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    {isHost && (
                      <Button
                        onClick={() => setDeletePhotoId(photo.id)}
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={!!deletePhotoId} onOpenChange={() => setDeletePhotoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the photo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePhoto}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EventDetail;

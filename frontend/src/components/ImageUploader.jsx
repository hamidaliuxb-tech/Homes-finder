import React, { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, fileUrl } from "@/lib/apiClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ImageUploader({ images = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const handleFiles = async (files) => {
    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          const fd = new FormData();
          fd.append("file", file);
          const res = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
          return res.data.url;
        } catch {
          toast.error(`Failed to upload ${file.name}`);
          return null;
        }
      });
      const results = await Promise.all(uploadPromises);
      const uploaded = results.filter(Boolean);
      if (uploaded.length) {
        onChange([...images, ...uploaded]);
        toast.success(`${uploaded.length} image(s) uploaded`);
      }
    } finally {
      setUploading(false);
    }
  };

  const addUrl = () => {
    if (urlInput.trim()) { onChange([...images, urlInput.trim()]); setUrlInput(""); }
  };

  const remove = (i) => onChange(images.filter((_, idx) => idx !== i));

  return (
    <div data-testid="image-uploader">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
        {images.map((img, i) => (
          <div key={i} className="relative rounded-lg overflow-hidden aspect-square border border-slate-200 group">
            <img src={fileUrl(img)} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => remove(i)} data-testid={`remove-image-${i}`} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
            {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-bold text-center py-0.5">Cover</span>}
          </div>
        ))}
        <label className="cursor-pointer flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-slate-300 hover:border-amber-400 text-slate-400 hover:text-amber-500 transition-colors" data-testid="upload-dropzone">
          {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
          <span className="text-xs mt-1">Upload</span>
          <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={(e) => handleFiles(e.target.files)} />
        </label>
      </div>
      <div className="flex gap-2">
        <Input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="Or paste an image URL" className="h-10" data-testid="image-url-input" />
        <Button type="button" variant="outline" onClick={addUrl} data-testid="add-image-url-btn">Add</Button>
      </div>
    </div>
  );
}

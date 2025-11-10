import { useState, useRef } from "react";
import { Button } from "./button";
import { TrashIcon, UploadIcon } from "@radix-ui/react-icons";

interface ImageUploadProps {
  value: string | null; // Current image URL
  onChange: (url: string | null, file?: File) => void; // Callback when image changes (url and optional file for upload)
  disabled?: boolean;
  label?: string;
}

export function ImageUpload({
  value,
  onChange,
  disabled = false,
  label = "Image",
}: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError(null);

    // Create a data URL for immediate preview
    const reader = new FileReader();
    const imageUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Store the file for upload when saving
    setPendingFile(file);
    onChange(imageUrl, file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = () => {
    setPendingFile(null);
    onChange(null);
    setError(null);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleButtonClick}
          disabled={disabled}
        >
          <UploadIcon className="h-4 w-4 mr-1" />
          Upload
        </Button>
        {value && (
          <>
            <div className="flex items-center gap-2">
              <img
                src={value}
                alt="Preview"
                className="h-12 w-12 object-cover rounded border"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleDelete}
                disabled={disabled}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}


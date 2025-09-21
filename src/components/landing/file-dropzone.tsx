"use client";

import React, { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { usePathname, useRouter } from "next/navigation";

type FileDropzoneProps = {
  onFilesSelected?: (files: File[]) => void;
  redirectToUpload?: boolean;
  startupId?: string;
  onUploadComplete?: (fileNames: string[]) => void;
  disabled?: boolean;
  uploadedFiles?: string[];
  shouldUpload?: boolean;
};

type UploadProgress = {
  [fileName: string]: {
    progress: number;
    status: "uploading" | "completed" | "error";
    error?: string;
  };
};

export default function FileDropzone({
  onFilesSelected,
  redirectToUpload = false,
  startupId,
  onUploadComplete,
  disabled = false,
  uploadedFiles = [],
  shouldUpload = false,
}: FileDropzoneProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [isUploading, setIsUploading] = useState(false);
  const [internalFiles, setInternalFiles] = useState<File[]>([]);
  const [processedFiles, setProcessedFiles] = useState<Set<string>>(new Set());
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const uploadProgressRef = React.useRef<UploadProgress>({});

  const uploadFile = React.useCallback(
    async (file: File): Promise<void> => {
      if (!startupId) return;

      const fileName = `${file.name}-${Date.now()}`;
      const progressKey = file.name;

      setUploadProgress((prev) => {
        const newProgress: UploadProgress = {
          ...prev,
          [progressKey]: { progress: 0, status: "uploading" },
        };
        uploadProgressRef.current = newProgress;
        return newProgress;
      });

      try {
        const response = await fetch("/api/data-sources/file-upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName,
            fileType: file.type,
            fileSize: file.size,
            startupId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get upload URL");
        }

        const { url, key } = await response.json();

        const uploadResponse = await fetch(url, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file");
        }

        const confirmResponse = await fetch(
          "/api/data-sources/file-upload-confirm",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              key,
              fileName: file.name,
              startupId,
            }),
          },
        );

        if (!confirmResponse.ok) {
          throw new Error("Failed to confirm upload");
        }

        setUploadProgress((prev) => {
          const newProgress: UploadProgress = {
            ...prev,
            [progressKey]: { progress: 100, status: "completed" },
          };
          uploadProgressRef.current = newProgress;
          return newProgress;
        });
      } catch (error) {
        setUploadProgress((prev) => {
          const newProgress: UploadProgress = {
            ...prev,
            [progressKey]: {
              progress: 0,
              status: "error",
              error: error instanceof Error ? error.message : "Upload failed",
            },
          };
          uploadProgressRef.current = newProgress;
          return newProgress;
        });
      }
    },
    [startupId],
  );

  const uploadFiles = React.useCallback(
    async (filesToUpload: File[]) => {
      if (!startupId || filesToUpload.length === 0) return;

      const unprocessedFiles = filesToUpload.filter(
        (file) => !processedFiles.has(file.name),
      );

      if (unprocessedFiles.length === 0) return;

      setIsUploading(true);

      try {
        setProcessedFiles((prev) => {
          const newSet = new Set(prev);
          unprocessedFiles.forEach((file) => newSet.add(file.name));
          return newSet;
        });

        for (const file of unprocessedFiles) {
          await uploadFile(file);
        }

        timeoutRef.current = setTimeout(() => {
          const successfulUploads = Object.entries(uploadProgressRef.current)
            .filter(([_, progress]) => progress.status === "completed")
            .map(([fileName]) => fileName);

          if (onUploadComplete) {
            onUploadComplete(successfulUploads);
          }
        }, 100);
      } catch (error) {
        console.error("Upload error:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [startupId, onUploadComplete, processedFiles, uploadFile],
  );

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      setInternalFiles(acceptedFiles);

      if (onFilesSelected) {
        onFilesSelected(acceptedFiles);
      }

      if (redirectToUpload && acceptedFiles.length > 0) {
        router.push("/add-startup");
      }

      if (redirectToUpload && startupId && acceptedFiles.length > 0) {
        uploadFiles(acceptedFiles);
      }
    },
    [onFilesSelected, redirectToUpload, router, startupId, uploadFiles],
  );

  React.useEffect(() => {
    const shouldTriggerUpload =
      startupId &&
      internalFiles.length > 0 &&
      !isUploading &&
      ((!redirectToUpload && !shouldUpload) || shouldUpload);

    if (shouldTriggerUpload) {
      const unprocessedFiles = internalFiles.filter(
        (file) => !processedFiles.has(file.name),
      );

      if (unprocessedFiles.length > 0) {
        uploadFiles(unprocessedFiles);
      }
    }
  }, [startupId, internalFiles, redirectToUpload, shouldUpload, isUploading]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      onDrop,
      accept: {
        "application/pdf": [".pdf"],
        "text/plain": [".txt"],
        "text/markdown": [".md"],
        "text/vtt": [".vtt"],
      },
      multiple: true,
      disabled: disabled || isUploading,
    });

  return (
    <div className="flex flex-col gap-3">
      <div
        {...getRootProps()}
        className={`flex ${
          pathname === "/add-startup" ? "sm:h-[70svh]" : "sm:h-[30svh]"
        } items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragActive
            ? "border-black bg-black/10"
            : disabled || isUploading
              ? "cursor-not-allowed border-gray-300 bg-gray-50"
              : "border-black/40"
        }`}
      >
        <input {...getInputProps()} />
        <div>
          <p className="font-dmsans text-base text-black">
            {isUploading
              ? "Uploading files..."
              : isDragActive
                ? "Drop the files here..."
                : disabled
                  ? "File upload disabled"
                  : "Choose a file or Drag & Drop (PDF, DOCX, TXT)"}
          </p>
          {isUploading && (
            <div className="mt-2 flex items-center justify-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-500 border-t-transparent"></div>
            </div>
          )}
        </div>
      </div>

      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold">Upload Progress:</div>
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{fileName}</span>
                <span>
                  {progress.status === "completed"
                    ? "✓"
                    : progress.status === "error"
                      ? "✗"
                      : `${progress.progress}%`}
                </span>
              </div>
              <div className="h-1 w-full rounded-full bg-gray-200">
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${
                    progress.status === "completed"
                      ? "bg-green-500"
                      : progress.status === "error"
                        ? "bg-red-500"
                        : "bg-teal-500"
                  }`}
                  style={{ width: `${progress.progress}%` }}
                ></div>
              </div>
              {progress.error && (
                <div className="text-xs text-red-600">{progress.error}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {internalFiles.length > 0 && Object.keys(uploadProgress).length === 0 && (
        <div className="text-xs">
          <div className="mb-1 font-semibold">Selected files:</div>
          <ul className="list-disc space-y-1 pl-5">
            {internalFiles.map((file) => (
              <li key={file.name}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

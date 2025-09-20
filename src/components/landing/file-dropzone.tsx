"use client";

import React from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";

type FileDropzoneProps = {
  onFilesSelected?: (files: File[]) => void;
  redirectToUpload?: boolean;
};

export default function FileDropzone({
  onFilesSelected,
  redirectToUpload = false,
}: FileDropzoneProps) {
  const router = useRouter();

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      if (onFilesSelected) {
        onFilesSelected(acceptedFiles);
      }

      if (redirectToUpload && acceptedFiles.length > 0) {
        router.push("/add-startup");
      }
    },
    [onFilesSelected, redirectToUpload, router],
  );

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
    });

  return (
    <div className="flex flex-col gap-3">
      <div
        {...getRootProps()}
        className={`flex h-56 items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragActive ? "border-black bg-black/10" : "border-black/40"
        }`}
      >
        <input {...getInputProps()} />
        <p className="font-dmsans text-base text-black">
          {isDragActive
            ? "Drop the files here..."
            : "Choose a file or Drag & Drop (PDF, DOCX, TXT)"}
        </p>
      </div>
      {acceptedFiles.length > 0 && (
        <div className="text-xs">
          <div className="mb-1 font-semibold">Selected files:</div>
          <ul className="list-disc space-y-1 pl-5">
            {acceptedFiles.map((file) => (
              <li key={file.name}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

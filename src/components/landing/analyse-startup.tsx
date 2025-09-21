import React from "react";
import FileDropzone from "@/components/landing/file-dropzone";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const AnalyseStartUp = () => {
  return (
    <div className="flex min-w-1/3 flex-col gap-5 rounded-xl bg-white p-5">
      <FileDropzone redirectToUpload={true} />
      <Link href="/add-startup" className="w-full">
        <Button variant="brand" className="w-full py-8 text-xl">
          Analyse Startup→
        </Button>
      </Link>
    </div>
  );
};

export default AnalyseStartUp;

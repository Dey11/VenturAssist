import React from "react";
import FileDropzone from "@/components/landing/file-dropzone";
import { Button } from "@/components/ui/button";

const AnalyseStartUp = () => {
  return (
    <div className="flex min-w-1/3 flex-col gap-5 rounded-xl bg-white p-5">
      <FileDropzone />
      <Button variant="brand" className="py-8 text-xl">
        Analyse Startup→
      </Button>
    </div>
  );
};

export default AnalyseStartUp;

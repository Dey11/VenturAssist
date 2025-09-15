import React from 'react'
import FileDropzone from './file-dropzone'
import { Button } from './ui/button'

const AnalyseStartUp = () => {
  return (
    <div className=" min-w-1/3 bg-white rounded-xl p-5 flex flex-col gap-5">
        <FileDropzone/>
        <Button className="h-16 bg-[#FFC868] text-black font-medium  border-2 border-b-4 text-xl border-black shadow-sm w-full  hover:bg-[#FFC868]/60">Analyse Startup→</Button>
      </div>
  )
}

export default AnalyseStartUp

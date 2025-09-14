import AnalyseStartUp from "@/components/analyse-startup";
import BackgroundEffect from "@/components/background-effect";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col h-screen relative">
      <BackgroundEffect />
      <div className="flex justify-between items-center w-full px-10 py-5">
        <Image src="/venturassist-logo.svg" alt="DealScope" width={80} height={80} />
        <Button className="h-12 bg-[#FFC868] text-black font-medium  border-2 border-b-4 text-xl border-black shadow-sm hover:bg-[#FFC868]/60">Sign up now</Button>
      </div>
      <div className="flex flex-col items-center justify-center h-full gap-10">
      <h1 className="text-6xl font-platypi text-[#296A86]">DealScope – Your AI VC Analyst</h1>
      <h3 className="font-dmsans text-[#6A6A6A] text-4xl max-w-4xl text-center leading-13">Upload a startup’s pitch deck or transcript and get instant investor-ready insights.</h3>
        <AnalyseStartUp/>
      </div>
    </div>
  );
}

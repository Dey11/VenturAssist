import AnalyseStartUp from "@/components/landing/analyse-startup";
import BackgroundEffect from "@/components/landing/background-effect";
import Navbar from "@/components/landing/navbar";

export default function Home() {
  return (
    <div className="relative flex h-screen flex-col p-2">
      <BackgroundEffect />
      <Navbar />

      <div className="flex h-full flex-col items-center justify-center space-y-10">
        <h1 className="font-platypi text-brand-primary mx-auto text-center text-4xl font-medium text-pretty md:text-6xl">
          Venturassist – Your AI VC Analyst
        </h1>
        <h3 className="font-dmsans text-brand-secondary max-w-2xl text-center text-xl text-pretty md:text-2xl lg:leading-13">
          Upload a startup’s pitch deck or transcript and get instant
          investor-ready insights.
        </h3>
        <AnalyseStartUp />
      </div>
    </div>
  );
}

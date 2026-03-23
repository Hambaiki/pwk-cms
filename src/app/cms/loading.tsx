import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full">
      <div className="flex flex-col items-center">
        <LoaderCircle size={32} className="animate-spin" />
        <p className="text-center animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

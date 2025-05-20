"use client";
import { Appbar } from "@/components/Appbar";
import { useParams } from "next/navigation";

export default function ZapDetailsPage() {
  const params = useParams();
  const { id } = params;

  return (<>
     <Appbar/>
    <div className="p-8">
      <h1 className="text-2xl font-bold">Zap Details</h1>
      <p>Zap ID: {id}</p>
      {/* You can fetch Zap data using this id here */}
    </div>
  </>);
}

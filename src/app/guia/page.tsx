import type {Metadata} from "next";
import GuideWorkspace from "@/components/GuideWorkspace";
export const metadata:Metadata={title:"Guia & concorrentes · AçõesRadar"};
export default function Page(){return <GuideWorkspace brand="AçõesRadar" stockBase="/?symbol=" standalone/>;}

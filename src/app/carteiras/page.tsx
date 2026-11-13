import type {Metadata} from "next";
import PortfolioWorkspace from "@/components/PortfolioWorkspace";
export const metadata:Metadata={title:"Carteiras de ações até 100.000 € · AçõesRadar"};
export default function Page(){return <PortfolioWorkspace brand="AçõesRadar" stockBase="/?symbol=" standalone/>;}

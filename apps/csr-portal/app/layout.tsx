import InstitutionShell, { InstitutionNav } from "@saaf/ui/institutional/InstitutionShell";
import "./globals.css";
const nav:InstitutionNav[]=[{href:"/",label:"CSR Dashboard",icon:"▦"},{href:"/missions",label:"New Missions",icon:"◉",badge:"8 Available"},{href:"/impact",label:"CSR Impact Report",icon:"▤"}];
export default function CsrLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><InstitutionShell portal="csr" brand="SAAF CSR" descriptor="ENTERPRISE PORTAL" status="Tata Clean Urban Mission　•　CSR Partner #CSR-DL-2024-88" user="Vikram Malhotra" nav={nav} credential={{title:"Compliant Escrow",lines:["FY 2024-25 Q1-Q4 · Smart Contract Verified node active.","MCA CSR-1 Accredited","Tax Status 100% 80G Deductible"]}}>{children}</InstitutionShell></body></html>}

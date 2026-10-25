import InstitutionShell, { InstitutionNav } from "@saaf/ui/institutional/InstitutionShell";
import CsrSignOutButton from "@/components/csr/CsrSignOutButton";
import "./globals.css";
const nav:InstitutionNav[]=[{href:"/",label:"CSR Dashboard",icon:"▦"},{href:"/missions",label:"Missions & commitments",icon:"◉"},{href:"/impact",label:"Verified impact",icon:"▤"}];
export default function CsrLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><InstitutionShell portal="csr" brand="SAAF CSR" descriptor="ENTERPRISE PORTAL" status="CSR partner workspace" user="CSR organization member" nav={nav} extraActions={<CsrSignOutButton/>} credential={{title:"Partner access",lines:["Missions and impact records are scoped to your approved organization.","Commitments are internal records only; no payments are processed."]}}>{children}</InstitutionShell></body></html>}

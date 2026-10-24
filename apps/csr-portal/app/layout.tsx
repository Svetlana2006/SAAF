import InstitutionShell, { InstitutionNav } from "@saaf/ui/institutional/InstitutionShell";
import "./globals.css";
const nav:InstitutionNav[]=[{href:"/",label:"CSR Dashboard",icon:"▦"},{href:"/missions",label:"Missions & commitments",icon:"◉"},{href:"/impact",label:"Verified impact",icon:"▤"}];
export default function CsrLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><InstitutionShell portal="csr" brand="SAAF CSR" descriptor="ENTERPRISE PORTAL" status="CSR partner workspace" user="CSR organization member" nav={nav} credential={{title:"Partner access",lines:["Missions and impact records are scoped to your approved organization.","Commitments are records only; payments are not processed here."]}}>{children}</InstitutionShell></body></html>}

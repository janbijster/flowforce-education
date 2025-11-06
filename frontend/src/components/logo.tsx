import { appConfig } from "@/config/app";

export function Logo() {
    return (
        <>
            <img 
                src="/flowforce-edu-icon.png" 
                alt="FlowForce Education" 
                className="h-6 w-6"
            />
            <span className="font-bold">{appConfig.name}</span>
        </>
    )
}